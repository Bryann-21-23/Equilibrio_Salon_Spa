import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<Usuario | null>(null);
  private usersSignal = signal<Usuario[]>([]);
  
  allUsers = computed(() => this.usersSignal());

  constructor() {
    this.initSession();
    this.loadUsers();
  }

  // Inicializa la sesión usando el SDK de Supabase Auth
  private async initSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.fetchUserProfile(session.user.id);
    }

    // Escuchar cambios de estado (login/logout)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.fetchUserProfile(session.user.id);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  // Carga los datos adicionales (rol, username) de nuestra tabla pública
  private async fetchUserProfile(uid: string) {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('id', uid) // Usamos el UID de Supabase Auth como ID en la tabla
      .single();

    if (!error && data) {
      this.currentUser.set(data as Usuario);
    }
  }

  async loadUsers() {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .order('username', { ascending: true });

    if (!error && data) {
      this.usersSignal.set(data as Usuario[]);
    }
  }

  // Login real con Supabase Auth
  async login(username: string, password: string): Promise<boolean> {
    const email = `${username.toLowerCase()}@equilibrio.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data.user) {
      await this.fetchUserProfile(data.user.id);
      return true;
    }
    
    console.error('Error de login:', error?.message);
    return false;
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUser.set(null);
  }

  // Creación de usuario (Admin)
  async createUser(username: string, password: string, role: 'admin' | 'user'): Promise<boolean> {
    const email = `${username.toLowerCase()}@equilibrio.com`;

    // 1. Crear en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError || !data.user) {
      console.error('Error Auth SignUp:', authError?.message);
      return false;
    }

    // 2. Crear perfil en tabla pública usuarios_sistema
    const { error: dbError } = await supabase
      .from('usuarios_sistema')
      .insert([{ 
        id: data.user.id, // Vinculamos con el UID
        username, 
        role 
      }]);

    if (dbError) {
      console.error('Error DB Insert:', dbError.message);
      return false;
    }

    await this.loadUsers();
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Nota: El borrado de Auth requiere Admin SDK (Edge Functions), 
    // por ahora solo borraremos el perfil de la tabla pública.
    const { error } = await supabase
      .from('usuarios_sistema')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadUsers();
      return true;
    }
    return false;
  }

  getUsers(): Usuario[] {
    return this.usersSignal();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }
}
