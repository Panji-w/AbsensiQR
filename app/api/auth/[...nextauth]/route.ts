import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("--- LOGIN ATTEMPT ---");
                console.log("Credentials masuk:", credentials?.email);

                const user = await prisma.user.findUnique({
                    where: { email: credentials?.email }
                });

                if (!user) {
                    console.log("DEBUG: User tidak ditemukan di database.");
                    return null;
                }

                console.log("DEBUG: User ditemukan:", user.email);
                console.log("DEBUG: Password di DB (hash):", user.password);

                const isPasswordValid = await bcrypt.compare(
                    credentials!.password,
                    user.password
                );

                console.log("DEBUG: Hasil banding password:", isPasswordValid);

                if (!isPasswordValid) return null;

                return { id: user.id, name: user.name, email: user.email };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };