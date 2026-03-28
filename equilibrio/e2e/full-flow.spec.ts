import { test, expect } from '@playwright/test';

// CONFIGURACIÓN: Cambia estos valores por un usuario real de tu base de datos para que el test pase
const TEST_USER = 'admin'; 
const TEST_PASS = 'admin123'; 

test.describe('Flujo Completo de Usuario', () => {

  test('Debe permitir login, navegar por la app y cerrar sesión', async ({ page, isMobile }) => {
    // 1. Redirección inicial
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);

    // 2. Proceso de Login
    await page.fill('input[placeholder*="usuario"]', TEST_USER);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button.btn-primary');

    // 3. Verificar entrada al Shell (Dashboard)
    await expect(page).toHaveURL(/\/visualizar/);
    
    // Verificar nombre de usuario (solo si no es móvil, donde suele ocultarse)
    if (!isMobile) {
      const usernameDisplay = page.locator('.header-right .username');
      await expect(usernameDisplay).toBeVisible();
    }

    // 4. Navegación por pestañas
    // Ir a Registrar Servicio
    await page.click('text=Registrar servicio');
    await expect(page).toHaveURL(/\/registrar/);
    
    // El título real es un div con clase .form-title y el texto es "Nuevo servicio"
    await expect(page.locator('.form-title')).toContainText(/Nuevo servicio/i);

    // Ir a Lista de Usuarios
    await page.click('text=Lista de Usuarios');
    await expect(page).toHaveURL(/\/visualizar-usuarios/);
    
    // 5. Prueba de Persistencia (Refrescar página)
    await page.reload();
    await expect(page).toHaveURL(/\/visualizar-usuarios/); 

    // 6. Cierre de Sesión
    await page.click('button.btn-logout');
    await expect(page).toHaveURL(/\/login/);
  });

});
