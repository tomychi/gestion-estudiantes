// src/app/api/admin/payments/cash/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const registerCashPaymentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  installments: z
    .array(z.number().int().positive())
    .min(1, "Select at least one installment"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().min(1, "Notes are required for cash payments"),
  receiptNumber: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admins only" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = registerCashPaymentSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from("User")
      .select(
        "id, firstName, lastName, balance, totalAmount, installments, paidAmount",
      )
      .eq("id", validatedData.studentId)
      .eq("role", "STUDENT")
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 },
      );
    }

    // Validate installments are valid
    for (const installmentNum of validatedData.installments) {
      if (installmentNum < 1 || installmentNum > student.installments) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid installment number: ${installmentNum}`,
          },
          { status: 400 },
        );
      }
    }

    // Check if installments already have approved payments or pending review
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
          error: `Installment(s) ${blockedInstallments.join(", ")} already paid or pending`,
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const transactionRef = `CASH-${student.id}-${Date.now()}`;

    // Build notes with receipt number if provided
    let paymentNotes = `💵 Pago en EFECTIVO - ${validatedData.notes}`;
    if (validatedData.receiptNumber) {
      paymentNotes += ` | Recibo: ${validatedData.receiptNumber}`;
    }
    paymentNotes += ` | Registrado por: ${session.user.firstName} ${session.user.lastName}`;

    // Create payment records (one per installment) - PRE-APPROVED
    const paymentRecords = validatedData.installments.map((installmentNum) => ({
      userId: student.id,
      amount: validatedData.amount / validatedData.installments.length,
      status: "APPROVED", // Pre-approved since admin verified cash
      installmentNumber: installmentNum,
      receiptUrl: null, // No receipt URL for cash payments
      transactionRef: transactionRef,
      notes: paymentNotes,
      submittedAt: now,
      reviewedBy: session.user.id,
      reviewedAt: now,
      paymentDate: now,
    }));

    const { data: payments, error: paymentsError } = await supabase
      .from("Payment")
      .insert(paymentRecords)
      .select();

    if (paymentsError) {
      console.error("Payment creation error:", paymentsError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create payment records: ${paymentsError.message}`,
        },
        { status: 500 },
      );
    }

    // Update user balance using atomic RPC function
    const { data: balanceData, error: balanceError } = await supabase.rpc(
      "increment_paid_amount",
      {
        user_id_param: student.id,
        amount_param: validatedData.amount,
      },
    );

    if (balanceError || !balanceData || balanceData.length === 0) {
      console.error("Error updating balance:", balanceError);

      // Rollback: delete created payments
      await supabase
        .from("Payment")
        .delete()
        .eq("transactionRef", transactionRef);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update student balance",
        },
        { status: 500 },
      );
    }

    const newPaidAmount = balanceData[0].new_paid_amount;
    const newBalance = balanceData[0].new_balance;

    // Revalidate caches
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/students");
    revalidatePath("/admin/payments");

    return NextResponse.json({
      success: true,
      message: `Cash payment registered successfully for ${validatedData.installments.length} installment(s)`,
      data: {
        transactionRef,
        payments,
        newPaidAmount,
        newBalance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.message}`,
        },
        { status: 400 },
      );
    }

    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
