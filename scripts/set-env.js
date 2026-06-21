// scripts/set-env.js
// Lê variáveis do .env e gera src/environments/environment.ts e environment.prod.ts
// Roda automaticamente antes de `npm start` e `npm run build` (ver package.json).

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const targetDir = path.join(__dirname, '..', 'src', 'environments');

const turnstileSiteKey = process.env['TURNSTILE_SITE_KEY'] || '';

if (!turnstileSiteKey) {
  console.warn('[set-env] AVISO: TURNSTILE_SITE_KEY não encontrada no .env — o widget não vai funcionar.');
}

function buildEnvFile(production) {
  return `// Arquivo gerado automaticamente por scripts/set-env.js — NÃO editar manualmente.
export const environment = {
  production: ${production},
  turnstileSiteKey: '${turnstileSiteKey}',
};
`;
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'environment.ts'), buildEnvFile(false));
fs.writeFileSync(path.join(targetDir, 'environment.prod.ts'), buildEnvFile(true));
