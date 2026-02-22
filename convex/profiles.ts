import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

export const updateWallet = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { walletAddress: args.walletAddress });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId,
        walletAddress: args.walletAddress,
        matchHistory: [],
      });
    }
  },
});

export const recordFortune = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { lastFortuneTime: Date.now() });
    }
  },
});

export const recordMatch = mutation({
  args: {
    targetAddress: v.string(),
    compatibility: v.number(),
    element1: v.string(),
    element2: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    // Add to match history
    const newHistory = [
      ...profile.matchHistory.slice(-9), // Keep last 10
      {
        targetAddress: args.targetAddress,
        compatibility: args.compatibility,
        timestamp: Date.now(),
      },
    ];

    await ctx.db.patch(profile._id, { matchHistory: newHistory });

    // Also store in matches table for social features
    await ctx.db.insert("matches", {
      initiatorUserId: userId,
      initiatorAddress: profile.walletAddress || "",
      targetAddress: args.targetAddress,
      compatibility: args.compatibility,
      element1: args.element1,
      element2: args.element2,
      timestamp: Date.now(),
    });
  },
});

export const getRecentMatches = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_timestamp")
      .order("desc")
      .take(20);

    return matches;
  },
});
