import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { PaymentWithUser } from "@/types";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const schoolId = searchParams.get("schoolId") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Build query
    let query = supabase
      .from("Payment")
      .select(
        `
        *,
        user:User(
          id,
          firstName,
          lastName,
          dni,
          email,
          totalAmount,
          paidAmount,
          balance,
          installments,
          schoolDivision:SchoolDivision(
            id,
            division,
            year,
            school:School(
              id,
              name
            )
          )
        )
      `,
      )
      .order("submittedAt", { ascending: false })
      .limit(limit);

    // Filter by status
    if (status !== "all") {
      query = query.eq("status", status.toUpperCase());
    }

    // Filter by school (needs to join through user)
    // Note: This is a client-side filter since Supabase doesn't support nested filters easily
    const { data: payments, error } = await query;

    if (error) {
      console.error("Error fetching payments:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch payments" },
        { status: 500 },
      );
    }

    // Client-side school filter
    let filteredPayments = payments;
    if (schoolId) {
      filteredPayments = payments?.filter(
        (p: PaymentWithUser) => p.user?.schoolDivision?.school?.id === schoolId,
      );
    }

    // Get counts by status
    const { count: pendingCount } = await supabase
      .from("Payment")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING");

    const { count: approvedCount } = await supabase
      .from("Payment")
      .select("*", { count: "exact", head: true })
      .eq("status", "APPROVED");

    const { count: rejectedCount } = await supabase
      .from("Payment")
      .select("*", { count: "exact", head: true })
      .eq("status", "REJECTED");

    return NextResponse.json({
      success: true,
      data: {
        payments: filteredPayments,
        counts: {
          pending: pendingCount || 0,
          approved: approvedCount || 0,
          rejected: rejectedCount || 0,
          total:
            (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
        },
      },
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
