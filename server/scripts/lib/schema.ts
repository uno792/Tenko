import { z } from "zod";

export const EventItem = z.object({
  title: z.string().min(3),
  description: z.string().optional().default(""),
  type: z.enum(["Hackathon","Bursary","CareerFair","Other"]).default("Other"),
  start_date: z.string().nullable().optional(), // YYYY-MM-DD or null
  end_date: z.string().nullable().optional(),
  location: z.string().optional().default(""),
  link: z.string().url()
});

export const EventItems = z.array(EventItem).max(50);
export type EventItemT = z.infer<typeof EventItem>;
