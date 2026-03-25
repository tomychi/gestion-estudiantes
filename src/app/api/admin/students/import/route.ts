import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

// Validation schemas
const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI must be 7 or 8 digits"),
  size: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  // Per-student overrides (optional — fallback to global)
  productId: z.string().uuid().optional(),
  totalAmount: z.number().positive().optional(),
  installments: z.number().int().positive().optional(),
});

const importSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  division: z.string().min(1, "Division is required"),
  year: z.number().int().positive("Year must be a positive integer"),
  // Global defaults
  productId: z.string().uuid("Invalid product ID"),
  totalAmount: z.number().positive("Total amount must be positive"),
  installments: z.number().int().positive("Installments must be positive"),
  students: z.array(studentSchema).min(1, "At least one student is required"),
  adminId: z.string(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate admin
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = importSchema.parse(body);

    // 3. Initialize Supabase client
    const supabase = createAdminClient();

    // 4. Verify school exists
    const { data: school, error: schoolError } = await supabase
      .from("School")
      .select("id, name")
      .eq("id", validatedData.schoolId)
      .single();

    if (schoolError || !school) {
      return NextResponse.json(
        {
          success: false,
          error: `Colegio no encontrado`,
        },
        { status: 400 },
      );
    }

    // 5. Collect all unique productIds to validate in one query  ← REEMPLAZA el viejo paso 5
    const studentProductIds = validatedData.students
      .map((s) => s.productId)
      .filter((id): id is string => !!id);

    const allProductIds = [
      ...new Set([validatedData.productId, ...studentProductIds]),
    ];

    const { data: products, error: productsError } = await supabase
      .from("Product")
      .select("id, name, currentPrice")
      .in("id", allProductIds);

    if (
      productsError ||
      !products ||
      products.length !== allProductIds.length
    ) {
      return NextResponse.json(
        { success: false, error: "Uno o más productos no fueron encontrados" },
        { status: 400 },
      );
    }

    const productsMap = new Map(products.map((p) => [p.id, p]));
    const globalProduct = productsMap.get(validatedData.productId)!;

    // 6. Find or create SchoolDivision
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
        console.error("Division creation error:", divisionError);
        return NextResponse.json(
          { success: false, error: "Error al crear la división" },
          { status: 500 },
        );
      }

      division = newDivision;
    }

    // Safety check
    if (!division) {
      return NextResponse.json(
        { success: false, error: "División no encontrada después de crear" },
        { status: 500 },
      );
    }

    // 7. Check for existing DNIs in the system
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

    // 8. Prepare students data

    const studentsToCreate = validatedData.students.map((student) => {
      const resolvedProductId = student.productId ?? validatedData.productId;
      const resolvedAmount = student.totalAmount ?? validatedData.totalAmount;
      const resolvedInstallments =
        student.installments ?? validatedData.installments;

      return {
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
        email: student.email || null,
        phone: student.phone || null,
        size: student.size || null,
        schoolDivisionId: division.id,
        productId: resolvedProductId,
        totalAmount: resolvedAmount,
        paidAmount: 0,
        balance: resolvedAmount,
        installments: resolvedInstallments,
        role: "STUDENT",
        createdBy: validatedData.adminId,
      };
    });
    // 9. Create students
    const { data: createdStudents, error: studentsError } = await supabase
      .from("User")
      .insert(studentsToCreate)
      .select();

    if (studentsError || !createdStudents) {
      console.error("Students creation error:", studentsError);
      return NextResponse.json(
        {
          success: false,
          error: studentsError?.message || "Error al crear los estudiantes",
        },
        { status: 500 },
      );
    }

    // 10. Create accounts with hashed passwords (DNI as initial password)
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
      console.error("Accounts creation error:", accountsError);

      // Rollback: delete created students
      await supabase
        .from("User")
        .delete()
        .in(
          "id",
          createdStudents.map((s) => s.id),
        );

      return NextResponse.json(
        {
          success: false,
          error:
            "Error al crear las credenciales. Los estudiantes no fueron creados.",
        },
        { status: 500 },
      );
    }

    // 11. Success response
    return NextResponse.json({
      success: true,
      message: `${createdStudents.length} estudiantes importados exitosamente`,
      count: createdStudents.length,
      data: {
        school: school.name,
        division: validatedData.division,
        year: validatedData.year,
        product: globalProduct.name,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Datos inválidos: ${error.message}`,
        },
        { status: 400 },
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in import:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al importar estudiantes",
      },
      { status: 500 },
    );
  }
}
