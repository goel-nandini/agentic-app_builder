import arcjet, { detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/projects(.*)",
]);

// ─── Global Arcjet client ─────────────────────────────────────────────────────
// Runs on every request. Looser than the route-level client — allows search
// engines, link previews, and AWS Lambda/Amplify internal traffic so the
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
            "CATEGORY:MONITOR",   // allows uptime monitors / health checks
            "CATEGORY:CLOUD",     // allows AWS Lambda / Amplify internal traffic
          ],
        }),
      ],
    })
  : null;

export default clerkMiddleware(async (auth, req) => {
  if (aj) {
    try {
      const decision = await aj.protect(req);
      if (decision.isDenied()) {
        // Only hard-block on shield (attack detection), not bot detection on
        // API routes — API calls come from server-side / Lambda environments
        // that Arcjet may misclassify as bots.
        const isApiRoute = req.nextUrl.pathname.startsWith("/api/");
        if (!isApiRoute) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
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
