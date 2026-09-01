import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/projects(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const authObj = await auth();

    if (!authObj.userId && isProtectedRoute(req)) {
      return authObj.redirectToSignIn();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
