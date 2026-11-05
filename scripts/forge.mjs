#!/usr/bin/env node
/**
 * J-One Forge — creates a new tool from this template.
 *
 * Interactive (asks everything, with suggestions):
 *   npm run create
 *
 * Direct (only name and app id; the rest is derived):
 *   npm run create -- "Controle de Estoque" 21
 *   npm run create -- "Controle de Estoque" 21 ../estoque   (optional folder)
 *
 * Options:
 *   --slug <slug>   identifier (default: derived from the name)
 *   --dir <folder>  target folder (default: ../<slug>; can also be the 3rd argument)
 *   --base <path>   production sub-path (default: /<slug>; use "/" for root)
 *   --install       runs `npm install` at the end
 *   -y, --yes       accepts the suggestions without asking
 *   -h, --help      shows this help
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, exit, argv } from "node:process";

const TEMPLATE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDE = new Set(["node_modules", "dist", ".git", ".tanstack", ".output", ".env", "src/routeTree.gen.ts", "scripts"]);

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function fail(msg) {
  console.error(c.red(`✖ ${msg}`));
  exit(1);
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBase(raw) {
  const v = (raw ?? "").trim();
  if (!v || v === "/") return "";
  return `/${v.replace(/^\/+|\/+$/g, "")}`;
}

function parseArgs(args) {
  const opts = { positional: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-y" || a === "--yes") opts.yes = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "--install") opts.install = true;
    else if (a === "--slug" || a === "--dir" || a === "--base") {
      const v = args[++i];
      if (v === undefined) fail(`${a} needs a value`);
      opts[a.slice(2)] = v;
    } else if (a.startsWith("-")) fail(`unknown option: ${a}`);
    else opts.positional.push(a);
  }
  return opts;
}

function printHelp() {
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const doc = src.match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? "";
  console.log(doc.replace(/^ \* ?/gm, "").trim());
}

async function main() {
  const opts = parseArgs(argv.slice(2));
  if (opts.help) return printHelp();

  const interactive = !opts.yes && stdin.isTTY;
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null;
  const ask = async (label, suggestion, validate) => {
    for (;;) {
      const hint = suggestion ? c.dim(` (${suggestion})`) : "";
      const answer = (await rl.question(`${c.green("?")} ${label}${hint}: `)).trim() || suggestion || "";
      const err = validate?.(answer);
      if (!err) return answer;
      console.log(c.red(`  ${err}`));
    }
  };

  const confirm = async (label) =>
    !/^n/i.test((await rl.question(`${c.green("?")} ${label} ${c.dim("(Y/n)")}: `)).trim());

  const requireName = (v) => (v ? null : "Enter the tool name.");
  const requireId = (v) => (/^\d+$/.test(v) && Number(v) > 0 ? null : "The app id must be a positive integer.");
  const requireSlug = (v) => (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? null : "Use only lowercase letters, numbers and hyphens.");

  console.log(`\n${c.bold("⚒  J-One Forge")} ${c.dim("— new J-One tool")}\n`);

  let [name, appId, dirArg] = opts.positional;
  const dirOpt = opts.dir ?? dirArg;
  if (!name) {
    if (!rl) fail('Missing name: npm run create -- "Controle de Estoque" 21');
    name = await ask("Tool name", "", requireName);
  }
  if (!appId) {
    if (!rl) fail("Missing the J-One Portal app id.");
    appId = await ask("J-One Portal app id", "", requireId);
  } else if (requireId(appId)) fail(requireId(appId));

  let slug = opts.slug ?? slugify(name);
  let base = opts.base !== undefined ? normalizeBase(opts.base) : `/${slug}`;

  if (rl && opts.slug === undefined) slug = await ask("Slug", slug, requireSlug);
  else if (requireSlug(slug)) fail(`invalid slug "${slug}". Use --slug.`);
  if (rl && opts.base === undefined) base = normalizeBase(await ask('Production sub-path ("/" = root)', `/${slug}`));
  // Folder is optional: defaults to ../<slug> (decided after the slug is final).
  const dir = dirOpt ?? join("..", slug);

  const target = resolve(dir);
  if (existsSync(target) && readdirSync(target).length > 0) fail(`Folder ${target} already exists and is not empty.`);

  let install = !!opts.install;
  if (rl && !opts.install) install = await confirm("Install dependencies now?");

  console.log(`
  ${c.dim("Name")}        ${name}
  ${c.dim("App id")}      ${appId}
  ${c.dim("Slug")}        ${slug}
  ${c.dim("Sub-path")}    ${base || "/ (root)"}
  ${c.dim("Folder")}      ${target}
`);
  if (rl && !(await confirm("Create project?"))) {
    rl.close();
    return console.log("Cancelled.");
  }
  rl?.close();

  scaffold({ name, appId: Number(appId), slug, base, target });

  if (install) {
    console.log(c.dim("\nInstalling dependencies…"));
    const r = spawnSync("npm", ["install"], { cwd: target, stdio: "inherit" });
    if (r.status !== 0) console.log(c.red("npm install failed. Run it manually."));
  }

  const relPath = relative(process.cwd(), target);
  const rel = !relPath ? "." : relPath.startsWith(join("..", "..")) ? target : relPath;
  console.log(`
${c.green("✔")} ${c.bold(name)} created at ${target}

  cd ${rel}${install ? "" : "\n  npm install"}
  npm run dev

${c.dim("Next: menu in src/components/app-sidebar.tsx, pages in src/routes/.")}
`);
}

function scaffold({ name, appId, slug, base, target }) {
  mkdirSync(target, { recursive: true });
  cpSync(TEMPLATE, target, {
    recursive: true,
    filter: (src) => !EXCLUDE.has(relative(TEMPLATE, src).split("\\").join("/")),
  });

  const edit = (file, fn) => {
    const p = join(target, file);
    writeFileSync(p, fn(readFileSync(p, "utf8")));
  };

  edit("package.json", (s) => {
    const pkg = JSON.parse(s);
    pkg.name = slug;
    delete pkg.scripts.create;
    return `${JSON.stringify(pkg, null, 2)}\n`;
  });

  edit("src/app.config.ts", (s) =>
    s
      .replace(/(\n\s*name: )"[^"]*"/, `$1${JSON.stringify(name)}`)
      .replace(/(loginTagline: )"[^"]*"/, `$1${JSON.stringify(name)}`)
      .replace(/(storageKey: )"[^"]*"/, `$1"ruah_${slug.replace(/-/g, "_")}_token"`)
      .replace(/(defaultAppId: )\d+/, `$1${appId}`),
  );

  edit(".env.example", (s) =>
    s.replace(/^VITE_APP_ID=.*$/m, `VITE_APP_ID=${appId}`).replace(/^VITE_BASEPATH=.*$/m, `VITE_BASEPATH=${base}`),
  );
  cpSync(join(target, ".env.example"), join(target, ".env"));

  writeFileSync(
    join(target, "README.md"),
    `# ${name}

Ferramenta J-One criada com o [J-One Forge](https://github.com/rtalis/j-one-forge).

| | |
| :-- | :-- |
| App id | \`${appId}\` |
| Subcaminho | \`${base || "/"}\` |

\`\`\`bash
npm install
npm run dev     # desenvolvimento
npm run build   # gera dist/client
\`\`\`

Marca e ids ficam em \`src/app.config.ts\`; URL da API e subcaminho, no \`.env\`.
`,
  );

  spawnSync("git", ["init", "-q"], { cwd: target });
  // the generator scripts do not belong in the new project
  rmSync(join(target, "scripts"), { recursive: true, force: true });
}

main().catch((err) => fail(err?.message ?? String(err)));
