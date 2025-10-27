// src/app/dashboard/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import DashboardClient from "@/components/student/DashboardClient";

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
    .order("submittedAt", { ascending: false });

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardClient session={session} user={user} payments={payments || []} />
  );
}
