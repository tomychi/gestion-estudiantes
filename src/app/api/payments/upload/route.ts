// src/app/api/payments/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const uploadPaymentSchema = z.object({
  installments: z
    .array(z.number().int().positive())
    .min(1, "Select at least one installment"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().optional(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Students only" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const installmentsStr = formData.get("installments") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const notes = formData.get("notes") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only PDF, JPG, PNG, WEBP allowed",
        },
        { status: 400 },
      );
    }

    // Parse installments
    let installments: number[];
    try {
      installments = JSON.parse(installmentsStr);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid installments format" },
        { status: 400 },
      );
    }

    // Validate data
    const validatedData = uploadPaymentSchema.parse({
      installments,
      amount,
      notes: notes || undefined,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Use regular client for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Use Service Role client for storage (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("id, balance, totalAmount, installments, paidAmount")
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Validate installments are valid
    for (const installmentNum of validatedData.installments) {
      if (installmentNum < 1 || installmentNum > user.installments) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid installment number: ${installmentNum}`,
          },
          { status: 400 },
        );
      }
    }

    // Check if installments already have pending/approved payments
    const { data: existingPayments } = await supabase
      .from("Payment")
      .select("installmentNumber, status")
      .eq("userId", user.id)
      .in("installmentNumber", validatedData.installments)
      .in("status", ["PENDING", "APPROVED"]);

    if (existingPayments && existingPayments.length > 0) {
      const blockedInstallments = existingPayments.map(
        (p) => p.installmentNumber,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Installment(s) ${blockedInstallments.join(", ")} already have pending or approved payments`,
        },
        { status: 400 },
      );
    }

    // Upload file to Supabase Storage using Service Role
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const transactionRef = `${user.id}-${timestamp}`;
    const fileName = `${user.id}/${transactionRef}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("payment-receipts")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upload file: ${uploadError.message}`,
        },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("payment-receipts").getPublicUrl(fileName);

    // Create payment records (one per installment)
    const paymentRecords = validatedData.installments.map((installmentNum) => ({
      userId: user.id,
      amount: validatedData.amount / validatedData.installments.length,
      status: "PENDING",
      installmentNumber: installmentNum,
      receiptUrl: publicUrl,
      transactionRef: transactionRef,
      notes: validatedData.notes || null,
      submittedAt: new Date().toISOString(),
    }));

    const { data: payments, error: paymentsError } = await supabase
      .from("Payment")
      .insert(paymentRecords)
      .select();

    if (paymentsError) {
      console.error("Payment creation error:", paymentsError);

      // Rollback: delete uploaded file
      await supabaseAdmin.storage.from("payment-receipts").remove([fileName]);

      return NextResponse.json(
        {
          success: false,
          error: `Failed to create payment records: ${paymentsError.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payment submitted successfully for ${validatedData.installments.length} installment(s)`,
      data: {
        transactionRef,
        payments,
        receiptUrl: publicUrl,
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
