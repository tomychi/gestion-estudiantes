"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const setupPasswordSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type SetupPasswordInput = z.infer<typeof setupPasswordSchema>;

export async function setupStudentPassword(data: SetupPasswordInput) {
  try {
    // Validate input
    const validatedData = setupPasswordSchema.parse(data);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Find user by DNI
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, role, firstName, lastName")
      .eq("dni", validatedData.dni)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: "No se encontró un usuario con ese DNI",
      };
    }

    // Check if user already has an account (password already set)
    const { data: existingAccount } = await supabase
      .from("Account")
      .select("id")
      .eq("userId", user.id)
      .eq("provider", "credentials")
      .single();

    if (existingAccount) {
      return {
        success: false,
        error:
          "Este usuario ya tiene una contraseña configurada. Usá el login normal.",
      };
    }

    // Students only (admins shouldn't use this flow)
    if (user.role !== "STUDENT") {
      return {
        success: false,
        error: "Esta opción es solo para estudiantes",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create Account record with hashed password
    const { error: accountError } = await supabase.from("Account").insert({
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: user.id,
      access_token: hashedPassword, // Store hashed password here
    });

    if (accountError) {
      return {
        success: false,
        error: "Error al crear la contraseña. Intentá nuevamente.",
      };
    }

    return {
      success: true,
      message: "Contraseña creada exitosamente",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Check if DNI exists and needs password setup
export async function checkDNIStatus(dni: string) {
  try {
    if (!/^\d{7,8}$/.test(dni)) {
      return {
        exists: false,
        needsPassword: false,
        error: "DNI inválido",
      };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Find user by DNI
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, role")
      .eq("dni", dni)
      .single();

    if (userError || !user) {
      return {
        exists: false,
        needsPassword: false,
        error: "DNI no encontrado en el sistema",
      };
    }

    // Check if user has password
    const { data: account } = await supabase
      .from("Account")
      .select("id")
      .eq("userId", user.id)
      .eq("provider", "credentials")
      .single();

    return {
      exists: true,
      needsPassword: !account,
      role: user.role,
    };
  } catch (error) {
    return {
      exists: false,
      needsPassword: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
