import rawVersions from "./versions.json";

export interface VersionEntry {
  version: string;
  date?: string | undefined;
  title?: string | undefined;
  notes: string[];
}

function parseSemver(v: string): [number, number, number] {
  const cleaned = v.replace(/^v/, "").trim();
  const parts = cleaned.split(".").map((n) => parseInt(n, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function compareSemverDesc(a: VersionEntry, b: VersionEntry): number {
  const [a1, a2, a3] = parseSemver(a.version);
  const [b1, b2, b3] = parseSemver(b.version);
  if (a1 !== b1) return b1 - a1;
  if (a2 !== b2) return b2 - a2;
  return b3 - a3;
}

const parsedVersions: VersionEntry[] = (rawVersions as VersionEntry[]).map((v) => ({
  ...v,
  version: v.version.startsWith("v") ? v.version : `v${v.version}`,
  notes: Array.isArray(v.notes) ? v.notes : [],
}));

// Garante ordenação decrescente: a versão mais recente sempre no índice 0
export const APP_VERSIONS: VersionEntry[] = [...parsedVersions].sort(compareSemverDesc);

// A versão atual do aplicativo é sempre a última versão (mais recente) de versions.json
export const CURRENT_VERSION: VersionEntry = APP_VERSIONS[0] ?? {
  version: "v1.0.0",
  notes: ["Lançamento inicial."],
};

export const APP_VERSION = CURRENT_VERSION.version;

export const LAST_SEEN_VERSION_KEY = "finfisc_last_seen_version";
