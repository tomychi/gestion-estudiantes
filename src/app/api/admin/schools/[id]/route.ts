import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const updateSchoolSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().optional(),
});

// PUT - Update school
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSchoolSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Check if school exists
    const { data: existing } = await supabase
      .from("School")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Colegio no encontrado" },
        { status: 404 },
      );
    }

    // Check if another school has the same name
    const { data: duplicate } = await supabase
      .from("School")
      .select("id")
      .eq("name", validatedData.name)
      .neq("id", id)
      .single();

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "Ya existe otro colegio con ese nombre" },
        { status: 400 },
      );
    }

    // Update school
    const { data: school, error } = await supabase
      .from("School")
      .update({
        name: validatedData.name,
        address: validatedData.address || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !school) {
      return NextResponse.json(
        { success: false, error: "Error al actualizar el colegio" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      school,
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
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete school
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Check if school has divisions with students
    const { data: divisions } = await supabase
      .from("SchoolDivision")
      .select("id")
      .eq("schoolId", id);

    if (divisions && divisions.length > 0) {
      const divisionIds = divisions.map((d) => d.id);

      const { count: studentCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .in("schoolDivisionId", divisionIds);

      if (studentCount && studentCount > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `No se puede eliminar. Hay ${studentCount} estudiante(s) asociados a este colegio`,
          },
          { status: 400 },
        );
      }

      // Delete divisions first
      await supabase.from("SchoolDivision").delete().eq("schoolId", id);
    }

    // Delete school
    const { error } = await supabase.from("School").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Error al eliminar el colegio" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Colegio eliminado exitosamente",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
