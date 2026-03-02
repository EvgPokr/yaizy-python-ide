import { test, expect } from '@playwright/test';

test.describe('Python IDE', () => {
  test('should load and display the IDE interface', async ({ page }) => {
    await page.goto('/python-ide');

    // Wait for Pyodide to load (может занять время)
    await page.waitForSelector('.ide-layout', { timeout: 30000 });

    // Проверяем основные элементы
    await expect(page.locator('.ide-header')).toBeVisible();
    await expect(page.locator('.file-panel')).toBeVisible();
    await expect(page.locator('.editor')).toBeVisible();
    await expect(page.locator('.console')).toBeVisible();
  });

  test('happy path: write code, run, see output', async ({ page }) => {
    await page.goto('/python-ide');

    // Ждем загрузки IDE
    await page.waitForSelector('.ide-layout', { timeout: 30000 });

    // Находим Monaco Editor
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Очищаем редактор и пишем код
    await page.keyboard.press('Control+A');
    await page.keyboard.type('print("Hello from Playwright!")');

    // Нажимаем кнопку Run
    const runButton = page.locator('.run-button');
    await runButton.click();

    // Ждем появления вывода в консоли
    await page.waitForTimeout(2000); // Даем время на выполнение

    // Проверяем вывод
    const consoleOutput = page.locator('.console-logs');
    await expect(consoleOutput).toContainText('Hello from Playwright!');
  });

  test('should display error when code has syntax error', async ({ page }) => {
    await page.goto('/python-ide');

    // Ждем загрузки
    await page.waitForSelector('.ide-layout', { timeout: 30000 });

    // Пишем код с ошибкой
    await page.keyboard.press('Control+A');
    await page.keyboard.type('if True\n    print("missing colon")');

    // Запускаем
    const runButton = page.locator('.run-button');
    await runButton.click();

    await page.waitForTimeout(2000);

    // Переключаемся на таб ошибок
    const errorsTab = page.locator('.console-tab').filter({ hasText: 'Ошибки' });
    await errorsTab.click();

    // Проверяем, что ошибка отображается
    const errorPanel = page.locator('.error-panel');
    await expect(errorPanel).toContainText('Синтаксическая ошибка');
  });

  test('should create and switch between files', async ({ page }) => {
    await page.goto('/python-ide');
    await page.waitForSelector('.ide-layout', { timeout: 30000 });

    // Создаем новый файл
    const createButton = page.locator('.file-create-button');
    await createButton.click();

    // Вводим имя файла
    await page.keyboard.type('test');
    await page.keyboard.press('Enter');

    // Проверяем, что файл создан
    await expect(page.locator('.file-item').filter({ hasText: 'test.py' })).toBeVisible();

    // Переключаемся обратно на main.py
    await page.locator('.file-item').filter({ hasText: 'main.py' }).click();

    // Проверяем, что активный файл изменился
    await expect(page.locator('.file-item.active')).toContainText('main.py');
  });

  test('should export project', async ({ page }) => {
    await page.goto('/python-ide');
    await page.waitForSelector('.ide-layout', { timeout: 30000 });

    // Настраиваем обработчик загрузки
    const downloadPromise = page.waitForEvent('download');

    // Нажимаем Export
    const exportButton = page.locator('.header-button').filter({ hasText: 'Экспорт' });
    await exportButton.click();

    // Ждем загрузки
    const download = await downloadPromise;

    // Проверяем имя файла
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should clear console', async ({ page }) => {
    await page.goto('/python-ide');
    await page.waitForSelector('.ide-layout', { timeout: 30000 });

    // Запускаем код
    const runButton = page.locator('.run-button');
    await runButton.click();
    await page.waitForTimeout(2000);

    // Проверяем, что в консоли есть вывод
    const consoleLogs = page.locator('.console-logs');
    await expect(consoleLogs.locator('.console-log')).not.toHaveCount(0);

    // Очищаем консоль
    const clearButton = page.locator('.console-clear-button');
    await clearButton.click();

    // Проверяем, что консоль пуста
    await expect(page.locator('.console-empty')).toBeVisible();
  });
});
