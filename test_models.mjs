import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const apiKey = env.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

const ai = new GoogleGenAI({ apiKey });

const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.6-flash"];

for (const model of models) {
  try {
    console.log(`Testing model: ${model}...`);
    const res = await ai.models.generateContent({
      model: model,
      contents: [{ text: "Hello! Reply SUCCESS" }],
    });
    console.log(`[SUCCESS] ${model}:`, res.text?.trim());
    break;
  } catch (err) {
    console.error(`[FAIL] ${model}:`, err.message || err);
  }
}
