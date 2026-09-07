import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/shared/utils/supabase/server";

const adminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/** GET /api/credits — returns paid_credits for the authenticated user */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paid_credits = (user.user_metadata?.paid_credits as number) || 0;
  return NextResponse.json({ paid_credits });
}

/** PATCH /api/credits — set paid_credits to an absolute value for authenticated user */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paid_credits } = await req.json() as { paid_credits: number };
  if (typeof paid_credits !== "number" || paid_credits < 0) {
    return NextResponse.json({ error: "Invalid paid_credits value" }, { status: 400 });
  }

  const { error } = await adminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, paid_credits },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paid_credits });
}
