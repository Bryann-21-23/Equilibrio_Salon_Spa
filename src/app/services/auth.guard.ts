import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si ya está inicializado, resolvemos inmediatamente
  if (auth.isInitialized()) {
    if (auth.currentUser()) return true;
    router.navigate(['/login']);
    return false;
  }

  // Si no está inicializado, esperamos a que el signal isInitialized sea true
  return toObservable(auth.isInitialized).pipe(
    filter(initialized => initialized), // Esperamos a que sea true
    take(1), // Solo nos interesa el primer valor true
    map(() => {
      if (auth.currentUser()) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
