import React from "react";
import { createRoot } from "react-dom/client";
import { installStorage } from "./storage.js";
import PasscodeGate from "./PasscodeGate.jsx";
import TeamLineupApp from "./TeamLineupApp.jsx";

// window.storage has to exist before the app's first effect runs.
installStorage();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PasscodeGate>
      <TeamLineupApp />
    </PasscodeGate>
  </React.StrictMode>
);
