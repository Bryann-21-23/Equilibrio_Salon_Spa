import { test, expect } from '@playwright/test';

test('Debe redirigir a login y cargar la página correctamente', async ({ page }) => {
  // Ir a la raíz y esperar redirección a /login
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);

  // Verificar que el título principal contenga "Equilibrio"
  await expect(page).toHaveTitle(/Equilibrio/);

  // Verificar que el formulario de login sea visible
  const loginTitle = page.locator('h2.login-title');
  await expect(loginTitle).toBeVisible();
  await expect(loginTitle).toHaveText('Iniciar sesión');
});

test('Debe mostrar error con credenciales incorrectas', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[placeholder*="usuario"]', 'usuario_falso');
  await page.fill('input[type="password"]', 'contraseña_falsa');
  await page.click('button.btn-primary');

  const errorMsg = page.locator('.login-error');
  await expect(errorMsg).toBeVisible();
  await expect(errorMsg).toHaveText('Credenciales inválidas.');
});
