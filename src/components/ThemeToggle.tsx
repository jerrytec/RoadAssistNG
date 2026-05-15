import { useEffect, useState } from "react";

const getInitial = () => {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
};

const ThemeToggle = () => {
  const [dark, setDark] = useState<boolean>(getInitial);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("themechange", sync);
    return () => window.removeEventListener("themechange", sync);
  }, []);

  const toggle = () => {
    const next = !dark;
    const root = document.documentElement;
    if (next) root.classList.add("dark"); else root.classList.remove("dark");
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <button
      onClick={toggle}
      className="relative bg-white/[.18] text-primary-foreground text-sm px-2 py-1 rounded-full border border-white/30 cursor-pointer"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
};

export default ThemeToggle;
