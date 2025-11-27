import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Webhook received:", body);

    // Mercado Pago sends different types of notifications
    if (body.type !== "payment") {
      console.log("⏭️  Skipping non-payment notification");
      return NextResponse.json({ success: true });
    }

    const paymentId = body.data?.id;

    if (!paymentId) {
      console.error("❌ No payment ID in webhook");
      return NextResponse.json(
        { success: false, error: "No payment ID" },
        { status: 400 },
      );
    }

    // Initialize MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      options: { timeout: 5000 },
    });

    const paymentClient = new Payment(client);

    // Get payment details
    const payment = await paymentClient.get({ id: paymentId });

    console.log("Payment details:", {
      id: payment.id,
      status: payment.status,
      payment_type: payment.payment_type_id,
      external_reference: payment.external_reference,
    });

    if (!payment.external_reference) {
      console.error("❌ No external reference in payment");
      return NextResponse.json({ success: true });
    }

    // Parse external reference
    let reference;
    try {
      reference = JSON.parse(payment.external_reference);
    } catch (error) {
      console.error("❌ Error parsing external_reference:", error);
      return NextResponse.json({ success: true });
    }

    const { userId, installments, amount } = reference;

    console.log("📦 Parsed reference:", { userId, installments, amount });

    // Initialize Supabase
    const supabase = createAdminClient();

    // Check if payment already exists
    const { data: existingPayments } = await supabase
      .from("Payment")
      .select("*")
      .eq("transactionRef", `MP-${paymentId}`);

    // Handle different payment statuses
    if (payment.status === "approved") {
      console.log("✅ Payment approved");

      if (existingPayments && existingPayments.length > 0) {
        // ✅ UPDATE existing payments
        console.log("🔄 Updating existing payments to APPROVED");

        const now = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("Payment")
          .update({
            status: "APPROVED",
            reviewedAt: now,
          })
          .eq("transactionRef", `MP-${paymentId}`);

        if (updateError) {
          console.error("❌ Error updating payments:", updateError);
        } else {
          console.log("✅ Payments updated to APPROVED");

          // Update user balance
          const { data: user } = await supabase
            .from("User")
            .select("paidAmount, balance")
            .eq("id", userId)
            .single();

          if (user) {
            // Calculate amount to add (only if not already paid)
            const firstPayment = existingPayments[0];
            if (firstPayment.status !== "APPROVED") {
              await supabase
                .from("User")
                .update({
                  paidAmount: user.paidAmount + amount,
                  balance: user.balance - amount,
                })
                .eq("id", userId);

              console.log("✅ User balance updated");
            }
          }
        }
      } else {
        // ✅ CREATE new approved payments
        console.log("💾 Creating new APPROVED payments");

        const paymentRecords = installments.map((installmentNum: number) => ({
          userId: userId,
          amount: amount / installments.length,
          status: "APPROVED",
          installmentNumber: installmentNum,
          transactionRef: `MP-${paymentId}`,
          notes: `Pago vía Mercado Pago - ${payment.payment_type_id === "ticket" ? "Efectivo" : "Tarjeta"}`,
          submittedAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("Payment")
          .insert(paymentRecords);

        if (insertError) {
          console.error("❌ Error inserting payments:", insertError);
        } else {
          console.log("✅ Payments created");

          // Update user balance
          const { data: user } = await supabase
            .from("User")
            .select("paidAmount, balance")
            .eq("id", userId)
            .single();

          if (user) {
            await supabase
              .from("User")
              .update({
                paidAmount: user.paidAmount + amount,
                balance: user.balance - amount,
              })
              .eq("id", userId);

            console.log("✅ User balance updated");
          }
        }
      }

      console.log(
        `✅ Payment approved for user ${userId}, installments: ${installments.join(", ")}`,
      );
    } else if (
      payment.status === "pending" ||
      payment.status === "in_process"
    ) {
      console.log("⏳ Payment pending");

      if (existingPayments && existingPayments.length > 0) {
        console.log("⏭️  Payment already exists as pending");
      } else {
        // Create pending payment record
        const paymentRecords = installments.map((installmentNum: number) => ({
          userId: userId,
          amount: amount / installments.length,
          status: "PENDING",
          installmentNumber: installmentNum,
          transactionRef: `MP-${paymentId}`,
          notes: `Pago pendiente - ${payment.payment_type_id === "ticket" ? "Esperando pago en efectivo" : "En proceso"}`,
          submittedAt: new Date().toISOString(),
        }));

        await supabase.from("Payment").insert(paymentRecords);

        console.log(`⏳ Payment pending for user ${userId}`);
      }
    } else if (
      payment.status === "rejected" ||
      payment.status === "cancelled"
    ) {
      console.log("❌ Payment rejected/cancelled");

      if (existingPayments && existingPayments.length > 0) {
        // Update to rejected
        await supabase
          .from("Payment")
          .update({
            status: "REJECTED",
            rejectionReason:
              payment.status_detail || "Pago rechazado/cancelado",
          })
          .eq("transactionRef", `MP-${paymentId}`);

        console.log("✅ Payment updated to REJECTED");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error processing webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
