async function runTest() {
  console.log("==================================================");
  console.log("REFERENCE ARCHITECTURE FLOW VERIFICATION TEST");
  console.log("==================================================");

  // ── TEST 1: Weather App Prompt ─────────────────────────────────
  const weatherPrompt = "A weather app with animated icons, city search, temperature, humidity, wind speed and a modern responsive UI.";
  console.log(`\n[Test 1] Sending prompt: "${weatherPrompt}" to /api/gen-ai-code...`);

  const res1 = await fetch("http://localhost:3000/api/gen-ai-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: weatherPrompt }),
  });

  const data1 = await res1.json();
  console.log("[Test 1 Response] Success:", data1.success);
  console.log("[Test 1 Response] Assistant message:", data1.assistantMessage);
  console.log("[Test 1 Response] Generated Files:", Object.keys(data1.files || {}));
  console.log("[Test 1 Response] Dependencies:", data1.dependencies);

  const appCode1 = data1.files?.["/App.tsx"]?.code || data1.files?.["/App.js"]?.code || "";
  const hasWeatherTerms = appCode1.toLowerCase().includes("weather") || appCode1.toLowerCase().includes("temp") || appCode1.toLowerCase().includes("city");
  const hasMockTasks1 = appCode1.includes("Initialize Core Application Architecture") || appCode1.includes("AI Generated Workspace");

  console.log("  └─ App code contains real weather application logic:", hasWeatherTerms);
  console.log("  └─ App code contains mock task cards:", hasMockTasks1);

  // ── TEST 2: Todo App Prompt ────────────────────────────────────
  const todoPrompt = "Build a simple todo app with add, delete, complete and dark mode.";
  console.log(`\n[Test 2] Sending prompt: "${todoPrompt}" to /api/gen-ai-code...`);

  const res2 = await fetch("http://localhost:3000/api/gen-ai-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: todoPrompt }),
  });

  const data2 = await res2.json();
  console.log("[Test 2 Response] Success:", data2.success);
  console.log("[Test 2 Response] Assistant message:", data2.assistantMessage);
  console.log("[Test 2 Response] Generated Files:", Object.keys(data2.files || {}));

  const appCode2 = data2.files?.["/App.tsx"]?.code || data2.files?.["/App.js"]?.code || "";
  const hasTodoTerms = appCode2.toLowerCase().includes("todo") || appCode2.toLowerCase().includes("task");
  const hasMockTasks2 = appCode2.includes("Initialize Core Application Architecture") || appCode2.includes("AI Generated Workspace");

  console.log("  └─ App code contains real todo application logic:", hasTodoTerms);
  console.log("  └─ App code contains mock task cards:", hasMockTasks2);

  console.log("\n==================================================");
  console.log("VERIFICATION SUMMARY:");
  console.log("Weather app generated successfully:", hasWeatherTerms && !hasMockTasks1);
  console.log("Todo app generated successfully:", hasTodoTerms && !hasMockTasks2);
  console.log("Output is dynamic between prompts:", appCode1 !== appCode2);
  console.log("==================================================");
}

runTest().catch(console.error);
