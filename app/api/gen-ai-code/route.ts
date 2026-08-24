import { NextRequest, NextResponse } from "next/server";
import { generateStructuredApp } from "@/lib/ai/gemini";
import { buildSmartFallbackApp } from "@/lib/ai/smartFallback";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required." }, { status: 400 });
    }

    // Step 2 Logging:
    console.log(`[Generate] prompt received: "${prompt}"`);
    console.log("[Gemini] request started");

    let filesMap: Record<string, { code: string }> = {};
    let assistantMessage = `Here is your generated application for: "${prompt}"`;
    let title = "Generated Application";
    let dependencies: Record<string, string> = {
      "lucide-react": "^0.475.0",
      "clsx": "^2.1.1",
      "tailwind-merge": "^2.6.0"
    };

    try {
      const result = await generateStructuredApp(prompt);
      console.log("[Gemini] response received");

      // Transform files array to Sandpack fileData format
      for (const f of result.files) {
        const normalizedPath = f.path.startsWith("/") ? f.path : `/${f.path}`;
        filesMap[normalizedPath] = { code: f.content };
      }

      if (result.explanation) {
        assistantMessage = result.explanation;
      }
    } catch (aiErr: any) {
      console.warn("[Gemini] API error, using smart application template fallback:", aiErr?.message);
      const fallbackApp = buildSmartFallbackApp(prompt);
      
      for (const [filePath, content] of Object.entries(fallbackApp.files)) {
        filesMap[filePath] = { code: content };
      }
      assistantMessage = fallbackApp.explanation || assistantMessage;
    }

    // Return reference architecture payload
    return NextResponse.json({
      success: true,
      assistantMessage,
      title,
      files: filesMap,
      dependencies,
    });
  } catch (error: any) {
    console.error("[Generate] Uncaught error:", error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
