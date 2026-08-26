import {
  Sparkles,
  Zap,
  Code2,
  Eye,
  Package,
  ImageIcon,
  Laptop,
  Layers,
  Wand2,
} from "lucide-react";

export const SUGGESTIONS = [
  "A Spotify stats dashboard with charts",
  "A kanban board with drag and drop",
  "A crypto portfolio tracker with live charts",
  "A personal finance tracker with categories",
  "A SaaS CRM with analytics and customer table",
  "A modern fitness workout planner with streaks",
];

export const FEATURES = [
  {
    icon: Zap,
    label: "Instant Neural Generation",
    desc: "Describe your app in natural English, Hindi, or Hinglish. Nodex AI architects complete multi-file React apps in seconds.",
    tag: "Gemini AI",
  },
  {
    icon: Laptop,
    label: "3-in-1 Multi-Device Preview",
    desc: "Seamlessly test your generated apps across Laptop (full screen), Tablet (768px), and Smartphone (390px) viewports with zero setup.",
    tag: "Responsive",
  },
  {
    icon: Layers,
    label: "Modular Multi-File Code",
    desc: "Clean component architecture with /App.js, /components, and /data/mockData.js — not a messy single-file script.",
    tag: "Architecture",
  },
  {
    icon: Package,
    label: "Auto-Resolved Dependencies",
    desc: "Lucide icons, Recharts, Framer Motion, and Tailwind CSS work right out of the box with zero npm install delays.",
    tag: "Zero Config",
  },
  {
    icon: Wand2,
    label: "Self-Healing Error Recovery",
    desc: "If any preview code produces a runtime error, click 'Fix with AI' and Nodex autonomously diagnoses and patches the bug.",
    tag: "Auto-Fix",
  },
  {
    icon: ImageIcon,
    label: "Visual Image-to-Code",
    desc: "Attach UI screenshots or Figma mockups. Nodex extracts color palettes, layouts, and typography to replicate the design.",
    tag: "Vision AI",
  },
];

export const STEPS = [
  {
    number: "01",
    label: "Describe Your Vision",
    desc: "Type a natural prompt, pick a starter suggestion, or upload UI mockups. No coding jargon required.",
  },
  {
    number: "02",
    label: "AI Neural Synthesis",
    desc: "Nodex structures your components, styles with Tailwind CSS, builds realistic mock datasets, and wires interactive state.",
  },
  {
    number: "03",
    label: "Multi-Device Live Testing",
    desc: "Interact with live buttons, charts, and tabs on Laptop, Tablet, and Mobile preview screens in real time.",
  },
  {
    number: "04",
    label: "Iterate with Chat & Export",
    desc: "Ask the AI agent to tweak designs or add features, then download clean ZIP files ready for deployment.",
  },
];

export const PLACEHOLDERS = [
  "A task manager with priority labels and drag-and-drop…",
  "A crypto portfolio tracker with live charts…",
  "A markdown notes app with live preview…",
  "An expense tracker with monthly breakdowns…",
  "A habit tracker with streaks and heatmaps…",
];