import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol.");

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().email("Enter a valid email address."),
    password: passwordSchema,
    rePassword: z.string().min(1, "Confirm your password."),
    phone: z.string().trim().regex(/^\+?[0-9\s()-]{8,}$/, "Enter a valid phone number."),
    terms: z.literal(true, { error: "Please agree to the Terms of Service and Privacy Policy." }),
  })
  .refine((values) => values.password === values.rePassword, {
    message: "Passwords do not match.",
    path: ["rePassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetCodeSchema = z.object({
  resetCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code sent to your email."),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
