import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const reviewPaymentSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
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

    const { id: paymentId } = await params;
    const body = await request.json();
    const { action, rejectionReason } = reviewPaymentSchema.parse(body);

    if (action === "REJECT" && !rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: "Rejection reason is required when rejecting",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("Payment")
      .select(
        `
        *,
        user:User(
          id,
          paidAmount,
          balance,
          totalAmount
        )
      `,
      )
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment already ${payment.status.toLowerCase()}`,
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if (action === "APPROVE") {
      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from("Payment")
        .update({
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: now,
          paymentDate: now,
        })
        .eq("id", paymentId);

      if (updatePaymentError) {
        console.error("Error updating payment:", updatePaymentError);
        return NextResponse.json(
          { success: false, error: "Failed to approve payment" },
          { status: 500 },
        );
      }

      // Update user balance atomically using RPC function
      const { data: balanceData, error: updateUserError } = await supabase.rpc(
        "increment_paid_amount",
        {
          user_id_param: payment.userId,
          amount_param: payment.amount,
        },
      );

      if (updateUserError || !balanceData || balanceData.length === 0) {
        console.error("Error updating user balance:", updateUserError);

        // Rollback payment status
        await supabase
          .from("Payment")
          .update({
            status: "PENDING",
            reviewedBy: null,
            reviewedAt: null,
            paymentDate: null,
          })
          .eq("id", paymentId);

        return NextResponse.json(
          { success: false, error: "Failed to update user balance" },
          { status: 500 },
        );
      }

      const newPaidAmount = balanceData[0].new_paid_amount;
      const newBalance = balanceData[0].new_balance;

      // Revalidate caches
      revalidatePath("/dashboard");
      revalidatePath("/admin");
      revalidatePath("/admin/payments");

      return NextResponse.json({
        success: true,
        message: "Payment approved successfully",
        data: {
          newPaidAmount,
          newBalance,
        },
      });
    } else {
      // REJECT
      const { error: updateError } = await supabase
        .from("Payment")
        .update({
          status: "REJECTED",
          reviewedBy: session.user.id,
          reviewedAt: now,
          rejectionReason: rejectionReason || "No reason provided",
        })
        .eq("id", paymentId);

      if (updateError) {
        console.error("Error rejecting payment:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to reject payment" },
          { status: 500 },
        );
      }

      // Revalidate caches
      revalidatePath("/dashboard");
      revalidatePath("/admin/payments");

      return NextResponse.json({
        success: true,
        message: "Payment rejected",
      });
    }
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
