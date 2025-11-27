import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

// Validation schema for creating a single student
const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI must be 7 or 8 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),

  // School/Division info - can be existing or new
  schoolId: z.string().optional(), // if empty, create new school
  schoolName: z.string().optional(), // for creating new school
  schoolAddress: z.string().optional(),

  divisionId: z.string().optional(), // if empty, create new division
  divisionName: z.string().min(1, "Division is required"),
  divisionYear: z.number().int().positive("Year must be positive"),

  // Product and payment info
  productId: z.string().uuid("Invalid product ID"),
  totalAmount: z.number().positive("Total amount must be positive"),
  installments: z.number().int().positive("Installments must be positive"),
  paidAmount: z.number().min(0, "Paid amount cannot be negative").optional(),

  notes: z.string().optional().or(z.literal("")),
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
    const validatedData = createStudentSchema.parse(body);

    // 3. Initialize Supabase client
    const supabase = createAdminClient();

    // 4. Check if DNI already exists
    const { data: existingUser } = await supabase
      .from("User")
      .select("dni")
      .eq("dni", validatedData.dni)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe un estudiante con el DNI ${validatedData.dni}`,
        },
        { status: 400 },
      );
    }

    // 5. Check/verify product exists
    const { data: product, error: productError } = await supabase
      .from("Product")
      .select("id, name, currentPrice")
      .eq("id", validatedData.productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 400 },
      );
    }

    // 6. Handle School - Use existing or create new
    let schoolId = validatedData.schoolId;

    if (!schoolId) {
      // Create new school
      if (!validatedData.schoolName) {
        return NextResponse.json(
          {
            success: false,
            error: "Nombre del colegio es requerido para crear uno nuevo",
          },
          { status: 400 },
        );
      }

      const { data: newSchool, error: schoolError } = await supabase
        .from("School")
        .insert({
          name: validatedData.schoolName,
          address: validatedData.schoolAddress || null,
        })
        .select()
        .single();

      if (schoolError || !newSchool) {
        return NextResponse.json(
          {
            success: false,
            error: schoolError?.message || "Error al crear el colegio",
          },
          { status: 500 },
        );
      }

      schoolId = newSchool.id;
    } else {
      // Verify existing school
      const { data: school, error: schoolError } = await supabase
        .from("School")
        .select("id")
        .eq("id", schoolId)
        .single();

      if (schoolError || !school) {
        return NextResponse.json(
          { success: false, error: "Colegio no encontrado" },
          { status: 400 },
        );
      }
    }

    // 7. Handle Division - Use existing or create new
    let divisionId = validatedData.divisionId;

    if (!divisionId) {
      // Check if division already exists for this school
      const { data: existingDivision } = await supabase
        .from("SchoolDivision")
        .select("id")
        .eq("schoolId", schoolId)
        .eq("division", validatedData.divisionName)
        .eq("year", validatedData.divisionYear)
        .single();

      if (existingDivision) {
        divisionId = existingDivision.id;
      } else {
        // Create new division
        const { data: newDivision, error: divisionError } = await supabase
          .from("SchoolDivision")
          .insert({
            schoolId: schoolId,
            division: validatedData.divisionName,
            year: validatedData.divisionYear,
          })
          .select()
          .single();

        if (divisionError || !newDivision) {
          return NextResponse.json(
            {
              success: false,
              error: divisionError?.message || "Error al crear la división",
            },
            { status: 500 },
          );
        }

        divisionId = newDivision.id;
      }
    } else {
      // Verify existing division
      const { data: division, error: divisionError } = await supabase
        .from("SchoolDivision")
        .select("id, schoolId")
        .eq("id", divisionId)
        .single();

      if (divisionError || !division) {
        return NextResponse.json(
          { success: false, error: "División no encontrada" },
          { status: 400 },
        );
      }

      // Verify division belongs to the selected school
      if (division.schoolId !== schoolId) {
        return NextResponse.json(
          {
            success: false,
            error: "La división no pertenece al colegio seleccionado",
          },
          { status: 400 },
        );
      }
    }

    // 8. Calculate balance
    const paidAmount = validatedData.paidAmount || 0;
    const balance = validatedData.totalAmount - paidAmount;

    // 9. Create student
    const { data: student, error: studentError } = await supabase
      .from("User")
      .insert({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dni: validatedData.dni,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        size: validatedData.size || null,
        schoolDivisionId: divisionId,
        productId: product.id,
        totalAmount: validatedData.totalAmount,
        paidAmount: paidAmount,
        balance: balance,
        installments: validatedData.installments,
        role: "STUDENT",
        notes: validatedData.notes || null,
        createdBy: session.user.id,
      })
      .select(
        `
        id,
        firstName,
        lastName,
        dni,
        email,
        phone,
        size,
        totalAmount,
        paidAmount,
        balance,
        installments,
        schoolDivision:SchoolDivision(
          id,
          division,
          year,
          school:School(
            id,
            name
          )
        ),
        product:Product(
          id,
          name
        )
      `,
      )
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        {
          success: false,
          error: studentError?.message || "Error al crear el estudiante",
        },
        { status: 500 },
      );
    }

    // 10. Create account with hashed password (DNI as initial password)
    const hashedPassword = await bcrypt.hash(validatedData.dni, 10);

    const { error: accountError } = await supabase.from("Account").insert({
      userId: student.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: student.id,
      access_token: hashedPassword,
    });

    if (accountError) {
      // Rollback: delete created student
      await supabase.from("User").delete().eq("id", student.id);

      return NextResponse.json(
        {
          success: false,
          error: "Error al crear las credenciales del estudiante",
        },
        { status: 500 },
      );
    }

    // 11. Success response
    return NextResponse.json({
      success: true,
      message: "Estudiante creado exitosamente",
      data: student,
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
    console.error("Unexpected error creating student:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al crear el estudiante",
      },
      { status: 500 },
    );
  }
}
