import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rxzsthvhhxjyjwrfxkcd.supabase.co';
const supabaseKey = 'sb_publishable_gErqS9inHB34eADXHBq58A_YNmYuTZa';

export const supabase = createClient(supabaseUrl, supabaseKey);
