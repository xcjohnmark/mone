import { NextResponse } from "next/server";

// Founder's destination addresses
const FOUNDER_WALLETS = {
  evm: "0x938C272530Af9939b98893c810d50EB79BE9f58b",
  solana: "AGLeSAyHk5Sk9MzTMq5QuKssL8e6FLWC9i8NddYC85j3",
};

// Official Circle USDC Token Contracts & Redundant Multi-RPC Pools
const USDC_CONTRACTS: Record<string, { address: string; decimals: number; rpcs: string[] }> = {
  polygon: {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359".toLowerCase(),
    decimals: 6,
    rpcs: [
      "https://polygon-rpc.com",
      "https://polygon-bor-rpc.publicnode.com",
      "https://1rpc.io/matic",
      "https://rpc.ankr.com/polygon",
    ],
  },
  base: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase(),
    decimals: 6,
    rpcs: [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
      "https://1rpc.io/base",
    ],
  },
  solana: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    rpcs: [
      "https://api.mainnet-beta.solana.com",
      "https://solana-mainnet.g.alchemy.com/v2/demo",
      "https://rpc.ankr.com/solana",
    ],
  },
};

const PLANS: Record<string, { name: string; price_usdc: number; runs: number; days?: number }> = {
  pass_10: { name: "100 Trade Runs", price_usdc: 10.0, runs: 100 },
  pass_25: { name: "300 Trade Runs", price_usdc: 25.0, runs: 300 },
  pro_subscription: { name: "mone Pro (30 Days Unlimited)", price_usdc: 49.0, runs: -1, days: 30 },
};

// Fee tolerance margin: 2% buffer ($0.20 on $10, $0.50 on $25, $1.00 on $49)
const TOLERANCE_PCT = 0.02;

// In-memory replay protection cache
const processedHashes = new Set<string>();

async function queryRpcWithFailover(rpcs: string[], payload: any, timeoutMs = 7000): Promise<any> {
  for (const rpc of rpcs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.result !== undefined || data.error !== undefined) {
          return data;
        }
      }
    } catch {
      // Continue to next failover RPC
    }
  }
  return null;
}

function evaluatePayment(actualUsdc: number, expectedPlanKey: string) {
  const plan = PLANS[expectedPlanKey] || PLANS.pass_10;
  const expectedUsdc = plan.price_usdc;
  const minAcceptable = expectedUsdc * (1.0 - TOLERANCE_PCT);

  if (actualUsdc >= minAcceptable) {
    let bonusRuns = 0;
    if (actualUsdc > expectedUsdc && expectedPlanKey !== "pro_subscription") {
      bonusRuns = Math.floor((actualUsdc - expectedUsdc) * 10);
    }
    const runsGranted = plan.runs === -1 ? -1 : plan.runs + bonusRuns;
    return {
      status: "FULL_CREDIT",
      plan_activated: expectedPlanKey,
      plan_name: plan.name,
      runs_granted: runsGranted,
      days_granted: plan.days,
      actual_usdc: actualUsdc,
      expected_usdc: expectedUsdc,
      note: actualUsdc >= expectedUsdc
        ? "Payment verified and credited in full."
        : `Accepted within fee tolerance (${actualUsdc.toFixed(2)}/${expectedUsdc.toFixed(2)} USDC).`,
    };
  }

  // Underpayment guardrail
  if (expectedPlanKey === "pro_subscription" && actualUsdc >= 24.50) {
    return {
      status: "PARTIAL_CREDIT",
      plan_activated: "pass_25",
      plan_name: "300 Trade Runs (Underpayment Fallback)",
      runs_granted: 300,
      days_granted: undefined,
      actual_usdc: actualUsdc,
      expected_usdc: expectedUsdc,
      note: `Pro requires 49 USDC, but ${actualUsdc.toFixed(2)} USDC was received. Credited 300 Runs Pass ($25 value). Send remaining ${(49 - actualUsdc).toFixed(2)} USDC to activate Pro.`,
    };
  }

  // Pro-rated runs for partial payment ($0.10/run)
  const proratedRuns = Math.max(1, Math.floor(actualUsdc * 10));
  return {
    status: "PRO_RATED_CREDIT",
    plan_activated: proratedRuns >= 100 ? "pass_10" : "custom_runs",
    plan_name: `${proratedRuns} Pro-Rated Trade Runs`,
    runs_granted: proratedRuns,
    days_granted: undefined,
    actual_usdc: actualUsdc,
    expected_usdc: expectedUsdc,
    note: `Fee/Underpayment guardrail: Received ${actualUsdc.toFixed(2)} USDC (plan required ${expectedUsdc.toFixed(2)} USDC). Credited ${proratedRuns} runs ($0.10/run). No money lost.`,
  };
}

export async function POST(req: Request) {
  try {
    const { tx_hash, network = "polygon", plan_key = "pass_10", user_email } = await req.json();

    if (!tx_hash || typeof tx_hash !== "string") {
      return NextResponse.json({ error: "Missing or invalid transaction hash/signature." }, { status: 400 });
    }

    const cleanHash = tx_hash.trim().toLowerCase();
    const plan = PLANS[plan_key] || PLANS.pass_10;

    if (processedHashes.has(cleanHash)) {
      return NextResponse.json(
        { error: "This transaction hash has already been redeemed. Replay attempt rejected." },
        { status: 400 }
      );
    }

    // EVM Networks: Polygon & Base
    if (network === "polygon" || network === "base") {
      const netConfig = USDC_CONTRACTS[network];

      if (!cleanHash.startsWith("0x") || cleanHash.length !== 66) {
        return NextResponse.json(
          { error: `Invalid ${network.toUpperCase()} transaction hash format. Must be 66 characters starting with 0x.` },
          { status: 400 }
        );
      }

      // Query with Multi-RPC Failover
      const rpcPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [cleanHash],
      };

      const rpcData = await queryRpcWithFailover(netConfig.rpcs, rpcPayload);
      const receipt = rpcData?.result;

      if (!receipt) {
        return NextResponse.json(
          { error: "Transaction not found on-chain yet. Please wait a few seconds for block confirmation." },
          { status: 400 }
        );
      }

      if (receipt.status !== "0x1") {
        return NextResponse.json({ error: "Transaction reverted or failed on-chain." }, { status: 400 });
      }

      // Strict ERC-20 Transfer log verification
      const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      const founderEvm = FOUNDER_WALLETS.evm.toLowerCase();
      let matched = false;
      let actualUsdc = 0;

      for (const log of receipt.logs || []) {
        const contractAddr = (log.address || "").toLowerCase();
        const topics = log.topics || [];
        if (contractAddr === netConfig.address && topics.length >= 3 && topics[0].toLowerCase() === transferTopic) {
          const toAddr = "0x" + topics[2].slice(-40).toLowerCase();
          if (toAddr === founderEvm) {
            const rawVal = parseInt(log.data || "0x0", 16);
            actualUsdc = rawVal / Math.pow(10, netConfig.decimals);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        return NextResponse.json(
          { error: `No confirmed USDC transfer to founder address (${FOUNDER_WALLETS.evm}) found in this transaction.` },
          { status: 400 }
        );
      }

      const evalRes = evaluatePayment(actualUsdc, plan_key);
      processedHashes.add(cleanHash);

      return NextResponse.json({
        success: true,
        network,
        tx_hash: cleanHash,
        recipient: FOUNDER_WALLETS.evm,
        timestamp: new Date().toISOString(),
        ...evalRes,
      });
    }

    // Solana Network
    if (network === "solana") {
      const solConfig = USDC_CONTRACTS.solana;
      if (cleanHash.length < 64) {
        return NextResponse.json(
          { error: "Invalid Solana transaction signature format (must be at least 64 characters)." },
          { status: 400 }
        );
      }

      const solPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          tx_hash.trim(),
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ],
      };

      const rpcData = await queryRpcWithFailover(solConfig.rpcs, solPayload);
      const txData = rpcData?.result;

      if (!txData) {
        return NextResponse.json(
          { error: "Solana transaction signature not found on mainnet yet. Wait a few seconds for confirmation." },
          { status: 400 }
        );
      }

      const meta = txData.meta || {};
      if (meta.err !== null && meta.err !== undefined) {
        return NextResponse.json({ error: "Solana transaction failed or reverted on-chain." }, { status: 400 });
      }

      // Check token balances delta
      const postBalances = meta.postTokenBalances || [];
      const preBalances = meta.preTokenBalances || [];
      let actualUsdc = 0;
      let matched = false;

      for (const post of postBalances) {
        if (post.owner === FOUNDER_WALLETS.solana && post.mint === solConfig.address) {
          const postUi = post.uiTokenAmount?.uiAmount || 0;
          const preMatch = preBalances.find((p: any) => p.accountIndex === post.accountIndex);
          const preUi = preMatch?.uiTokenAmount?.uiAmount || 0;
          const delta = postUi - preUi;
          if (delta > 0) {
            actualUsdc = delta;
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        return NextResponse.json(
          { error: `No confirmed USDC transfer to founder Solana wallet (${FOUNDER_WALLETS.solana}) found in transaction.` },
          { status: 400 }
        );
      }

      const evalRes = evaluatePayment(actualUsdc, plan_key);
      processedHashes.add(cleanHash);

      return NextResponse.json({
        success: true,
        network: "solana",
        tx_hash: tx_hash.trim(),
        recipient: FOUNDER_WALLETS.solana,
        timestamp: new Date().toISOString(),
        ...evalRes,
      });
    }

    return NextResponse.json({ error: `Unsupported network: ${network}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed." }, { status: 500 });
  }
}
