import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { username, password, role } = await req.json()
    const email = `${username.toLowerCase().trim()}@equilibrio.com`

    // 1. Crear el usuario en auth.users (usando service_role para evitar confirmación de email si se desea)
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role }
    })

    if (authError) throw authError

    // 2. Insertar en la tabla usuarios_sistema
    const { error: dbError } = await supabaseClient
      .from('usuarios_sistema')
      .insert([{ 
        id: authData.user.id, 
        username, 
        role 
      }])

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ message: "Usuario creado con éxito", userId: authData.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
