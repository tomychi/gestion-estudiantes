import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 },
      );
    }

    const { installments, totalAmount } = await request.json();

    // Get user data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: user } = await supabase
      .from("User")
      .select("*, product:Product(*)")
      .eq("id", session.user.id)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Get ngrok URL
    const ngrokUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://db862994f768.ngrok-free.app";

    console.log(
      "✅ Creating preference for user:",
      user.id,
      "installments:",
      installments,
    );

    // Crear preferencia
    const preference = await new Preference(mercadopago).create({
      body: {
        items: [
          {
            id: user.product.id,
            title: `${user.product.name} - Cuotas ${installments.join(", ")}`,
            quantity: 1,
            unit_price: totalAmount,
            currency_id: "ARS",
          },
        ],
        // ✅ CRÍTICO: external_reference como STRING (no objeto JSON)
        external_reference: JSON.stringify({
          userId: user.id,
          installments: installments,
          amount: totalAmount,
        }),
        // También en metadata por las dudas
        metadata: {
          user_id: user.id,
          installments: installments.join(","),
        },
        // Notification URL
        notification_url: `${ngrokUrl}/api/mercadopago/webhook/`,
        // Back URLs
        back_urls: {
          success: `${ngrokUrl}/dashboard?payment=success`,
          failure: `${ngrokUrl}/dashboard?payment=failure`,
          pending: `${ngrokUrl}/dashboard?payment=pending`,
        },
        auto_return: "approved",
      },
    });

    console.log("✅ Preference created:", preference.id);

    return NextResponse.json({
      success: true,
      init_point: preference.init_point,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear preferencia" },
      { status: 500 },
    );
  }
}
