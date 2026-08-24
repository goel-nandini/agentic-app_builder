import React, { useState } from "react";
import "./styles.css";

interface Item {
  id: number;
  title: string;
  category: string;
  status: string;
  priority: "High" | "Medium" | "Low";
}

export default function App() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, title: "Initialize Core Application Architecture", category: "Metrics", status: "Done", priority: "High" },
    { id: 2, title: "Connect Reactive State Management", category: "Logic", status: "In Progress", priority: "High" },
    { id: 3, title: "Apply Dynamic Glassmorphism Styling", category: "Design", status: "In Progress", priority: "Medium" },
    { id: 4, title: "Optimize Mobile Responsive Viewports", category: "UX", status: "Pending", priority: "Low" },
  ]);

  const [inputTitle, setInputTitle] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    const newItem: Item = {
      id: Date.now(),
      title: inputTitle,
      category: "Metrics",
      status: "In Progress",
      priority: "Medium",
    };

    setItems([newItem, ...items]);
    setInputTitle("");
  };

  const toggleStatus = (id: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === "Done" ? "In Progress" : "Done";
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const filteredItems = items.filter(item => {
    if (activeFilter === "Done") return item.status === "Done";
    if (activeFilter === "In Progress") return item.status === "In Progress";
    return true;
  });

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <div>
            <h1>Analytics & Metrics Dashboard</h1>
            <p>Real-time performance tracking, KPI cards & interactive data filters</p>
          </div>
        </div>
        <div className="badge-pill">Agentic AI Builder Active</div>
      </header>

      {/* Main Content Workspace */}
      <main className="app-main">
        {/* Quick Add Form */}
        <form onSubmit={handleAddItem} className="input-card">
          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            placeholder="Add new requirement, feature, or task item..."
            className="styled-input"
          />
          <button type="submit" className="primary-btn">
            + Add Item
          </button>
        </form>

        {/* Filter Pills */}
        <div className="filter-bar">
          {["All", "In Progress", "Done"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`filter-btn ${activeFilter === filter ? "active" : ""}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="items-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className={`item-card ${item.status === "Done" ? "completed" : ""}`}>
              <div className="card-header">
                <span className="item-category">{item.category}</span>
                <span className={`item-priority ${item.priority.toLowerCase()}`}>{item.priority}</span>
              </div>
              <h3 className="item-title">{item.title}</h3>
              <div className="card-footer">
                <button onClick={() => toggleStatus(item.id)} className="status-toggle-btn">
                  {item.status === "Done" ? "✓ Completed" : "⏳ " + item.status}
                </button>
                <button onClick={() => removeItem(item.id)} className="delete-btn" title="Remove item">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}