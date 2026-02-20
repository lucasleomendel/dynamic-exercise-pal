import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Inicializar tema antes do render para evitar flash
const savedTheme = localStorage.getItem("fitforge_theme") || "dark";
document.documentElement.classList.add(savedTheme);
document.documentElement.classList.remove(savedTheme === "dark" ? "light" : "dark");

createRoot(document.getElementById("root")!).render(<App />);
