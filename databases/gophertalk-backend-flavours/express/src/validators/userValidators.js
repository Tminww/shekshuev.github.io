import { z } from "zod";

const usernameSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Must be alphanumeric or underscore")
  .regex(/^[^0-9]/, "Must start with a letter");

const passwordSchema = z
  .string()
  .min(5)
  .max(30)
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Must contain letter, number and special character"
  );

export const updateUserValidator = z
  .object({
    user_name: usernameSchema.optional(),
    password: passwordSchema.optional(),
    password_confirm: passwordSchema.optional(),
    first_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed")
      .optional(),
    last_name: z
      .string()
      .min(1)
      .max(30)
      .regex(/^[\p{L}]+$/u, "Only letters allowed")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.password_confirm) {
        return data.password === data.password_confirm;
      }
      return true;
    },
    {
      message: "Passwords must match",
      path: ["password_confirm"],
    }
  );
