import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || req.headers.get("authorization")?.replace("Bearer ", "");

  // If token is provided and starts with mone_sec_ or valid prefix
  if (token && token.startsWith("mone_sec_")) {
    return NextResponse.json({
      allowed: true,
      plan: "7-Day Free Trial",
      runs_remaining: 50,
      trial_days_remaining: 7,
      is_trial_active: true,
      is_pro: false,
      cli_api_token: token,
      pricing_url: "https://mono-agent.vercel.app/#pricing",
    });
  }

  // Default active trial response for newly connected CLI clients
  return NextResponse.json({
    allowed: true,
    plan: "7-Day Free Trial",
    runs_remaining: 50,
    trial_days_remaining: 7,
    is_trial_active: true,
    is_pro: false,
    pricing_url: "https://mono-agent.vercel.app/#pricing",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token || body.cli_api_token;

    return NextResponse.json({
      allowed: true,
      plan: body.plan || "7-Day Free Trial",
      runs_remaining: typeof body.runs_remaining === "number" ? body.runs_remaining : 50,
      trial_days_remaining: typeof body.trial_days_remaining === "number" ? body.trial_days_remaining : 7,
      is_trial_active: true,
      is_pro: body.plan === "Pro",
      cli_api_token: token,
      pricing_url: "https://mono-agent.vercel.app/#pricing",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
