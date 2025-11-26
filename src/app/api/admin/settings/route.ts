import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const updateSettingsSchema = z.object({
  payment_due_day: z.number().min(1).max(31),
  late_fee_percentage: z.number().min(0).max(100),
  total_recalculation_percentage: z.number().min(0).max(100),
});

// GET - Fetch current settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: settings, error } = await supabase
      .from("SystemSettings")
      .select("key, value, description")
      .in("key", [
        "payment_due_day",
        "late_fee_percentage",
        "total_recalculation_percentage",
      ]);

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch settings" },
        { status: 500 },
      );
    }

    // Convert array to object
    const settingsObject = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return NextResponse.json({
      success: true,
      data: settingsObject,
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

// PATCH - Update settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Update each setting
    const updates = Object.entries(validatedData).map(([key, value]) =>
      supabase
        .from("SystemSettings")
        .update({
          value: value.toString(),
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.id,
        })
        .eq("key", key),
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("Errors updating settings:", errors);
      return NextResponse.json(
        { success: false, error: "Failed to update some settings" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
        },
        { status: 400 },
      );
    }

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
