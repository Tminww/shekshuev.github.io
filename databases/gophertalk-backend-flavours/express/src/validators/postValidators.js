import { z } from "zod";

export const createPostValidator = z.object({
  text: z.string().min(1).max(280),
  reply_to_id: z
    .number()
    .optional()
    .nullable()
    .refine(val => val === undefined || val > 0, {
      message: "ReplyToID must be greater than 0",
    }),
});

export const filterPostValidator = z.object({
  search: z.string().optional(),
  owner_id: z.string().regex(/^\d+$/).optional(),
  user_id: z.string().regex(/^\d+$/).optional(),
  reply_to_id: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});
