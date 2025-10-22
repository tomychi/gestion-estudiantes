import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { signOut } from "next-auth/react";

export const metadata: Metadata = {
  title: "Mi Dashboard - Sistema Alas",
  description: "Panel de estudiante",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Get user data with school and product info
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: user } = await supabase
    .from("User")
    .select(
      `
      *,
      schoolDivision:SchoolDivision(
        *,
        school:School(*)
      ),
      product:Product(*)
    `,
    )
    .eq("id", session.user.id)
    .single();

  const { data: payments } = await supabase
    .from("Payment")
    .select("*")
    .eq("userId", session.user.id)
    .order("createdAt", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {session.user.firstName}! 👋
            </h1>
            <p className="text-sm text-gray-600">
              {user?.schoolDivision?.school?.name} -{" "}
              {user?.schoolDivision?.division}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-lg font-medium opacity-90 mb-2">Tu Saldo</h2>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-5xl font-bold">
              ${user?.balance?.toLocaleString("es-AR") || 0}
            </span>
            <span className="text-lg opacity-80">
              de ${user?.totalAmount?.toLocaleString("es-AR") || 0}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
            <div>
              <p className="text-sm opacity-80">Pagado</p>
              <p className="text-xl font-semibold">
                ${user?.paidAmount?.toLocaleString("es-AR") || 0}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">Cuotas</p>
              <p className="text-xl font-semibold">{user?.installments || 0}</p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tu Producto
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {user?.product?.name}
              </h4>
              <p className="text-sm text-gray-600">
                {user?.product?.description}
              </p>
              {user?.size && (
                <p className="text-sm text-gray-500 mt-1">Talle: {user.size}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Mis Pagos</h3>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              + Subir Pago
            </button>
          </div>

          {payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        payment.status === "APPROVED"
                          ? "bg-green-100"
                          : payment.status === "REJECTED"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      {payment.status === "APPROVED" ? (
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : payment.status === "REJECTED" ? (
                        <svg
                          className="w-6 h-6 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${payment.amount.toLocaleString("es-AR")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.submittedAt).toLocaleDateString(
                          "es-AR",
                        )}
                        {payment.installmentNumber &&
                          ` - Cuota ${payment.installmentNumber}`}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status === "APPROVED"
                        ? "Aprobado"
                        : payment.status === "REJECTED"
                          ? "Rechazado"
                          : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 font-medium mb-2">
                Aún no tenés pagos registrados
              </p>
              <p className="text-sm text-gray-500">
                Subí tu primer comprobante de pago para comenzar
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
