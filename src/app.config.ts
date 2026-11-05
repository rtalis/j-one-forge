/**
 * Central app definition. This is the ONLY file you normally need to edit to
 * rebrand a new tool (name, subtitle, ids, defaults). Everything else
 * (sidebar, login, document title, storage keys) reads from here.
 *
 * Runtime overrides come from .env (see .env.example):
 *   VITE_API_URL   -> backend base URL
 *   VITE_APP_ID    -> app id registered on the portal / API
 *   VITE_BASEPATH  -> sub-path where the app is served (e.g. /meu-app). Empty = root.
 */
export const APP_CONFIG = {
  /** Shown in sidebar header, login and <title>. */
  name: "J-One Forge",
  /** Small line under the name in the sidebar. */
  subtitle: "Template de ferramentas",
  /** Login screen big title / tagline. */
  loginTitle: "Ruah Indústria",
  loginTagline: "Nova Ferramenta",
  loginDescription:
    "Plataforma moderna, integrada e confiável para o dia a dia da Ruah.",
  /** localStorage key for the session. Make it unique per tool. */
  storageKey: "ruah_j_one_forge_token",
  /** App id used by the portal J-One / API token exchange (fallback when VITE_APP_ID is unset). */
  defaultAppId: 1,
  /** API fallback when VITE_API_URL is unset. */
  defaultApiUrl: "https://apiruah.roxel.dev",
  /** Where "Voltar ao Portal" goes when NOT inside the portal iframe. */
  portalUrl: "https://j-one.ia.br",
} as const;
