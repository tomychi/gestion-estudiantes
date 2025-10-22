import { UserRole } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      dni: string;
      schoolDivisionId: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    dni: string;
    schoolDivisionId: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    dni: string;
    schoolDivisionId: string | null;
  }
}
