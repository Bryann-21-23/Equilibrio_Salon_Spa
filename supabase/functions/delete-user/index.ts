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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // 1. Validar que el llamador esté autenticado y sea ADMIN
    const { data: { user: requester }, error: authError } = await userClient.auth.getUser();
    if (authError || !requester) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 401 
      });
    }

    const { data: profile, error: profileError } = await adminClient
      .from('usuarios_sistema')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 403 
      });
    }

    // 2. Proceder con el borrado del usuario
    const { userId } = await req.json();
    
    // Evitar auto-borrado (opcional, pero recomendado)
    if (userId === requester.id) {
       throw new Error("No puedes eliminar tu propia cuenta mediante esta función.");
    }

    // Borrado en cascada (usuarios_sistema y auth.users)
    // Primero en la tabla de sistema (si hay RLS que impida borrar auth sin borrar esto)
    const { error: dbError } = await adminClient
      .from('usuarios_sistema')
      .delete()
      .eq('id', userId);

    if (dbError) throw dbError;

    // Borrado en Supabase Auth
    const { error: authDelError } = await adminClient.auth.admin.deleteUser(userId);
    if (authDelError) throw authDelError;

    return new Response(
      JSON.stringify({ message: "Usuario eliminado correctamente" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
