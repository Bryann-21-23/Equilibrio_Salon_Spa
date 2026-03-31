import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<Usuario | null>(null);
  isInitialized = signal<boolean>(false);
  private usersSignal = signal<Usuario[]>([]);
  
  allUsers = computed(() => this.usersSignal());

  constructor() {
    this.initSession();
    this.loadUsers();
  }

  private async initSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Sesión recuperada para UID:', session.user.id);
        await this.fetchUserProfile(session.user.id);
      }
    } finally {
      this.isInitialized.set(true);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Cambio de Auth:', event);
      if (session?.user) {
        await this.fetchUserProfile(session.user.id);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private async fetchUserProfile(uid: string) {
    console.log('Buscando perfil en tabla usuarios_sistema para UID:', uid);
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      console.error('Error al buscar perfil:', error.message);
      console.warn('ASEGÚRATE de que el UID de Auth coincida con el campo id de la tabla usuarios_sistema.');
    }

    if (data) {
      console.log('Perfil encontrado:', data);
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

  async login(username: string, password: string): Promise<boolean> {
    const email = `${username.toLowerCase().trim()}@equilibrio.com`;
    console.log('Intentando login para:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error de Supabase Auth:', error.message);
      return false;
    }

    if (data.user) {
      console.log('Login Auth exitoso. UID:', data.user.id);
      await this.fetchUserProfile(data.user.id);
      
      // Si después de buscar el perfil, currentUser sigue null, es que el UID no estaba en la tabla
      if (!this.currentUser()) {
        console.error('Login cancelado: No se encontró el registro en la tabla usuarios_sistema.');
        return false;
      }
      return true;
    }
    
    return false;
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUser.set(null);
  }

  async createUser(username: string, password: string, role: 'admin' | 'user'): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { username, password, role }
    });

    if (error) {
      console.error('Error al crear usuario mediante Edge Function:', error.message);
      return false;
    }

    console.log('Usuario creado exitosamente:', data.message);
    await this.loadUsers();
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
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
