import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Create direct client (bypasses middleware auth check)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Test query - count users
    const { count, error } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "Check if tables are created in Supabase SQL Editor",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      userCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Check your .env.local file and Supabase credentials",
      },
      { status: 500 },
    );
  }
}
