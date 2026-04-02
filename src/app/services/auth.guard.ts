import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

/**
 * Guarda general que solo verifica si el usuario está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isInitialized()) {
    if (auth.currentUser()) return true;
    router.navigate(['/login']);
    return false;
  }

  return toObservable(auth.isInitialized).pipe(
    filter(initialized => initialized),
    take(1),
    map(() => {
      if (auth.currentUser()) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};

/**
 * Guarda de administración que verifica si el usuario es administrador
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const checkAdmin = () => {
    if (auth.currentUser()?.role === 'admin') {
      return true;
    }
    // Si no es admin, lo mandamos al dashboard principal (visualizar)
    router.navigate(['/visualizar']);
    return false;
  };

  if (auth.isInitialized()) {
    return checkAdmin();
  }

  return toObservable(auth.isInitialized).pipe(
    filter(initialized => initialized),
    take(1),
    map(() => checkAdmin())
  );
};
