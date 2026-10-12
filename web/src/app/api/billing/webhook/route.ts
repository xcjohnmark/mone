import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-dodo-signature");
    const event = await req.json();

    console.log("[Dodo Payments Webhook Event]", {
      event_type: event.type || event.event,
      payment_id: event.data?.payment_id,
      customer: event.data?.customer?.email,
      signature_present: Boolean(signature),
    });

    return NextResponse.json({
      status: "received",
      event_type: event.type || event.event,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
