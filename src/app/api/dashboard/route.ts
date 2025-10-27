// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("User")
      .select(
        `
        *,
        schoolDivision:SchoolDivision(
          *,
          school:School(*)
        ),
        product:Product(*)
      `,
      )
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Get payments
    const { data: payments, error: paymentsError } = await supabase
      .from("Payment")
      .select("*")
      .eq("userId", session.user.id)
      .order("submittedAt", { ascending: false });

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    return NextResponse.json({
      success: true,
      user,
      payments: payments || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
