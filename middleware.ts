import arcjet, { detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/projects(.*)",
]);

// Routes that have their own per-route Arcjet protection (lib/arcjet.ts)
// Skip global Arcjet on these to avoid double-protection and false positives
// from server-to-server / Lambda traffic that Arcjet can't fingerprint as a browser.
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

// ─── Global Arcjet client ─────────────────────────────────────────────────────
// Only runs on UI routes. Allows search engines and link previews so the
// landing page gets indexed and Slack/Twitter unfurls work.

const aj = process.env.ARCJET_KEY
  ? arcjet({
      key: process.env.ARCJET_KEY,
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: [
            "CATEGORY:SEARCH_ENGINE",
            "CATEGORY:PREVIEW",
            "CATEGORY:MONITOR",
          ],
        }),
      ],
    })
  : null;

export default clerkMiddleware(async (auth, req) => {
  // Skip Arcjet bot/shield check on API routes — they protect themselves
  // via lib/arcjet.ts. Lambda/server traffic to /api/* would be
  // incorrectly flagged as a bot since it has no browser fingerprint.
  if (aj && !isApiRoute(req)) {
    try {
      const decision = await aj.protect(req);
      if (decision.isDenied()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch (error) {
      console.warn("Arcjet middleware protection failed:", error);
    }
  }

  // Clerk auth guard — redirect unauthenticated users away from /workspace
  const { userId } = await auth();

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
