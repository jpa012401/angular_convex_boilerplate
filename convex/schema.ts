import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("secretary"), v.literal("personnel"))),
  }),

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),
});
