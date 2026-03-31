import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdpxxusucdrqgriawprr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcHh4dXN1Y2RycWdyaWF3cHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjE4NjYsImV4cCI6MjA5MDI5Nzg2Nn0.0gydm_RsLavdBaboGFwLy6L3BY974qFDJ2hn5s66E_Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log('Users in database:', JSON.stringify(data, null, 2));
  }
}

checkUsers();
