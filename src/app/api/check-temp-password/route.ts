import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Get user's account
    const { data: account, error: accountError } = await supabase
      .from("Account")
      .select("*")
      .eq("userId", session.user.id)
      .eq("provider", "credentials")
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, hasTempPassword: false },
        { status: 200 },
      );
    }

    // Check if password equals DNI
    const passwordEqualsDNI = await bcrypt.compare(
      session.user.dni,
      account.access_token || "",
    );

    return NextResponse.json({
      success: true,
      hasTempPassword: passwordEqualsDNI,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
