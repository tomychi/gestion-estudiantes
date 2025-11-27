import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

const changePasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    const supabase = createAdminClient();

    // Get user's account
    const { data: account, error: accountError } = await supabase
      .from("Account")
      .select("*")
      .eq("userId", validatedData.userId)
      .eq("provider", "credentials")
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, error: "Cuenta no encontrada" },
        { status: 404 },
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      validatedData.currentPassword,
      account.access_token || "",
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Contraseña actual incorrecta" },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from("Account")
      .update({ access_token: hashedNewPassword })
      .eq("id", account.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Error al actualizar la contraseña" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
