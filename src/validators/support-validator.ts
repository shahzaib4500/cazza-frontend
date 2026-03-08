import { z } from "zod";

export const supportTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, { message: "Subject is required" })
    .max(100, { message: "Subject must not exceed 100 characters" }),
  priority: z.string().min(1, { message: "Please select a priority" }),
  category: z.string().min(1, { message: "Please select a category" }),
  description: z
    .string()
    .trim()
    .min(1, { message: "Description is required" })
    .min(10, { message: "Description must be at least 10 characters" })
    .max(2000, { message: "Description must not exceed 2000 characters" })
});

export type SupportTicketData = z.infer<typeof supportTicketSchema>;
