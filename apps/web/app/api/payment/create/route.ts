import { NextRequest, NextResponse } from "next/server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
// Midtrans production server keys start with "Mid-server-production-"
const IS_SANDBOX = !MIDTRANS_SERVER_KEY?.startsWith("Mid-server-production-");
const MIDTRANS_API_URL = IS_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
  : "https://app.midtrans.com/snap/v1/transactions";

// Credit pack prices (mirrors useCreditStore to avoid cross-import on server)
const PACK_MAP: Record<string, { name: string; credits: number; priceIdr: number }> = {
  pack_100:  { name: "Starter",  credits: 100,  priceIdr: 15000  },
  pack_350:  { name: "Plus",     credits: 350,  priceIdr: 45000  },
  pack_600:  { name: "Pro",      credits: 600,  priceIdr: 75000  },
  pack_1500: { name: "Ultra",    credits: 1500, priceIdr: 150000 },
};

// Tier prices (mirrors pricingTiers)
const TIER_MAP: Record<string, { name: string; priceIdr: number }> = {
  starter:    { name: "Starter Plan",      priceIdr: 49000  },
  pro:        { name: "Pro Power User",    priceIdr: 129000 },
  enterprise: { name: "Enterprise BYOD",   priceIdr: 499000 },
};

export async function POST(req: NextRequest) {
  try {
    if (!MIDTRANS_SERVER_KEY) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    const { type, itemId, userId, userEmail, userName } = await req.json() as {
      type: "topup" | "tier";
      itemId: string;
      userId?: string;
      userEmail?: string;
      userName?: string;
    };

    if (!type || !itemId) {
      return NextResponse.json({ error: "Missing type or itemId" }, { status: 400 });
    }

    let itemName = "";
    let priceIdr = 0;
    let credits = 0;

    if (type === "topup") {
      const pack = PACK_MAP[itemId];
      if (!pack) return NextResponse.json({ error: "Invalid pack id" }, { status: 400 });
      itemName = `Anticeil ${pack.name} Pack (${pack.credits.toLocaleString()} Credits)`;
      priceIdr = pack.priceIdr;
      credits = pack.credits;
    } else {
      const tier = TIER_MAP[itemId];
      if (!tier) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      itemName = `Anticeil ${tier.name} (1 Month)`;
      priceIdr = tier.priceIdr;
    }

    const orderId = `anticeil-${type}-${itemId}-${Date.now()}`;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://anticeil.app").replace(/\/$/, "");

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: priceIdr },
      item_details: [{
        id: itemId,
        price: priceIdr,
        quantity: 1,
        name: itemName,
        brand: "Anticeil",
        category: type === "topup" ? "AI Credits" : "Subscription",
      }],
      customer_details: {
        first_name: userName || "Anticeil",
        last_name: "User",
        email: userEmail || "user@anticeil.app",
      },
      callbacks: {
        finish: `${appUrl}/payment/success?order_id=${orderId}&type=${type}&item=${itemId}`,
      },
      custom_field1: type,
      custom_field2: itemId,
      custom_field3: userId || "",
    };

    const authHeader = "Basic " + Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

    const mtRes = await fetch(MIDTRANS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const mtData = await mtRes.json();

    if (!mtRes.ok || !mtData.token) {
      console.error("[Midtrans] Create failed:", mtData);
      return NextResponse.json(
        { error: mtData.error_messages?.join(", ") || "Failed to create payment" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: mtData.token,
      redirectUrl: mtData.redirect_url,
      orderId,
      credits,
    });
  } catch (err) {
    console.error("[Midtrans] /api/payment/create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
