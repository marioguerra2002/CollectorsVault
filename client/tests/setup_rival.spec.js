/* eslint-disable */
require('chromedriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Setup: Crear Usuario Rival (Definitivo)', function() {
  this.timeout(60000);
  let driver;

  // Generamos usuario único para evitar errores de "Ya existe"
  const timestamp = Date.now(); 
  const RIVAL_USER = `Rival${timestamp}`;
  const RIVAL_EMAIL = `rival${timestamp}@test.com`;
  const RIVAL_PASS = "Rival1234!"; 

  beforeEach(async function() {
    const options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--no-sandbox');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async function() {
    if (driver) await driver.quit();
  });

  it('Debería registrar un usuario NUEVO y añadirle una carta', async function() {
    console.log(`🔵 Generando identidad: ${RIVAL_USER}`);
    await driver.get("http://localhost:3000/register");

    // 1. RELLENAR FORMULARIO
    console.log("🔵 Rellenando formulario...");
    
    // Esperamos a que el formulario exista para asegurar que cargó
    await driver.wait(until.elementLocated(By.tagName("form")), 5000);

    const userField = await driver.findElement(By.css("input[name='username'], input[placeholder='Username']"));
    const emailField = await driver.findElement(By.css("input[name='email'], input[placeholder='Email']"));
    const passField = await driver.findElement(By.css("input[name='password'], input[placeholder='Password']"));

    await userField.sendKeys(RIVAL_USER);
    await emailField.sendKeys(RIVAL_EMAIL);
    await passField.sendKeys(RIVAL_PASS);

    // 2. CLIC EN EL BOTÓN CORRECTO (CORRECCIÓN CRÍTICA) 🛡️
    console.log("🔵 Buscando botón Submit...");
    
    // Buscamos ESPECÍFICAMENTE el botón que envía el formulario (type='submit')
    // Esto evita clicar en el menú de navegación por error
    const registerBtn = await driver.wait(until.elementLocated(By.css("form button[type='submit'], button[type='submit']")), 5000);
    
    // Scroll para asegurarnos de que no lo tapa el footer
    await driver.executeScript("arguments[0].scrollIntoView(true);", registerBtn);
    await driver.sleep(500); // Pequeña pausa visual

    console.log("🔵 Clicando botón de registro...");
    await driver.executeScript("arguments[0].click();", registerBtn);

    // 3. VERIFICAR ACCESO
    console.log("🔵 Esperando redirección...");
    try {
        await driver.wait(until.urlContains("/collection"), 10000);
        console.log("✅ REGISTRO COMPLETADO.");
    } catch (e) {
        console.error("❌ TIMEOUT. Intentando Login de emergencia...");
        // Si falla la redirección automática, probamos login manual
        await driver.get("http://localhost:3000/login");
        const emailInput = await driver.wait(until.elementLocated(By.css("input[placeholder='Email']")), 5000);
        const passInput = await driver.findElement(By.css("input[placeholder='Password']"));
        await emailInput.sendKeys(RIVAL_EMAIL);
        await passInput.sendKeys(RIVAL_PASS, Key.RETURN);
        await driver.wait(until.urlContains("/collection"), 10000);
        console.log("✅ Login de emergencia exitoso.");
    }

    // 4. AÑADIR CARTA
    console.log("🔵 Añadiendo carta...");
    const addBtnText = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Add Card')]")), 10000);
    await driver.executeScript("arguments[0].closest('button').click()", addBtnText);

    const searchInput = await driver.wait(until.elementLocated(By.css("input.px-4, input[type='text']")), 5000);
    await searchInput.sendKeys("charizard", Key.RETURN); 

    await driver.sleep(3000); 
    const cardResult = await driver.wait(until.elementLocated(By.css(".grid img, .object-contain")), 10000);
    await driver.executeScript("arguments[0].click();", cardResult);

    try {
        const dropdown = await driver.wait(until.elementLocated(By.css("select")), 3000);
        await dropdown.click();
        await dropdown.findElement(By.css("option:nth-child(2)")).click();
    } catch (e) {}

    const confirmBtn = await driver.findElement(By.css("button[type='submit'], button.bg-blue-600"));
    await driver.executeScript("arguments[0].click();", confirmBtn);

    await driver.sleep(2000);
    console.log(`✅ RIVAL LISTO: ${RIVAL_USER}`);
  });
});