const fs = require('fs');
// Intentamos cargar dotenv, pero si falla (como en Vercel), seguimos adelante
try {
  require('dotenv').config({ path: './.env' });
} catch (e) {
  console.log('No se encontró archivo .env, usando variables de entorno del sistema.');
}

const targetPath = './src/environments/environment.ts';

// Usamos las variables del sistema (Vercel las inyecta aquí)
const supabaseUrl = process.env.SUPABASE_URL || 'SUPABASE_URL_PLACEHOLDER';
const supabaseKey = process.env.SUPABASE_KEY || 'SUPABASE_KEY_PLACEHOLDER';

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}'
};
`;

try {
  fs.writeFileSync(targetPath, envConfigFile);
  console.log(`Entorno generado exitosamente en: ${targetPath}`);
} catch (err) {
  console.error('Error al generar environment.ts:', err);
  process.exit(1); // Forzamos el error para que el build se detenga si falla esto
}
