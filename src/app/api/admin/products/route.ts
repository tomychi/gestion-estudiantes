import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  currentPrice: z.number().positive(),
});

// POST - Create product
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
    const validatedData = createProductSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: product, error } = await supabase
      .from("Product")
      .insert(validatedData)
      .select()
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: "Error al crear el producto" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 },
    );
  }
}
