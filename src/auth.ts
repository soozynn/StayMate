import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";

import { getMongoClient } from "@/lib/db/mongodb";
import { getServerEnv } from "@/lib/env";
import { isAdminEmail } from "@/lib/auth/is-admin";

type UserRole = "admin" | "user";

function toUserRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : "user";
}

function getProviders(env: ReturnType<typeof getServerEnv>) {
  const providers: NextAuthConfig["providers"] = [];

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (env.KAKAO_CLIENT_ID && env.KAKAO_CLIENT_SECRET) {
    providers.push(
      Kakao({
        clientId: env.KAKAO_CLIENT_ID,
        clientSecret: env.KAKAO_CLIENT_SECRET,
      }),
    );
  }

  if (env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET) {
    providers.push(
      Naver({
        clientId: env.NAVER_CLIENT_ID,
        clientSecret: env.NAVER_CLIENT_SECRET,
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const env = getServerEnv();

  return {
    adapter: MongoDBAdapter(getMongoClient(), {
      databaseName: env.MONGODB_DB,
    }),
    providers: getProviders(env),
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
    },
    callbacks: {
      jwt({ token, user, profile, trigger }) {
        if (user?.id) {
          token.sub = user.id;
        }

        // 로그인 시 현재 OAuth provider의 profile 데이터로 덮어씀
        // MongoDBAdapter가 계정을 연결할 때 DB의 기존 유저(최초 provider) 데이터를 쓰는 문제 방지
        if (trigger === "signIn") {
          const email = profile?.email ?? user?.email;
          const name = profile?.name ?? user?.name;
          if (email) token.email = email;
          if (name) token.name = name;
        }

        token.role = isAdminEmail(token.email) ? "admin" : "user";

        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub ?? "";
          session.user.role = toUserRole(token.role);
        }

        return session;
      },
    },
  } satisfies NextAuthConfig;
});
