"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "study-capture-theme";
const MODES = ["light", "dark", "system"];

function getStoredMode() {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return MODES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(mode) {
  if (mode === "dark" || mode === "light") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode) {
  const root = document.documentElement;
  const resolvedTheme = resolveTheme(mode);

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolvedTheme;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState("system");

  useEffect(() => {
    const initialMode = getStoredMode();
    setMode(initialMode);
    applyTheme(initialMode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getStoredMode() === "system") applyTheme("system");
    };

    media.addEventListener?.("change", handleSystemChange);
    return () => media.removeEventListener?.("change", handleSystemChange);
  }, []);

  function updateMode(nextMode) {
    setMode(nextMode);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // Theme choice is progressive enhancement; ignore storage failures.
    }

    applyTheme(nextMode);
    window.__studyCaptureApplyTheme?.();
  }

  return (
    <div className="flex items-center">
      <div className="hidden rounded-full border border-white/10 bg-white/[0.045] p-1 text-xs font-semibold text-mist/64 sm:inline-flex">
        {MODES.map((themeMode) => (
          <button
            key={themeMode}
            type="button"
            onClick={() => updateMode(themeMode)}
            className={`rounded-full px-3 py-1.5 capitalize transition ${
              mode === themeMode
                ? "bg-mint text-ink shadow-glow"
                : "hover:bg-white/[0.07] hover:text-white"
            }`}
            aria-pressed={mode === themeMode}
          >
            {themeMode}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="theme-select">
        Theme
      </label>
      <select
        id="theme-select"
        value={mode}
        onChange={(event) => updateMode(event.target.value)}
        className="h-9 rounded-full border border-white/10 bg-white/[0.045] px-3 text-xs font-semibold text-mist outline-none focus:border-mint/60 sm:hidden"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
