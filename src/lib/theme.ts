export type Theme = "dark" | "light" | "system";

export function getStoredTheme(): Theme {
  const theme = localStorage.getItem("theme");
  return theme === "dark" || theme === "light" ? theme : "system";
}

export function setStoredTheme(theme: Theme) {
  if (theme === "system") localStorage.removeItem("theme");
  else localStorage.setItem("theme", theme);
}

export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Inline script for the document head, prevents a flash of the wrong theme */
export const blockingThemeScript = `
if (localStorage.theme === "dark" || (localStorage.theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches))
  document.documentElement.classList.add("dark");
else document.documentElement.classList.remove("dark");
`;
