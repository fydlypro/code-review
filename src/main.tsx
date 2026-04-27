import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { initOneSignal } from "./lib/onesignal";

// Initialisation du SDK pour les notifications push
initOneSignal();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
