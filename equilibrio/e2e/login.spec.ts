import { test, expect } from '@playwright/test';

test('Debe cargar la página de login correctamente', async ({ page }) => {
  // Ir a la URL de producción (Vercel)
  await page.goto('https://equilibrio-bryann-21-23s-projects.vercel.app');

  // Verificar que el título principal contenga "Equilibrio"
  await expect(page).toHaveTitle(/Equilibrio/);

  // Verificar que el formulario de login sea visible
  const loginTitle = page.locator('h2.login-title');
  await expect(loginTitle).toBeVisible();
  await expect(loginTitle).toHaveText('Iniciar sesión');

  // Verificar que existan los campos de usuario y contraseña
  await expect(page.locator('input[placeholder*="usuario"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('Debe mostrar error con credenciales incorrectas', async ({ page }) => {
  await page.goto('https://equilibrio-bryann-21-23s-projects.vercel.app');
  
  await page.fill('input[placeholder*="usuario"]', 'usuario_falso');
  await page.fill('input[type="password"]', 'contraseña_falsa');
  await page.click('button.btn-primary');

  const errorMsg = page.locator('.login-error');
  await expect(errorMsg).toBeVisible();
  await expect(errorMsg).toHaveText('Credenciales inválidas.');
});
