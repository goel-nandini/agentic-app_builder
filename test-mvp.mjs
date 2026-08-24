// node test-mvp.mjs
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const apiKey = env.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

console.log("=== REQUIREMENT 1: VERIFY GEMINI FIRST ===");
console.log("API Key Prefix:", apiKey?.slice(0, 10), "...");

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY missing!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let success = false;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`Sending test request (Attempt ${attempt}/3)...`);
    const res = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ text: "Reply with the word SUCCESS" }],
    });
    console.log("Gemini API Response:", res.text?.trim());
    if (res.text?.includes("SUCCESS")) {
      console.log("\n✅ REQUIREMENT 1 PASSED: Basic Gemini request succeeded!");
      success = true;
      break;
    }
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes("429") || msg.includes("Quota exceeded")) {
      console.warn(`[429 Quota Rate Limit] Waiting 30s before attempt ${attempt + 1}...`);
      await sleep(30000);
    } else {
      console.error("❌ Request failed:", msg);
      break;
    }
  }
}

if (!success) {
  process.exit(1);
}
