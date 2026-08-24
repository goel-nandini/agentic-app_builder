import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const apiKey = env.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey) {
  console.error("GEMINI_API_KEY is missing in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

export const APP_GENERATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    files: {
      type: "ARRAY",
      description: "All files needed for the web application",
      items: {
        type: "OBJECT",
        properties: {
          path: {
            type: "STRING",
            description: "File path, e.g. /App.tsx, /styles.css, or package.json",
          },
          content: {
            type: "STRING",
            description: "Complete runnable file content",
          },
        },
        required: ["path", "content"],
      },
    },
    explanation: {
      type: "STRING",
      description: "Brief description of the generated application",
    },
  },
  required: ["files"],
};

export const SYSTEM_INSTRUCTION = `You are an expert web application generator.

Generate a complete runnable web application from the user's request.

Generate actual source code, not a plan or task list.

The application must:
- directly implement the user's request
- include complete UI
- include required functionality
- include required styles
- include required dependencies
- have valid imports
- have valid package.json
- be buildable
- not contain TODO placeholders
- not return explanations outside JSON
- not return markdown
- return only structured application files.`;

const userPrompt = "Build a simple todo app with add, delete, complete and dark mode.";

console.log("==========================================");
console.log("PHASE 2 TEST: SENDING USER PROMPT TO GEMINI");
console.log("==========================================");
console.log("Request Prompt:", userPrompt);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let responseText = null;
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    console.log(`Sending request to Gemini (attempt ${attempt}/4)...`);
    const res = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ text: `USER REQUEST:\n${userPrompt}` }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: APP_GENERATION_SCHEMA,
      },
    });

    responseText = res.text;
    console.log("Raw Response received! Length:", responseText?.length);
    break;
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes("429") || msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
      console.warn(`[429 Quota Rate Limit] Waiting 30s for quota window reset before retry (attempt ${attempt}/4)...`);
      await sleep(30000);
    } else {
      console.error("Gemini Error:", msg);
      break;
    }
  }
}

if (!responseText) {
  console.error("Failed to get response from Gemini.");
  process.exit(1);
}

try {
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  const parsed = JSON.parse(cleaned);
  console.log("\n==========================================");
  console.log("GEMINI RESPONSE STRUCTURE VALIDATION");
  console.log("==========================================");
  console.log("Has files array:", Array.isArray(parsed.files));
  console.log("Number of files generated:", parsed.files?.length);
  console.log("Generated File Names:");
  parsed.files.forEach(f => console.log("  -", f.path));

  console.log("\n==========================================");
  console.log("FILE CONTENT VERIFICATION");
  console.log("==========================================");
  parsed.files.forEach(f => {
    console.log(`\n--- [FILE: ${f.path}] ---`);
    console.log(f.content.slice(0, 300) + "...\n(Total length: " + f.content.length + " chars)");
  });

  const appFile = parsed.files.find(f => f.path.includes("App.tsx") || f.path.includes("App.jsx"));
  const hasTaskDescriptions = appFile?.content.includes("Initialize Core Application Architecture");
  console.log("\n==========================================");
  console.log("FINAL PHASE 2 VERIFICATION:");
  console.log("Contains actual application code:", appFile ? true : false);
  console.log("Free of task descriptions ('Initialize Core...'):", !hasTaskDescriptions);
  console.log("==========================================");
} catch (e) {
  console.error("JSON Parsing Error:", e.message);
  console.log("Raw text snippet:", responseText.slice(0, 500));
}
