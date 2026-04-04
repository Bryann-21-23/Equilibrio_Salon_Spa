const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  /supabase_key\s*[:=]\s*['"][a-zA-Z0-9._-]{50,}['"]/gi,
  /supabase_url\s*[:=]\s*['"]https?:\/\/[a-z0-9-]+\.supabase\.co['"]/gi,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWTs
];

const IGNORED_FILES = [
  'node_modules',
  '.git',
  '.aider',
  'package-lock.json',
  '.env.example',
  'scripts/check-secrets.js',
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  SECRET_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      console.error(`❌ SECRETO ENCONTRADO en ${filePath}:`);
      matches.forEach((match) => console.error(`   > ${match.substring(0, 10)}...[SECRET REDACTED]`));
      process.exit(1);
    }
  });
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (IGNORED_FILES.some((ignored) => filePath.includes(ignored))) {
      return;
    }

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      scanFile(filePath);
    }
  });
}

console.log('🛡️  Escaneando secretos en el código...');
try {
  walkDir('.');
  console.log('✅ No se encontraron secretos quemados.');
} catch (err) {
  console.error('❌ Error durante el escaneo:', err.message);
  process.exit(1);
}
