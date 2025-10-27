// src/app/api/mercadopago/webhook/route.ts
// VERSIÓN CON LOGS COMPLETOS PARA DEBUG

import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from("Payment")
      .select("id")
      .eq("transactionRef", `MP-${paymentId}`)
      .single();

    if (existingPayment) {
      console.log("⏭️  Payment already processed");
      return NextResponse.json({ success: true });
    }

    // Handle different payment statuses
    if (payment.status === "approved") {
      console.log("✅ Payment approved, creating records...");

      // Create approved payment records for each installment
      const paymentRecords = installments.map((installmentNum: number) => ({
        userId: userId,
        amount: amount / installments.length,
        status: "APPROVED",
        installmentNumber: installmentNum,
        transactionRef: `MP-${paymentId}`,
        paymentMethod: "MERCADOPAGO",
        notes: `Pago automático vía Mercado Pago`,
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      }));

      console.log("💾 Inserting payment records:", paymentRecords);

      const { data: insertedPayments, error: insertError } = await supabase
        .from("Payment")
        .insert(paymentRecords)
        .select();

      if (insertError) {
        console.error("❌ Error inserting payments:", insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 },
        );
      }

      console.log("✅ Payments inserted:", insertedPayments);

      // Update user balance
      const { data: user } = await supabase
        .from("User")
        .select("paidAmount, balance")
        .eq("id", userId)
        .single();

      if (user) {
        console.log("💰 Updating user balance...");

        const { data: updatedUser, error: updateError } = await supabase
          .from("User")
          .update({
            paidAmount: user.paidAmount + amount,
            balance: user.balance - amount,
          })
          .eq("id", userId)
          .select();

        if (updateError) {
          console.error("❌ Error updating user:", updateError);
        } else {
          console.log("✅ User updated:", updatedUser);
        }
      }

      console.log(
        `✅ Payment approved for user ${userId}, installments: ${installments.join(", ")}`,
      );
    } else if (payment.status === "rejected") {
      console.log("❌ Payment rejected");

      // Create rejected payment record
      await supabase.from("Payment").insert({
        userId: userId,
        amount: amount,
        status: "REJECTED",
        installmentNumber: null,
        transactionRef: `MP-${paymentId}`,
        paymentMethod: "MERCADOPAGO",
        notes: `Pago rechazado: ${payment.status_detail}`,
        rejectionReason:
          payment.status_detail || "Pago rechazado por Mercado Pago",
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      });

      console.log(`❌ Payment rejected for user ${userId}`);
    } else if (
      payment.status === "pending" ||
      payment.status === "in_process"
    ) {
      console.log("⏳ Payment pending");

      // Create pending payment record
      await supabase.from("Payment").insert({
        userId: userId,
        amount: amount,
        status: "PENDING",
        installmentNumber: installments[0],
        transactionRef: `MP-${paymentId}`,
        paymentMethod: "MERCADOPAGO",
        notes: `Pago pendiente de confirmación`,
        submittedAt: new Date().toISOString(),
      });

      console.log(`⏳ Payment pending for user ${userId}`);
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
