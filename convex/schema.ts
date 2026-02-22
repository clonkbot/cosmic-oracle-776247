import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // Store user profiles linked to wallet addresses
  profiles: defineTable({
    userId: v.id("users"),
    walletAddress: v.optional(v.string()),
    lastFortuneTime: v.optional(v.number()),
    matchHistory: v.array(v.object({
      targetAddress: v.string(),
      compatibility: v.number(),
      timestamp: v.number(),
    })),
  }).index("by_user", ["userId"])
    .index("by_wallet", ["walletAddress"]),

  // Store match results for social features
  matches: defineTable({
    initiatorUserId: v.id("users"),
    initiatorAddress: v.string(),
    targetAddress: v.string(),
    compatibility: v.number(),
    element1: v.string(),
    element2: v.string(),
    timestamp: v.number(),
  }).index("by_initiator", ["initiatorUserId"])
    .index("by_timestamp", ["timestamp"]),
});
