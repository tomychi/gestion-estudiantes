// app/api/admin/students/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().regex(/^\d{7,8}$/),
  size: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

const importSchema = z.object({
  school: z.string().min(1),
  division: z.string().min(1),
  year: z.number().int().positive(),
  product: z.string().min(1),
  students: z.array(studentSchema).min(1),
  installments: z.number().int().positive(),
  adminId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = importSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // 1. Find school
    const { data: school } = await supabase
      .from("School")
      .select("id")
      .ilike("name", validatedData.school)
      .single();

    if (!school) {
      return NextResponse.json(
        {
          success: false,
          error: `Colegio "${validatedData.school}" no encontrado`,
        },
        { status: 400 },
      );
    }

    // 2. Find product
    const { data: product } = await supabase
      .from("Product")
      .select("id, currentPrice")
      .ilike("name", validatedData.product)
      .single();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `Producto "${validatedData.product}" no encontrado`,
        },
        { status: 400 },
      );
    }

    // 3. Find or create SchoolDivision
    let { data: division } = await supabase
      .from("SchoolDivision")
      .select("id")
      .eq("schoolId", school.id)
      .eq("division", validatedData.division)
      .eq("year", validatedData.year)
      .single();

    if (!division) {
      // Create new division
      const { data: newDivision, error: divisionError } = await supabase
        .from("SchoolDivision")
        .insert({
          schoolId: school.id,
          division: validatedData.division,
          year: validatedData.year,
        })
        .select()
        .single();

      if (divisionError || !newDivision) {
        return NextResponse.json(
          { success: false, error: "Error al crear la división" },
          { status: 500 },
        );
      }

      division = newDivision;
    }

    // Agregar esto:
    if (!division) {
      return NextResponse.json(
        { success: false, error: "División no encontrada" },
        { status: 500 },
      );
    }

    // 4. Check for existing DNIs
    const dnis = validatedData.students.map((s) => s.dni);
    const { data: existingUsers } = await supabase
      .from("User")
      .select("dni")
      .in("dni", dnis);

    if (existingUsers && existingUsers.length > 0) {
      const existingDnis = existingUsers.map((u) => u.dni).join(", ");
      return NextResponse.json(
        {
          success: false,
          error: `Los siguientes DNIs ya existen en el sistema: ${existingDnis}`,
        },
        { status: 400 },
      );
    }

    // 5. Create students
    const totalAmount = Number(product.currentPrice);
    const balance = totalAmount;

    const studentsToCreate = validatedData.students.map((student) => ({
      firstName: student.firstName,
      lastName: student.lastName,
      dni: student.dni,
      email: student.email || null,
      phone: student.phone || null,
      size: student.size || null,
      schoolDivisionId: division.id,
      productId: product.id,
      totalAmount,
      paidAmount: 0,
      balance,
      installments: validatedData.installments,
      role: "STUDENT",
      createdBy: validatedData.adminId,
    }));

    const { data: createdStudents, error: studentsError } = await supabase
      .from("User")
      .insert(studentsToCreate)
      .select();

    if (studentsError || !createdStudents) {
      return NextResponse.json(
        { success: false, error: "Error al crear los estudiantes" },
        { status: 500 },
      );
    }

    // 6. Create accounts with hashed passwords (DNI as initial password)
    const accountsToCreate = await Promise.all(
      createdStudents.map(async (student) => {
        const hashedPassword = await bcrypt.hash(student.dni, 10);
        return {
          userId: student.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: student.id,
          access_token: hashedPassword,
        };
      }),
    );

    const { error: accountsError } = await supabase
      .from("Account")
      .insert(accountsToCreate);

    if (accountsError) {
      // Rollback: delete created students
      await supabase
        .from("User")
        .delete()
        .in(
          "id",
          createdStudents.map((s) => s.id),
        );

      return NextResponse.json(
        { success: false, error: "Error al crear las credenciales" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${createdStudents.length} estudiantes importados exitosamente`,
      count: createdStudents.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.message },
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
