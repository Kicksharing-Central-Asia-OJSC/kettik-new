import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// ✅ Подключаем только 2 файла стилей
import "./styles/main.css";
import "./pages/dashboard/dashboard.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);