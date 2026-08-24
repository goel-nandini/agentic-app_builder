export function buildSmartFallbackApp(userPrompt: string) {
  const promptLower = userPrompt.toLowerCase();

  // ── 1. WEATHER APPLICATION TEMPLATE ─────────────────────────────
  if (promptLower.includes("weather") || promptLower.includes("temp") || promptLower.includes("forecast")) {
    const weatherAppTsx = `import React, { useState } from "react";
import "./styles.css";

interface ForecastDay {
  day: string;
  temp: number;
  condition: string;
  icon: string;
}

export default function App() {
  const [city, setCity] = useState("San Francisco");
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState({
    temp: 72,
    condition: "Sunny & Clear",
    humidity: 45,
    wind: 8,
    icon: "☀️",
  });

  const [forecast] = useState<ForecastDay[]>([
    { day: "Mon", temp: 72, condition: "Sunny", icon: "☀️" },
    { day: "Tue", temp: 68, condition: "Cloudy", icon: "⛅" },
    { day: "Wed", temp: 75, condition: "Sunny", icon: "☀️" },
    { day: "Thu", temp: 70, condition: "Rainy", icon: "🌧️" },
    { day: "Fri", temp: 74, condition: "Sunny", icon: "☀️" },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setCity(searchQuery);
    // Simulate dynamic weather values for searched city
    const randomTemp = Math.floor(Math.random() * 30) + 55;
    const randomHumidity = Math.floor(Math.random() * 40) + 30;
    const randomWind = Math.floor(Math.random() * 15) + 5;
    setWeather({
      temp: randomTemp,
      condition: randomTemp > 70 ? "Sunny & Clear" : "Partly Cloudy",
      humidity: randomHumidity,
      wind: randomWind,
      icon: randomTemp > 70 ? "☀️" : "⛅",
    });
    setSearchQuery("");
  };

  return (
    <div className="weather-app">
      <div className="weather-card">
        {/* City Search Bar */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city (e.g. New York, Tokyo)..."
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        {/* Current Weather Display */}
        <div className="current-weather">
          <div className="weather-animated-icon">{weather.icon}</div>
          <div className="temp-info">
            <h1 className="temperature">{weather.temp}°F</h1>
            <h2 className="city-title">{city}</h2>
            <p className="condition-text">{weather.condition}</p>
          </div>
        </div>

        {/* Climate Metrics */}
        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-icon">💧</span>
            <div>
              <span className="metric-label">Humidity</span>
              <h4 className="metric-value">{weather.humidity}%</h4>
            </div>
          </div>
          <div className="metric-box">
            <span className="metric-icon">💨</span>
            <div>
              <span className="metric-label">Wind Speed</span>
              <h4 className="metric-value">{weather.wind} mph</h4>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast Grid */}
        <div className="forecast-container">
          <h3 className="forecast-title">5-Day Forecast</h3>
          <div className="forecast-grid">
            {forecast.map((f, i) => (
              <div key={i} className="forecast-card">
                <span className="forecast-day">{f.day}</span>
                <span className="forecast-icon">{f.icon}</span>
                <span className="forecast-temp">{f.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;

    const weatherStylesCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.weather-app { width: 100%; max-width: 480px; }
.weather-card {
  background: #121217;
  border: 1px solid #27272a;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(0,0,0,0.7);
}
.search-form { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
.search-input {
  flex: 1;
  background: #18181b;
  border: 1px solid #3f3f46;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}
.search-btn {
  background: #6366f1;
  border: none;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.search-btn:hover { background: #4f46e5; }
.current-weather { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
.weather-animated-icon { font-size: 4rem; animation: pulse 3s infinite ease-in-out; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.temperature { font-size: 3.5rem; font-weight: 800; color: #ffffff; line-height: 1; }
.city-title { font-size: 1.25rem; color: #a1a1aa; font-weight: 500; margin-top: 0.25rem; }
.condition-text { font-size: 0.95rem; color: #818cf8; font-weight: 600; margin-top: 0.15rem; }
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
.metric-box {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.metric-icon { font-size: 1.5rem; }
.metric-label { font-size: 0.75rem; color: #71717a; text-transform: uppercase; }
.metric-value { font-size: 1.1rem; font-weight: 700; color: #fff; margin-top: 0.1rem; }
.forecast-title { font-size: 0.9rem; font-weight: 700; color: #d4d4d8; margin-bottom: 1rem; }
.forecast-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
.forecast-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 0.75rem;
  padding: 0.75rem 0.4rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}
.forecast-day { font-size: 0.75rem; color: #71717a; }
.forecast-icon { font-size: 1.25rem; }
.forecast-temp { font-size: 0.85rem; font-weight: 600; color: #fff; }`;

    return {
      files: {
        "/App.tsx": weatherAppTsx,
        "/styles.css": weatherStylesCss,
      },
      explanation: `Generated Weather Application for: "${userPrompt}"`,
      steps: ["Constructed interactive weather card UI", "Added city search & 5-day forecast", "Applied CSS dark theme styling"],
    };
  }

  // ── 2. TODO APPLICATION TEMPLATE ─────────────────────────────────
  if (promptLower.includes("todo") || promptLower.includes("task") || promptLower.includes("kanban")) {
    const todoAppTsx = `import React, { useState } from "react";
import "./styles.css";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Build a todo application with dark mode", completed: true },
    { id: 2, text: "Test add, delete and toggle complete functionality", completed: false },
    { id: 3, text: "Verify live Sandpack sandbox preview", completed: false },
  ]);
  const [inputText, setInputText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newTodo: Todo = {
      id: Date.now(),
      text: inputText,
      completed: false,
    };
    setTodos([newTodo, ...todos]);
    setInputText("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const filteredTodos = todos.filter(t => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <div className={\`todo-container \${isDarkMode ? "dark" : "light"}\`}>
      <div className="todo-card">
        {/* Header with Theme Toggle */}
        <header className="todo-header">
          <div>
            <h1>Task Tracker</h1>
            <p>{todos.filter(t => !t.completed).length} items remaining</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle-btn">
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        {/* Input Form */}
        <form onSubmit={handleAddTodo} className="todo-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
          />
          <button type="submit" className="add-btn">+ Add</button>
        </form>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={\`filter-btn \${filter === f ? "active" : ""}\`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo Items List */}
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <li key={todo.id} className={\`todo-item \${todo.completed ? "completed" : ""}\`}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span className="checkmark" />
              </label>
              <span className="todo-text" onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} className="delete-btn">✕</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}`;

    const todoStylesCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1.5rem;
  background: #09090b;
}
.todo-container { width: 100%; max-width: 480px; }
.todo-container.dark { background: #09090b; color: #f4f4f5; }
.todo-container.light { background: #f4f4f5; color: #18181b; }
.todo-card {
  background: #121217;
  border: 1px solid #27272a;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}
.todo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.todo-header h1 { font-size: 1.5rem; font-weight: 800; color: #fff; }
.todo-header p { font-size: 0.8rem; color: #a1a1aa; margin-top: 0.2rem; }
.theme-toggle-btn {
  background: #27272a;
  border: 1px solid #3f3f46;
  color: #fff;
  padding: 0.4rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
}
.todo-form { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
.todo-input {
  flex: 1;
  background: #18181b;
  border: 1px solid #3f3f46;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
}
.add-btn {
  background: #a855f7;
  border: none;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.add-btn:hover { background: #9333ea; }
.filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
.filter-btn {
  background: #18181b;
  border: 1px solid #27272a;
  color: #a1a1aa;
  padding: 0.4rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
}
.filter-btn.active { background: #a855f7; color: white; border-color: #a855f7; }
.todo-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #18181b;
  border: 1px solid #27272a;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
}
.todo-item.completed .todo-text { text-decoration: line-through; opacity: 0.5; }
.todo-text { flex: 1; font-size: 0.9rem; cursor: pointer; }
.delete-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
}`;

    return {
      files: {
        "/App.tsx": todoAppTsx,
        "/styles.css": todoStylesCss,
      },
      explanation: `Generated Todo Application for: "${userPrompt}"`,
      steps: ["Built React todo state handlers", "Added dark mode toggle and task filtering", "Rendered interactive list"],
    };
  }

  // ── 3. DEFAULT INTERACTIVE APPLICATION TEMPLATE ─────────────────
  const defaultAppTsx = `import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app-container">
      <div className="app-card">
        <h1>${userPrompt}</h1>
        <p>Interactive Application Preview</p>

        <div className="counter-box">
          <h2>Count: {count}</h2>
          <div className="btn-group">
            <button onClick={() => setCount(count + 1)} className="btn primary">+ Increment</button>
            <button onClick={() => setCount(0)} className="btn secondary">Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}`;

  const defaultStylesCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, sans-serif;
  background: #09090b;
  color: #f4f4f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}
.app-container { max-width: 480px; width: 100%; }
.app-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 1.25rem;
  padding: 2rem;
  text-align: center;
}
h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff; }
p { color: #a1a1aa; font-size: 0.9rem; margin-bottom: 1.5rem; }
.counter-box { background: #09090b; border: 1px solid #27272a; padding: 1.5rem; border-radius: 1rem; }
.btn-group { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; }
.btn { padding: 0.6rem 1.2rem; border-radius: 0.6rem; font-weight: 600; border: none; cursor: pointer; }
.btn.primary { background: #818cf8; color: white; }
.btn.secondary { background: #27272a; color: #a1a1aa; }`;

  return {
    files: {
      "/App.tsx": defaultAppTsx,
      "/styles.css": defaultStylesCss,
    },
    explanation: `Generated application for: "${userPrompt}"`,
    steps: ["Parsed prompt requirements", "Constructed React component structure", "Loaded interactive Sandpack preview"],
  };
}
