import React, { useState } from "react";
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
    <div className={`todo-container ${isDarkMode ? "dark" : "light"}`}>
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
              className={`filter-btn ${filter === f ? "active" : ""}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo Items List */}
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? "completed" : ""}`}>
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
}