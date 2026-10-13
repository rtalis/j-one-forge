/** Normalized sub-path (e.g. "/meu-app") or undefined when the app is served at root. */
export function getBasepath(): string | undefined {
  const raw = (typeof import.meta !== "undefined" && import.meta.env?.["VITE_BASEPATH"]) || "";
  const trimmed = String(raw).replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : undefined;
}
