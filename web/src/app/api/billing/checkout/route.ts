import { NextResponse } from "next/server";

const PRODUCTS: Record<string, { name: string; amount_usd: number; runs: number }> = {
  pass_10: { name: "100 Trade Runs", amount_usd: 10.0, runs: 100 },
  pass_25: { name: "300 Trade Runs", amount_usd: 25.0, runs: 300 },
  pro_subscription: { name: "mone Pro", amount_usd: 49.0, runs: -1 },
  fuel_10: { name: "100 Trade Runs", amount_usd: 10.0, runs: 100 },
  fuel_25: { name: "300 Trade Runs", amount_usd: 25.0, runs: 300 },
};

export async function POST(req: Request) {
  try {
    const { product_key, customer_email, user_id } = await req.json();
    const prod = PRODUCTS[product_key];

    if (!prod) {
      return NextResponse.json({ error: `Unknown product: ${product_key}` }, { status: 400 });
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const env = process.env.DODO_PAYMENTS_ENVIRONMENT || "test";
    const baseUrl = env === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mono-agent.vercel.app";

    if (!apiKey) {
      // Mock / sandbox checkout response
      const sessionId = `dodo_sess_${Math.random().toString(36).substring(2, 14)}`;
      return NextResponse.json({
        session_id: sessionId,
        checkout_url: `https://checkout.dodopayments.com/test/${sessionId}?amount=${prod.amount_usd}`,
        product_key,
        amount_usd: prod.amount_usd,
        customer_email,
        user_id,
        mode: "test_sandbox",
      });
    }

    // Call Dodo Payments REST API
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing: { email: customer_email },
        product_cart: [{ product_id: product_key, quantity: 1 }],
        metadata: { user_id, product_key },
        return_url: `${appUrl}/agent?checkout=success&product=${product_key}`,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
