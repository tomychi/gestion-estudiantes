// src/app/api/admin/payments/cash/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const cashPaymentSchema = z.object({
  studentDni: z.string().min(7, "DNI inválido"),
  installments: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos una cuota"),
  amount: z.number().positive("El monto debe ser positivo"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = cashPaymentSchema.parse(body);

    const receiptNumber = body.receiptNumber || undefined;
    const notes = body.notes || undefined;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: student, error: studentError } = await supabase
      .from("User")
      .select(
        "id, firstName, lastName, dni, totalAmount, installments, paidAmount, balance",
      )
      .eq("dni", validatedData.studentDni)
      .eq("role", "STUDENT")
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    for (const installmentNum of validatedData.installments) {
      if (installmentNum < 1 || installmentNum > student.installments) {
        return NextResponse.json(
          { success: false, error: `Cuota inválida: ${installmentNum}` },
          { status: 400 },
        );
      }
    }

    const { data: existingPayments } = await supabase
      .from("Payment")
      .select("installmentNumber, status")
      .eq("userId", student.id)
      .in("installmentNumber", validatedData.installments)
      .in("status", ["PENDING", "APPROVED"]);

    if (existingPayments && existingPayments.length > 0) {
      const blockedInstallments = existingPayments.map(
        (p) => p.installmentNumber,
      );
      return NextResponse.json(
        {
          success: false,
          error: `La(s) cuota(s) ${blockedInstallments.join(", ")} ya están pagadas o pendientes`,
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const transactionRef = `CASH-${student.id}-${Date.now()}`;

    let paymentNotes = `💵 Pago en EFECTIVO`;
    if (notes) paymentNotes += ` - ${notes}`;
    if (receiptNumber) paymentNotes += ` | Recibo: ${receiptNumber}`;
    paymentNotes += ` | Registrado por: ${session.user.firstName} ${session.user.lastName}`;

    const paymentRecords = validatedData.installments.map((installmentNum) => ({
      userId: student.id,
      amount: validatedData.amount / validatedData.installments.length,
      status: "APPROVED",
      installmentNumber: installmentNum,
      receiptUrl: null,
      transactionRef: transactionRef,
      notes: paymentNotes,
      submittedAt: now,
      reviewedBy: session.user.id,
      reviewedAt: now,
    }));

    const { error: paymentsError } = await supabase
      .from("Payment")
      .insert(paymentRecords);

    if (paymentsError) {
      console.error("Error:", paymentsError);
      return NextResponse.json(
        { success: false, error: "Error al registrar el pago" },
        { status: 500 },
      );
    }

    const { error: updateUserError } = await supabase
      .from("User")
      .update({
        paidAmount: student.paidAmount + validatedData.amount,
        balance: student.balance - validatedData.amount,
      })
      .eq("id", student.id);

    if (updateUserError) {
      console.error("Error:", updateUserError);
      await supabase
        .from("Payment")
        .delete()
        .eq("transactionRef", transactionRef);
      return NextResponse.json(
        { success: false, error: "Error al actualizar el balance" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pago registrado exitosamente para ${student.firstName} ${student.lastName}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Error desconocido" },
      { status: 500 },
    );
  }
}
