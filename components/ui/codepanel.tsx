"use client";

import React, { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";
import {
  Eye,
  Code2,
  Download,
  Wand2,
  Atom,
} from "lucide-react";

type ViewMode = "preview" | "code";

export const DEFAULT_DEPENDENCIES: Record<string, string> = {
  "lucide-react": "^0.475.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "canvas-confetti": "^1.9.4",
};

export const DEFAULT_SANDPACK_FILES: Record<string, string> = {
  "/App.tsx": `import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [city, setCity] = useState("San Francisco");
  const [weather, setWeather] = useState({
    temp: 72,
    condition: "Sunny",
    humidity: 45,
    wind: 8,
    forecast: [
      { day: "Mon", temp: 72, icon: "☀️" },
      { day: "Tue", temp: 68, icon: "Partly Cloudy" },
      { day: "Wed", temp: 75, icon: "☀️" },
      { day: "Thu", temp: 70, icon: "🌧️" },
      { day: "Fri", temp: 74, icon: "☀️" },
    ]
  });

  return (
    <div className="weather-container">
      <div className="weather-card">
        <div className="search-bar">
          <input 
            type="text" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            placeholder="Search city..." 
          />
          <button>Search</button>
        </div>

        <div className="current-weather">
          <div className="weather-icon">☀️</div>
          <div className="temp-display">
            <h1>{weather.temp}°F</h1>
            <p className="city-name">{city}</p>
            <p className="condition">{weather.condition}</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Humidity</span>
            <span className="stat-val">{weather.humidity}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Wind</span>
            <span className="stat-val">{weather.wind} mph</span>
          </div>
        </div>

        <div className="forecast-section">
          <h3>5-Day Forecast</h3>
          <div className="forecast-grid">
            {weather.forecast.map((f, i) => (
              <div key={i} className="forecast-card">
                <span className="day">{f.day}</span>
                <span className="icon">{f.icon}</span>
                <span className="temp">{f.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  "/styles.css": `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.weather-container { width: 100%; max-width: 480px; }
.weather-card {
  background: #121217;
  border: 1px solid #27272a;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}
.search-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.search-bar input {
  flex: 1;
  background: #18181b;
  border: 1px solid #3f3f46;
  border-radius: 0.75rem;
  padding: 0.6rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}
.search-bar button {
  background: #6366f1;
  border: none;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.current-weather {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.weather-icon { font-size: 3.5rem; }
.temp-display h1 { font-size: 3rem; font-weight: 800; color: #fff; line-height: 1; }
.city-name { font-size: 1.1rem; color: #a1a1aa; font-weight: 500; margin-top: 0.25rem; }
.condition { font-size: 0.9rem; color: #818cf8; font-weight: 600; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.stat-item {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
}
.stat-label { font-size: 0.75rem; color: #71717a; }
.stat-val { font-size: 1.1rem; font-weight: 700; color: #f4f4f5; margin-top: 0.25rem; }
.forecast-section h3 { font-size: 0.9rem; font-weight: 700; color: #d4d4d8; margin-bottom: 0.75rem; }
.forecast-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
.forecast-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 0.6rem;
  padding: 0.6rem 0.4rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.forecast-card .day { font-size: 0.7rem; color: #71717a; }
.forecast-card .icon { font-size: 1rem; }
.forecast-card .temp { font-size: 0.8rem; font-weight: 600; color: #fff; }`,
};

interface CodePanelProps {
  files?: Record<string, any>;
  dependencies?: Record<string, string>;
  isGenerating?: boolean;
}

export default function CodePanel({
  files = DEFAULT_SANDPACK_FILES,
  dependencies = DEFAULT_DEPENDENCIES,
  isGenerating = false,
}: CodePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  // Format files into standard Sandpack format: Record<string, string>
  const normalizedFiles: Record<string, string> = {};
  for (const [path, val] of Object.entries(files)) {
    if (typeof val === "string") {
      normalizedFiles[path] = val;
    } else if (val && typeof val.code === "string") {
      normalizedFiles[path] = val.code;
    }
  }

  // Determine template based on file extensions
  const hasTsx = Object.keys(normalizedFiles).some((k) => k.endsWith(".tsx") || k.endsWith(".ts"));
  const template = hasTsx ? "react-ts" : "react";

  const mergedDependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
  };

  const handleDownload = () => {
    const jsonStr = JSON.stringify(normalizedFiles, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-app.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Create unique key for SandpackProvider when files change
  const sandpackKey = Object.entries(normalizedFiles)
    .map(([k, v]) => `${k}:${v.length}`)
    .join("-");

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden min-w-0">
      <SandpackProvider
        key={sandpackKey}
        template={template}
        theme={nightOwl}
        files={normalizedFiles}
        customSetup={{
          dependencies: mergedDependencies,
        }}
        options={{
          recompileMode: "immediate",
          recompileDelay: 300,
        }}
        style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}
      >
        {/* ── Control Bar ───────────────────────────────────── */}
        <div className="h-11 border-b border-neutral-800/80 bg-[#0a0a0d] px-4 flex items-center justify-between shrink-0 select-none gap-2">
          {/* Left: Code vs Preview tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === "code"
                  ? "text-white bg-neutral-800/90 font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>

            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === "preview"
                  ? "text-white bg-neutral-800/90 font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 px-3 py-1 rounded-md transition-colors font-medium"
            >
              <Wand2 className="w-3 h-3 text-purple-400" />
              <span>Improve with Agent (Pro)</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 px-3 py-1 rounded-md transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* ── Canvas Area ────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }} className="bg-[#08080b] relative">
          
          {/* Centered Loading State */}
          {isGenerating ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#070709] gap-4 z-20">
              <div className="relative flex items-center justify-center">
                <Atom className="w-12 h-12 text-blue-400 animate-spin transition-all duration-700" style={{ animationDuration: "4s" }} />
                <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500/20 blur-lg animate-pulse" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Generating React Components
                </h3>
                <p className="text-xs text-neutral-500">
                  Transpiling live preview in Sandpack...
                </p>
              </div>
            </div>
          ) : (
            <SandpackLayout
              style={{
                display: "flex",
                flex: 1,
                height: "100%",
                minHeight: 0,
                width: "100%",
                border: "none",
                borderRadius: 0,
                background: "transparent",
                gap: 0,
              }}
            >
              {/* Code Editor View (Step 9) */}
              {viewMode === "code" && (
                <>
                  <SandpackFileExplorer
                    style={{
                      height: "100%",
                      background: "#0a0a0d",
                      borderRight: "1px solid rgba(255,255,255,0.08)",
                      minWidth: 160,
                      maxWidth: 200,
                    }}
                  />
                  <SandpackCodeEditor
                    showTabs
                    showLineNumbers
                    showInlineErrors
                    wrapContent
                    closableTabs
                    style={{ height: "100%", flex: 1, minWidth: 0, background: "#08080a" }}
                  />
                </>
              )}

              {/* Preview View (Step 7: SandpackPreview directly in-browser) */}
              {viewMode === "preview" && (
                <div className="flex-1 h-full min-h-0 flex flex-col justify-center items-center overflow-hidden">
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton={true}
                    showOpenInCodeSandbox={false}
                    style={{ flex: 1, height: "100%", minHeight: 0, width: "100%", background: "#09090b" }}
                  />
                </div>
              )}
            </SandpackLayout>
          )}
        </div>
      </SandpackProvider>
    </div>
  );
}
