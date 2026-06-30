import { z } from "zod";

const mongodbUriSchema = z
  .string()
  .min(1, "MONGODB_URI is required")
  .refine(
    (value) =>
      value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
    "MONGODB_URI must start with mongodb:// or mongodb+srv://",
  );

const emailListSchema = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  MONGODB_URI: mongodbUriSchema,
  MONGODB_DB: z.string().min(1).default("stay-mate"),
  ADMIN_EMAILS: emailListSchema,

  AUTH_SECRET: optionalString,
  AUTH_URL: optionalString,

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  KAKAO_CLIENT_ID: optionalString,
  KAKAO_CLIENT_SECRET: optionalString,
  NAVER_CLIENT_ID: optionalString,
  NAVER_CLIENT_SECRET: optionalString,

  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  MAIL_FROM: optionalString,

  PROPERTY_ADDRESS: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

export function getAdminEmails(): string[] {
  return getServerEnv().ADMIN_EMAILS;
}
