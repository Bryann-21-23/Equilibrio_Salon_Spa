const fs = require('fs');
// Intentamos cargar dotenv para local, pero en Vercel usamos process.env directamente
try {
  if (fs.existsSync('./.env')) {
    require('dotenv').config({ path: './.env' });
    console.log('✅ Cargando variables desde .env local');
  }
} catch (e) {
  console.log('ℹ️ Usando variables de entorno del sistema.');
}

const targetPath = './src/environments/environment.ts';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// VALIDACIÓN CRÍTICA: Si no hay variables, avisamos y fallamos
if (!supabaseUrl || !supabaseKey || supabaseUrl === 'SUPABASE_URL_PLACEHOLDER') {
  console.error('❌ ERROR CRÍTICO: Las variables SUPABASE_URL o SUPABASE_KEY no están definidas.');
  console.error('Asegúrate de configurarlas en el panel de Vercel (Settings -> Environment Variables).');
  process.exit(1); 
}

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}'
};
`;

try {
  fs.writeFileSync(targetPath, envConfigFile);
  console.log(`✅ Entorno generado exitosamente con URL: ${supabaseUrl.substring(0, 20)}...`);
} catch (err) {
  console.error('❌ Error al escribir environment.ts:', err);
  process.exit(1);
}
