import arcjet, {
  tokenBucket,
  detectPromptInjection,
  sensitiveInfo,
} from "@arcjet/next";

// Route-level Arcjet client for /api/gen-ai-code only.
// shield + detectBot handled globally in proxy.ts,
// Characteristics: "userId" means each Clerk user gets their own token bucket,
// so corporate offices / VPNs sharing an IP don't share rate limits.

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"],
  rules: [
    // ── Per-user rate limit ────────────────────────────────────────────────
    // Token bucket: 5 generations per 60 seconds per user.
    // Each call to aj.protect() costs `requested` tokens (we pass 1).
    // Adjust refillRate / capacity for your plans as needed.
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // refill 10 tokens every...
      interval: 60,  // ...60 seconds
      capacity: 10,  // max burst = 10
    }),

    // ── Prompt injection detection ─────────────────────────────────────────
    // Logs suspicious prompts but never hard-blocks them.
    // Switching to DRY_RUN prevents false-positive blocking of valid app prompts.
    detectPromptInjection({
      mode: "DRY_RUN",
    }),

    // ── Sensitive information ──────────────────────────────────────────────
    // Prevents users from accidentally leaking secrets into Gemini prompts
    sensitiveInfo({
      mode: "DRY_RUN",
      deny: ["CREDIT_CARD_NUMBER", "PHONE_NUMBER"],
    }),
  ],
});