// Midtrans Payment Notification Webhook
// Configure this URL in Midtrans Dashboard → Settings → Configuration → Payment Notification URL:
//   https://anticeil.com/api/payment/webhook
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;


// Verify Midtrans notification signature
// SHA512(order_id + status_code + gross_amount + server_key)
function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  incomingSignature: string
): boolean {
  const raw = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const expected = createHash("sha512").update(raw).digest("hex");
  return expected === incomingSignature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      custom_field1: type,
      custom_field2: itemId,
      custom_field3: userId,
    } = body;

    // Verify authenticity — return 200 even on mismatch so Midtrans dashboard
    // test notifications don't show "Test failed" (they use a dummy signature).
    // We simply skip processing if the signature is invalid.
    const signatureValid = verifySignature(order_id, status_code, gross_amount, signature_key);
    if (!signatureValid) {
      console.warn("[Midtrans Webhook] Invalid/test signature for order:", order_id);
      return NextResponse.json({ received: true }); // 200 so Midtrans marks test as OK
    }

    // Determine if payment was successful
    const isSuccess =
      transaction_status === "capture"
        ? fraud_status === "accept"
        : transaction_status === "settlement";

    if (!isSuccess) {
      // Log failed/pending but still return 200 to Midtrans
      console.log(`[Midtrans Webhook] Order ${order_id} status: ${transaction_status}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Midtrans Webhook] Payment success: ${order_id} | type=${type} itemId=${itemId} userId=${userId}`);

    const PACK_CREDITS: Record<string, number> = {
      pack_100: 100, pack_350: 350, pack_600: 600, pack_1500: 1500,
    };

    if (userId) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch current metadata first so we can merge safely
        const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(userId);
        const currentMeta = currentUser?.user_metadata || {};

        if (type === "topup") {
          const addCredits = PACK_CREDITS[itemId] ?? 0;
          const existing = (currentMeta.paid_credits as number) || 0;
          const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...currentMeta, paid_credits: existing + addCredits },
          });
          if (error) console.error("[Midtrans Webhook] Failed to add paid_credits:", error.message);
          else console.log(`[Midtrans Webhook] +${addCredits} paid_credits → user ${userId} (total: ${existing + addCredits})`);
        }

        if (type === "tier") {
          const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...currentMeta, tier: itemId },
          });
          if (error) console.error("[Midtrans Webhook] Failed to update user tier:", error.message);
          else console.log(`[Midtrans Webhook] Updated user ${userId} to tier: ${itemId}`);
        }
      } catch (e) {
        console.error("[Midtrans Webhook] Supabase error:", e);
      }
    }

    // Log to payment_logs table (fire-and-forget, best effort)
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from("payment_logs").insert({
        order_id,
        user_id: userId || null,
        type,
        item_id: itemId,
        amount_idr: parseInt(gross_amount, 10),
        status: "success",
        midtrans_payload: body,
      });
    } catch {
      // Table might not exist yet — not critical
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Midtrans Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
