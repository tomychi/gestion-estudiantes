import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/types"; // ← Importar UserRole

// Schema validation for login
const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "DNI or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { identifier, password } = validatedFields.data;
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          );

          // Find user by DNI or email
          const { data: user, error } = await supabase
            .from("User")
            .select("*")
            .or(`dni.eq.${identifier},email.eq.${identifier}`)
            .single();

          if (error || !user) {
            return null;
          }

          // Get account to verify password
          const { data: account } = await supabase
            .from("Account")
            .select("*")
            .eq("userId", user.id)
            .eq("provider", "credentials")
            .single();

          if (!account) {
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            password,
            account.access_token || "",
          );

          if (!passwordMatch) {
            return null;
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            dni: user.dni,
            schoolDivisionId: user.schoolDivisionId,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.dni = user.dni;
        token.schoolDivisionId = user.schoolDivisionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole; // ← Cambio aquí
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.dni = token.dni as string;
        session.user.schoolDivisionId = token.schoolDivisionId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
