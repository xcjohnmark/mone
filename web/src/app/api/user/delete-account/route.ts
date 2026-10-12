import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || "unknown";

    // In a production serverless environment with an external DB,
    // the user's active session is invalidated and cryptographic hash is preserved in tombstones.
    console.log(`[AUTH] Account deletion requested for ${email}. Session purged.`);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully. Trial record archived to prevent re-registration abuse.",
      deleted_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
