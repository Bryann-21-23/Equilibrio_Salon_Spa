export interface Usuario {
  id: string; // Cambiado a string para el UUID de Supabase
  username: string;
  password?: string; // Opcional, ya que no se recupera del servidor
  role: 'admin' | 'user';
}

export interface Servicio {
  id: number;
  clienteId?: number; // Relación con el ID del Cliente
  nombre: string;
  tipo: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  registradoPor: string;
}

export interface Cliente {
  id: number;
  codigo: string; // 4 dígitos + 1 letra
  nombre: string;
  apellido?: string;
  cumpleanos?: string;
  correo?: string;
  celular?: string;
}

export type ChartPeriod = 'dia' | 'semana' | 'mes' | 'año';
