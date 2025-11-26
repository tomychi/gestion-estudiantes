import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { isProduction, getBaseUrl } from "@/lib/utils/env";

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

    const baseUrl = getBaseUrl();
    console.log("📍 Base URL:", baseUrl);

    // 🔍 DEBUG: Preparar el body del preference
    const preferenceBody = {
      items: [
        {
          id: user.product.id,
          title: `${user.product.name} - Cuotas ${installments.join(", ")}`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: "ARS",
        },
      ],
      external_reference: JSON.stringify({
        userId: user.id,
        installments: installments,
        amount: totalAmount,
      }),
      metadata: {
        user_id: user.id,
        installments: installments.join(","),
      },
      notification_url: `${baseUrl}/api/mercadopago/webhook/`,
      back_urls: {
        success: `${baseUrl}/dashboard?payment=success`,
        failure: `${baseUrl}/dashboard?payment=failure`,
        pending: `${baseUrl}/dashboard?payment=pending`,
      },
      auto_return: "approved",
    };

    console.log(
      "🔍 Preference Body que se enviará a MP:",
      JSON.stringify(preferenceBody, null, 2),
    );

    // Crear preferencia con el body que preparamos
    const preference = await new Preference(mercadopago).create({
      body: preferenceBody,
    });

    console.log("✅ Preference ID:", preference.id);
    console.log("🔗 Sandbox Init Point:", preference.sandbox_init_point);
    return NextResponse.json({
      success: true,
      // En producción usar init_point, en desarrollo sandbox_init_point
      init_point: isProduction
        ? preference.init_point
        : preference.sandbox_init_point,

      preference_id: preference.id,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear preferencia" },
      { status: 500 },
    );
  }
}
