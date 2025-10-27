import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: payments, error } = await supabase
      .from("Payment")
      .select("installmentNumber, status")
      .eq("userId", id)
      .order("installmentNumber", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 },
    );
  }
}
