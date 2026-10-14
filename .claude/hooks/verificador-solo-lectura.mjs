// Hook PreToolUse del agente `verificador` (CD-009, docs/00-metodologia/07-delegacion-a-ia.md §2.1).
// Solo deja pasar órdenes de lectura y de pruebas, lint y tipos. Cualquier otra se rechaza con
// código de salida 2 (Claude Code bloquea la llamada y le muestra el motivo al agente).
import { readFileSync } from "node:fs";

const ALLOWED = [
  /^cd(\s+\S.*)?$/,
  /^(pwd|ls|cat|head|tail|wc|sort|uniq|cut|tr|grep|rg|diff|cmp|stat|file|which|basename|dirname|realpath|date|true)(\s|$)/,
  /^echo(\s|$)/,
  /^sed\s+(?!.*\s-i)(?!-i)/,
  /^awk\s/,
  /^find\s(?!.*\s-(delete|exec|execdir|ok|okdir|fprint\w*)\b)/,
  /^git\s+(status|log|show|diff|rev-parse|ls-files|ls-tree|blame|merge-base|rev-list|cat-file|describe|shortlog|grep|for-each-ref|worktree\s+list|remote\s+-v)(\s|$)/,
  /^git\s+branch(\s+(--show-current|-a|-r|-v|-vv|--all|--list|--contains(\s+\S+)?|--merged(\s+\S+)?|--no-merged(\s+\S+)?))*\s*$/,
  /^(node|python|uv|pnpm|npx|docker|gh)\s+(--version|-v|-V)\s*$/,
  /^uv\s+run\s+(pytest|ruff\s+check|ruff\s+format\s+--check|mypy)(\s|$)/,
  /^uv\s+run\s+python\s+manage\.py\s+(makemigrations\s+.*--check|check|showmigrations)(\s|$)/,
  /^uv\s+sync\s+.*--(locked|frozen)(\s|$)/,
  /^pnpm\s+(install\s+--frozen-lockfile|test|lint|typecheck|build|test:coverage|e2e|exec\s+(playwright\s+test|vitest|tsc\s+--noEmit|playwright\s+install))(\s|$)/,
  /^pnpm\s+run\s+(test|lint|typecheck|build|test:coverage|e2e)(\s|$)/,
  /^make\s+(lint|test|typecheck|e2e)(\s|$)/,
  /^docker\s+compose\s+(ps|logs|up\s+-d\s+db(\s+redis)?|up\s+-d\s+redis(\s+db)?)(\s|$)/,
  /^gh\s+(pr\s+(view|checks|diff|list)|run\s+(view|list))(\s|$)/,
];

function deny(reason) {
  process.stderr.write(`verificador (solo lectura): ${reason}\n`);
  process.exit(2);
}

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  deny("no se pudo leer la llamada; se rechaza por seguridad.");
}

const command = String(input?.tool_input?.command ?? "").trim();
if (!command) deny("orden vacía.");

// Redirecciones a archivo, sustitución de órdenes y here-docs pueden escribir o esconder órdenes.
const withoutHarmless = command.replace(/\d?>&\d|\d?>\s*\/dev\/null/g, "");
if (/[>`]|\$\(|<</.test(withoutHarmless)) {
  deny("no se permiten redirecciones a archivo, sustitución de órdenes ni here-docs.");
}
if (/--output\b|\bsort\b.*\s-o\b/.test(withoutHarmless)) {
  deny("no se permiten opciones que escriben archivos (--output, sort -o).");
}

const segments = withoutHarmless
  .split(/&&|\|\||;|\||\n/)
  .map((s) => s.trim().replace(/^(\w+=\S*\s+)+/, ""))
  .filter(Boolean);

for (const segment of segments) {
  if (!ALLOWED.some((re) => re.test(segment))) {
    deny(`"${segment}" no es una orden de lectura ni de pruebas. Anótalo en el acta como no verificado.`);
  }
}
process.exit(0);
