"use server";

import { createAdminClient } from "@/lib/supabase/supabase-admin";
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
    const validatedData = setupAdminSchema.parse(data);

    // 🔥 USAR SERVICE ROLE KEY para bypasear RLS
    const supabase = createAdminClient();

    // Check if any admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("User")
      .select("id")
      .eq("role", "ADMIN")
      .limit(1)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return {
        success: false,
        error: "Error al verificar administradores existentes",
      };
    }

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

    // 🔥 BUSCAR O CREAR producto por defecto
    let product;
    const { data: existingProduct } = await supabase
      .from("Product")
      .select("id")
      .eq("name", "Producto Admin Dummy")
      .single();

    if (existingProduct) {
      product = existingProduct;
    } else {
      const { data: newProduct, error: productError } = await supabase
        .from("Product")
        .insert({
          name: "Producto Admin Dummy",
          description: "Producto temporal para administrador",
          basePrice: 0,
          currentPrice: 0,
          // 🔥 QUITAR 'type' si causa problemas
        })
        .select()
        .single();

      if (productError) {
        console.error("Product creation error:", productError);
        return {
          success: false,
          error: `Error al crear producto: ${productError.message}`,
        };
      }

      product = newProduct;
    }

    if (!product) {
      return {
        success: false,
        error: "No se pudo obtener el producto por defecto",
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
      console.error("User creation error:", userError);
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
      access_token: hashedPassword,
    });

    if (accountError) {
      console.error("Account creation error:", accountError);
      // Rollback: delete user
      await supabase.from("User").delete().eq("id", user.id);

      return {
        success: false,
        error: `Error al crear credenciales: ${accountError.message}`,
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
        error: error.issues,
      };
    }

    console.error("Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function checkAdminExists() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("User")
      .select("id")
      .eq("role", "ADMIN")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return {
        exists: false,
        error: error.message,
      };
    }

    return {
      exists: !!data,
      error: undefined,
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
