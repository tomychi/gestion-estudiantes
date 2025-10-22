"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const setupAdminSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  dni: z.string().regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 dígitos"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type SetupAdminInput = z.infer<typeof setupAdminSchema>;

export async function createFirstAdmin(data: SetupAdminInput) {
  try {
    // Validate input
    const validatedData = setupAdminSchema.parse(data);

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Check if any admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("User")
      .select("id")
      .eq("role", "ADMIN")
      .limit(1)
      .single();

    if (existingAdmin) {
      return {
        success: false,
        error: "Ya existe un administrador en el sistema",
      };
    }

    // Check if DNI already exists
    const { data: existingDNI } = await supabase
      .from("User")
      .select("id")
      .eq("dni", validatedData.dni)
      .single();

    if (existingDNI) {
      return {
        success: false,
        error: "El DNI ya está registrado",
      };
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("User")
      .select("id")
      .eq("email", validatedData.email)
      .single();

    if (existingEmail) {
      return {
        success: false,
        error: "El email ya está registrado",
      };
    }

    // Create a default product for admin (required by schema)
    const { data: product, error: productError } = await supabase
      .from("Product")
      .insert({
        name: "Producto por defecto",
        type: "BUZO",
        description: "Producto temporal para administrador",
        basePrice: 0,
        currentPrice: 0,
      })
      .select()
      .single();

    if (productError || !product) {
      return {
        success: false,
        error: "Error al crear producto por defecto",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create admin user
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dni: validatedData.dni,
        email: validatedData.email,
        role: "ADMIN",
        productId: product.id,
        totalAmount: 0,
        paidAmount: 0,
        balance: 0,
        installments: 0,
      })
      .select()
      .single();

    if (userError || !user) {
      // Rollback: delete product
      await supabase.from("Product").delete().eq("id", product.id);

      return {
        success: false,
        error: userError?.message || "Error al crear usuario administrador",
      };
    }

    // Create Account record with hashed password
    const { error: accountError } = await supabase.from("Account").insert({
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: user.id,
      access_token: hashedPassword, // Store hashed password here
    });

    if (accountError) {
      // Rollback: delete user and product
      await supabase.from("User").delete().eq("id", user.id);
      await supabase.from("Product").delete().eq("id", product.id);

      return {
        success: false,
        error: "Error al crear credenciales de acceso",
      };
    }

    return {
      success: true,
      message: "Administrador creado exitosamente",
      userId: user.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Check if admin exists
export async function checkAdminExists() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("User")
      .select("id")
      .eq("role", "ADMIN")
      .limit(1)
      .single();

    return {
      exists: !!data,
      error: error?.message,
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
