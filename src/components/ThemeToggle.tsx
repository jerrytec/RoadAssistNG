import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

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

  const Icon = dark ? Sun : Moon;
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[.18] text-primary-foreground border border-white/30 cursor-pointer transition-all duration-200 hover:bg-white/[.28] hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/60"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
    </button>
  );
};

export default ThemeToggle;
