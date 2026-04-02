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
        await this.fetchUserProfile(session.user.id);
      }
    } finally {
      this.isInitialized.set(true);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.fetchUserProfile(session.user.id);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private async fetchUserProfile(uid: string) {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('id', uid)
      .single();

    if (data) {
      this.currentUser.set(data as Usuario);
    }
  }

  async loadUsers() {
    // Si no somos admin, no deberíamos ni intentar cargar todos los usuarios
    // Pero si el RLS está bien puesto, la base de datos devolverá vacío o error.
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return false;

    if (data.user) {
      await this.fetchUserProfile(data.user.id);
      if (!this.currentUser()) return false;
      return true;
    }
    return false;
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUser.set(null);
  }

  async createUser(username: string, password: string, role: 'admin' | 'user'): Promise<boolean> {
    const { error } = await supabase.functions.invoke('create-user', {
      body: { username, password, role }
    });

    if (error) return false;

    await this.loadUsers();
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    // LLAMADA SEGURA MEDIANTE EDGE FUNCTION
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId: id }
    });

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
