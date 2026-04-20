import { z } from "zod";

export const experienceSchema = z.object({
  title: z.string().min(5).max(120),

  subtitle: z.string().max(180).nullable().optional(),

  short_description: z.string().min(10).max(240),

  description: z.string().min(30),

  booking_mode: z.enum(["instant", "request"]),

  duration_minutes: z.number().int().positive(),

  cutoff_minutes: z.number().int().min(0),

  min_guests: z.number().int().min(1),

  max_guests: z.number().int().min(1),

  base_price: z.number().positive(),

  base_currency: z.string(),

  base_price_type: z.enum(["per_person", "per_group"]),

  category_id: z.string().uuid().nullable(),

  primary_location_id: z.string().uuid().nullable(),

  status: z.enum([
    "draft",
    "pending_review",
    "published",
    "paused",
    "archived",
  ]),

  is_active: z.boolean(),
});

export type ExperienceFormValues = z.input<typeof experienceSchema>;
export type ExperienceInput = z.output<typeof experienceSchema>;