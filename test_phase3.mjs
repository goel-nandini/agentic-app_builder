import { ensureWorkspace, getWorkspacePath } from "./lib/sandbox/sandboxManager.ts";
import { writeFile, listFiles, readFile, getWorkspaceFilesMap } from "./lib/sandbox/fileTools.ts";
import { existsSync } from "fs";
import path from "path";

async function testPhase3() {
  console.log("==========================================");
  console.log("PHASE 3 TEST: SANDBOX DISK FILE WRITING & VERIFICATION");
  console.log("==========================================");

  const projectId = `phase3_test_${Date.now()}`;
  console.log(`1. Creating/Initializing isolated sandbox workspace for project: '${projectId}'...`);
  const workspacePath = await ensureWorkspace(projectId);
  console.log(`   └─ Physical Workspace Path: ${workspacePath}`);

  // Test Path Traversal Protection
  console.log("\n2. Testing Path Traversal Protection (security validation)...");
  try {
    await writeFile(projectId, "../../outside_file.txt", "MALICIOUS CONTENT");
    console.error("❌ FAILED: Path traversal was allowed!");
  } catch (err) {
    console.log(`   └─ ✅ SUCCESS: Path traversal correctly blocked: ${err.message}`);
  }

  // Simulated Gemini output files
  const sampleGeneratedFiles = [
    {
      path: "/package.json",
      content: JSON.stringify({
        name: "todo-app",
        version: "1.0.0",
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "lucide-react": "^0.300.0" }
      }, null, 2)
    },
    {
      path: "/App.tsx",
      content: `import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Learn Phase 3 Sandbox Writing", completed: true },
    { id: 2, text: "Build Todo App with Add, Delete, Complete", completed: false }
  ]);
  const [input, setInput] = useState("");

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
    setInput("");
  };

  const toggleComplete = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="todo-app">
      <h1>Todo App</h1>
      <form onSubmit={addTodo}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Add new task..." />
        <button type="submit">Add Todo</button>
      </form>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? "completed" : ""}>
            <span onClick={() => toggleComplete(todo.id)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`
    },
    {
      path: "/styles.css",
      content: `body { background: #09090b; color: white; font-family: system-ui; }
.todo-app { max-width: 400px; margin: 2rem auto; }
.completed { text-decoration: line-through; opacity: 0.6; }`
    }
  ];

  console.log("\n3. Writing files physically to sandbox workspace disk...");
  for (const file of sampleGeneratedFiles) {
    const res = await writeFile(projectId, file.path, file.content);
    console.log(`   └─ Wrote physical file to disk: ${res.path}`);
  }

  console.log("\n4. Verifying files physically exist on disk using readdir & fs.stat...");
  const physicalFiles = await listFiles(projectId);
  console.log("   Physical Sandbox Directory Listing:");
  physicalFiles.forEach(f => console.log(`     - [${f.isDir ? "DIR" : "FILE"}] ${f.path} (${f.size} bytes)`));

  const pkgJsonDiskPath = path.join(workspacePath, "package.json");
  const appTsxDiskPath = path.join(workspacePath, "App.tsx");

  console.log("\n5. Physical Disk Existence Checks:");
  console.log(`   - package.json physically exists on disk: ${existsSync(pkgJsonDiskPath)}`);
  console.log(`   - App.tsx physically exists on disk: ${existsSync(appTsxDiskPath)}`);

  console.log("\n6. Reading App.tsx from disk and verifying code content:");
  const diskAppContent = await readFile(projectId, "/App.tsx");
  console.log("   --- [PHYSICAL FILE CONTENT FROM DISK: /App.tsx] ---");
  console.log(diskAppContent.slice(0, 350) + "...\n");

  const hasTodoCode = diskAppContent.includes("setTodos") && diskAppContent.includes("deleteTodo");
  console.log("==========================================");
  console.log("PHASE 3 VERIFICATION RESULTS:");
  console.log("Physical files written to disk:", true);
  console.log("package.json physically exists:", existsSync(pkgJsonDiskPath));
  console.log("App.tsx physically exists:", existsSync(appTsxDiskPath));
  console.log("App.tsx contains actual todo application code:", hasTodoCode);
  console.log("==========================================");
}

testPhase3().catch(console.error);
