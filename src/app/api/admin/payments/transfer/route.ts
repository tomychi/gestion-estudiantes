import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

const transferPaymentSchema = z.object({
  studentDni: z.string().min(7, "DNI inválido"),
  installments: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos una cuota"),
  amount: z.number().positive("El monto debe ser positivo"),
  transferReference: z.string().optional(), // Número de operación/referencia
  transferDate: z.string().optional(), // Fecha de la transferencia
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
    const validatedData = transferPaymentSchema.parse(body);

    const notes = body.notes || undefined;

    const supabase = createAdminClient();

    // 1. Get student info
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

    // 2. Calculate installment amount
    const installmentAmount = student.totalAmount / student.installments;
    const expectedAmount =
      installmentAmount * validatedData.installments.length;

    // Validate exact amount
    if (Math.abs(validatedData.amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Para pagar ${validatedData.installments.length} cuota(s), el monto debe ser exactamente $${expectedAmount.toLocaleString("es-AR")}. Ingresaste $${validatedData.amount.toLocaleString("es-AR")}`,
        },
        { status: 400 },
      );
    }

    // 3. Validate installment numbers
    for (const installmentNum of validatedData.installments) {
      if (installmentNum < 1 || installmentNum > student.installments) {
        return NextResponse.json(
          { success: false, error: `Cuota inválida: ${installmentNum}` },
          { status: 400 },
        );
      }
    }

    // 4. Check if installments are already paid
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

    // 5. Create payment records
    const now = new Date().toISOString();
    const transactionRef = `TRANSFER-${student.id}-${Date.now()}`;

    let paymentNotes = `🏦 Pago por TRANSFERENCIA`;
    if (validatedData.transferReference) {
      paymentNotes += ` | Ref: ${validatedData.transferReference}`;
    }
    if (validatedData.transferDate) {
      paymentNotes += ` | Fecha: ${new Date(validatedData.transferDate).toLocaleDateString("es-AR")}`;
    }
    if (notes) paymentNotes += ` - ${notes}`;
    paymentNotes += ` | Registrado por: ${session.user.firstName} ${session.user.lastName}`;

    const paymentRecords = validatedData.installments.map((installmentNum) => ({
      userId: student.id,
      amount: installmentAmount,
      status: "APPROVED",
      installmentNumber: installmentNum,
      receiptUrl: null,
      transactionRef: transactionRef,
      notes: paymentNotes,
      paymentMethod: "TRANSFER",
      submittedAt: now,
      reviewedBy: session.user.id,
      reviewedAt: now,
      paymentDate: validatedData.transferDate || now,
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

    // 6. Update user balance
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
      message: `Transferencia de $${validatedData.amount.toLocaleString("es-AR")} registrada exitosamente - Cuota(s): ${validatedData.installments.join(", ")}`,
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
