import { createAdminClient } from "@/lib/supabase/supabase-admin";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = createAdminClient();

    // Call the stored procedure
    const { data, error } = await supabase.rpc("apply_late_fees");

    if (error) {
      console.error("Error applying late fees:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Late fees applied successfully",
      data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
