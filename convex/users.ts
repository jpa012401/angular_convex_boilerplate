/**
 * User queries for authentication and user data retrieval.
 *
 * @module users
 */
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the currently authenticated user's full document.
 *
 * @returns The user document if authenticated, null otherwise.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

/**
 * Get the authenticated user's identity from the JWT token.
 *
 * Returns identity claims (subject, issuer, email, etc.) without
 * fetching the full user document from the database.
 *
 * @returns The UserIdentity object if authenticated, null otherwise.
 */
export const getUserIdentity = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.auth.getUserIdentity();
  },
});
