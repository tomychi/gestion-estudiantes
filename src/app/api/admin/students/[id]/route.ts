import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  dni?: string;
  email?: string | null;
  phone?: string | null;
  size?: string | null;
  schoolDivisionId?: string | null;
  productId?: string;
  totalAmount?: number;
  paidAmount?: number;
  balance?: number;
  installments?: number;
  notes?: string | null;
  updatedAt: string;
}

// Validation schema for updates
const updateStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ← Cambio aquí
) {
  try {
    // 1. Authenticate admin
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Await params and validate student ID
    const { id: studentId } = await params; // ← Cambio aquí

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 },
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    // 4. Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // 5. Check if student exists
    const { data: existingStudent, error: fetchError } = await supabase
      .from("User")
      .select("id, firstName, lastName, dni, notes")
      .eq("id", studentId)
      .eq("role", "STUDENT")
      .single();

    if (fetchError || !existingStudent) {
      return NextResponse.json(
        { success: false, error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    // 6. Prepare update data (only include fields that were provided)
    const updateData: UserUpdateData = {
      updatedAt: new Date().toISOString(),
    };

    if (validatedData.firstName !== undefined) {
      updateData.firstName = validatedData.firstName;
    }
    if (validatedData.lastName !== undefined) {
      updateData.lastName = validatedData.lastName;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email || null;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone || null;
    }
    if (validatedData.size !== undefined) {
      updateData.size = validatedData.size || null;
    }
    if (validatedData.notes !== undefined) {
      // Append notes instead of replacing
      const currentNotes = existingStudent.notes || "";
      const timestamp = new Date().toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      });
      const adminInfo = `[${timestamp} - ${session.user.firstName} ${session.user.lastName}]`;
      const newNote = validatedData.notes
        ? `${adminInfo}: ${validatedData.notes}`
        : "";

      if (newNote) {
        updateData.notes = currentNotes
          ? `${currentNotes}\n${newNote}`
          : newNote;
      }
    }

    // 7. Update student
    const { data: updatedStudent, error: updateError } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", studentId)
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
        notes,
        updatedAt,
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

    if (updateError || !updatedStudent) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError?.message || "Error al actualizar el estudiante",
        },
        { status: 500 },
      );
    }

    // 8. Success response
    return NextResponse.json({
      success: true,
      message: "Estudiante actualizado exitosamente",
      data: updatedStudent,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.message;
      return NextResponse.json(
        {
          success: false,
          error: `Datos inválidos: ${errorMessages}`,
        },
        { status: 400 },
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in student update:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al actualizar el estudiante",
      },
      { status: 500 },
    );
  }
}

// GET single student details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ← Cambio aquí
) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Await params and validate student ID
    const { id: studentId } = await params; // ← Cambio aquí

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 },
      );
    }

    // 3. Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // 4. Fetch student with relations
    const { data: student, error } = await supabase
      .from("User")
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
        notes,
        createdAt,
        updatedAt,
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
          name,
          currentPrice
        )
      `,
      )
      .eq("id", studentId)
      .eq("role", "STUDENT")
      .single();

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    // 5. Check authorization (admin or the student themselves)
    if (session.user.role !== "ADMIN" && session.user.id !== studentId) {
      return NextResponse.json(
        { success: false, error: "No autorizado para ver este estudiante" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener el estudiante",
      },
      { status: 500 },
    );
  }
}
