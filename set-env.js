const fs = require('fs');
require('dotenv').config({ path: './.env' }); // El .env está en el mismo nivel

const targetPath = './src/environments/environment.ts';
const envConfigFile = `export const environment = {
  production: false,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}'
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`Entorno generado en: ${targetPath}`);
  }
});
