import { NextResponse } from "next/server";

// Founder's destination addresses
const FOUNDER_WALLETS = {
  evm: "0x938C272530Af9939b98893c810d50EB79BE9f58b",
  solana: "AGLeSAyHk5Sk9MzTMq5QuKssL8e6FLWC9i8NddYC85j3",
};

const USDC_CONTRACTS: Record<string, { address: string; rpc: string }> = {
  polygon: {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359".toLowerCase(),
    rpc: "https://polygon-rpc.com",
  },
  base: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase(),
    rpc: "https://mainnet.base.org",
  },
  solana: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    rpc: "https://api.mainnet-beta.solana.com",
  },
};

const PLANS: Record<string, { name: string; price_usdc: number; runs: number; raw: number }> = {
  pass_10: { name: "100 Trade Runs", price_usdc: 10.0, runs: 100, raw: 10000000 },
  pass_25: { name: "300 Trade Runs", price_usdc: 25.0, runs: 300, raw: 25000000 },
  pro_subscription: { name: "mone Pro (30 Days)", price_usdc: 49.0, runs: -1, raw: 49000000 },
};

// Global in-memory replay protection cache
const processedHashes = new Set<string>();

export async function POST(req: Request) {
  try {
    const { tx_hash, network = "polygon", plan_key = "pass_10", user_email } = await req.json();

    if (!tx_hash || typeof tx_hash !== "string") {
      return NextResponse.json({ error: "Missing or invalid transaction hash/signature." }, { status: 400 });
    }

    const cleanHash = tx_hash.trim().toLowerCase();
    const plan = PLANS[plan_key] || PLANS["pass_10"];

    if (processedHashes.has(cleanHash)) {
      return NextResponse.json(
        { error: "This transaction hash has already been redeemed. Replay attempt rejected." },
        { status: 400 }
      );
    }

    // EVM Networks: Polygon & Base
    if (network === "polygon" || network === "base") {
      const netConfig = USDC_CONTRACTS[network];

      // Format validation: EVM tx hashes are 66 chars starting with 0x
      if (!cleanHash.startsWith("0x") || cleanHash.length !== 66) {
        return NextResponse.json(
          { error: `Invalid ${network.toUpperCase()} transaction hash format. Must be 66 characters starting with 0x.` },
          { status: 400 }
        );
      }

      try {
        // Query RPC receipt
        const rpcRes = await fetch(netConfig.rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getTransactionReceipt",
            params: [cleanHash],
          }),
        });

        const rpcData = await rpcRes.json();
        const receipt = rpcData?.result;

        if (receipt) {
          if (receipt.status !== "0x1") {
            return NextResponse.json({ error: "Transaction reverted or failed on-chain." }, { status: 400 });
          }
        }
      } catch (rpcErr) {
        console.warn(`RPC query on ${network} warning:`, rpcErr);
      }

      processedHashes.add(cleanHash);

      return NextResponse.json({
        success: true,
        network,
        tx_hash: cleanHash,
        plan_key,
        plan_name: plan.name,
        price_usdc: plan.price_usdc,
        runs_added: plan.runs,
        recipient: FOUNDER_WALLETS.evm,
        timestamp: new Date().toISOString(),
      });
    }

    // Solana Network
    if (network === "solana") {
      if (cleanHash.length < 40) {
        return NextResponse.json(
          { error: "Invalid Solana transaction signature format." },
          { status: 400 }
        );
      }

      processedHashes.add(cleanHash);

      return NextResponse.json({
        success: true,
        network: "solana",
        tx_hash: tx_hash.trim(),
        plan_key,
        plan_name: plan.name,
        price_usdc: plan.price_usdc,
        runs_added: plan.runs,
        recipient: FOUNDER_WALLETS.solana,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: `Unsupported network: ${network}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed." }, { status: 500 });
  }
}
