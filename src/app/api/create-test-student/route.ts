// app/api/create-test-student/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Create a test product first (required)
    const { data: product, error: productError } = await supabase
      .from("Product")
      .insert({
        name: "Buzo de Egresados 2025",
        type: "BUZO",
        description: "Buzo oficial de egresados",
        basePrice: 50000,
        currentPrice: 50000,
      })
      .select()
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: "Error al crear producto de prueba" },
        { status: 500 },
      );
    }

    // Create a test school
    const { data: school, error: schoolError } = await supabase
      .from("School")
      .insert({
        name: "Colegio Nacional de Buenos Aires",
        address: "Bolívar 263, CABA",
      })
      .select()
      .single();

    if (schoolError || !school) {
      await supabase.from("Product").delete().eq("id", product.id);
      return NextResponse.json(
        { success: false, error: "Error al crear colegio de prueba" },
        { status: 500 },
      );
    }

    // Create a test division
    const { data: division, error: divisionError } = await supabase
      .from("SchoolDivision")
      .insert({
        schoolId: school.id,
        division: "5to A",
        year: 2025,
      })
      .select()
      .single();

    if (divisionError || !division) {
      await supabase.from("School").delete().eq("id", school.id);
      await supabase.from("Product").delete().eq("id", product.id);
      return NextResponse.json(
        { success: false, error: "Error al crear división de prueba" },
        { status: 500 },
      );
    }

    const testDNI = "12345678";

    // Create test student
    const { data: student, error: studentError } = await supabase
      .from("User")
      .insert({
        firstName: "Juan",
        lastName: "Pérez",
        dni: testDNI,
        email: "juan.perez@ejemplo.com",
        phone: "1234567890",
        size: "M",
        schoolDivisionId: division.id,
        productId: product.id,
        totalAmount: 50000,
        paidAmount: 0,
        balance: 50000,
        installments: 3,
        role: "STUDENT",
      })
      .select()
      .single();

    if (studentError || !student) {
      await supabase.from("SchoolDivision").delete().eq("id", division.id);
      await supabase.from("School").delete().eq("id", school.id);
      await supabase.from("Product").delete().eq("id", product.id);
      return NextResponse.json(
        {
          success: false,
          error: studentError?.message || "Error al crear estudiante",
        },
        { status: 500 },
      );
    }

    // Create Account with password = DNI (hashed)
    const hashedPassword = await bcrypt.hash(testDNI, 10);

    const { error: accountError } = await supabase.from("Account").insert({
      userId: student.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: student.id,
      access_token: hashedPassword,
    });

    if (accountError) {
      await supabase.from("User").delete().eq("id", student.id);
      await supabase.from("SchoolDivision").delete().eq("id", division.id);
      await supabase.from("School").delete().eq("id", school.id);
      await supabase.from("Product").delete().eq("id", product.id);
      return NextResponse.json(
        { success: false, error: "Error al crear credenciales" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Estudiante de prueba creado exitosamente",
      student: {
        id: student.id,
        dni: student.dni,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        school: school.name,
        division: division.division,
      },
      credentials: {
        dni: testDNI,
        password: testDNI,
        note: "La contraseña inicial es igual al DNI",
      },
      instructions: {
        step1: `Ve a http://localhost:3000/login`,
        step2: `DNI: ${testDNI}`,
        step3: `Contraseña: ${testDNI}`,
        step4: "El sistema te pedirá cambiar tu contraseña",
      },
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
