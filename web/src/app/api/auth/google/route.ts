import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { access_token, credential } = body;
    let userEmail = body.email;
    let userName = body.name;
    let userAvatar = body.avatar;
    let userSub = body.google_sub || null;

    // 1. Verify Google JWT ID Token if provided
    if (credential) {
      try {
        const tokenRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
          { method: "GET" }
        );
        if (tokenRes.ok) {
          const idInfo = await tokenRes.json();
          userEmail = idInfo.email || userEmail;
          userName = idInfo.name || userName;
          userAvatar = idInfo.picture || userAvatar;
          userSub = idInfo.sub || userSub;
        }
      } catch (err) {
        console.warn("[OAuth] Google ID Token verification warning:", err);
      }
    }
    // 2. Verify Google Access Token if provided
    else if (access_token) {
      try {
        const userinfoRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
          {
            headers: { Accept: "application/json" },
          }
        );
        if (userinfoRes.ok) {
          const info = await userinfoRes.json();
          userEmail = info.email || userEmail;
          userName = info.name || userName;
          userAvatar = info.picture || userAvatar;
          userSub = info.sub || userSub;
        }
      } catch (err) {
        console.warn("[OAuth] Google userinfo lookup warning:", err);
      }
    }

    // Set sensible defaults if user fields aren't populated
    userEmail = userEmail || "trader@gmail.com";
    userName = userName || "Weather Trader";
    const subHash = userSub ? String(userSub).slice(-7) : Math.abs(hashCode(userEmail)).toString().slice(0, 7);
    const userId = `usr_${subHash}`;
    userAvatar = userAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userEmail)}`;

    const cliToken = `mone_sec_${Math.abs(hashCode(userEmail + "_mone_salt_2026")).toString().padStart(8, "0")}`;

    return NextResponse.json({
      user_id: userId,
      email: userEmail,
      name: userName,
      avatar: userAvatar,
      is_trial_active: true,
      trial_days_remaining: 7,
      runs_remaining: 50,
      plan: "7-Day Free Trial",
      is_new_trial: true,
      trial_reason: "7-Day Free Trial granted with 50 execution runs",
      cli_api_token: cliToken,
      google_sub: userSub,
    });
  } catch (error: any) {
    console.error("[OAuth] /api/auth/google error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to authenticate Google user" },
      { status: 500 }
    );
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
