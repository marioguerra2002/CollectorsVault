/* eslint-disable */
require('chromedriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Test: Login de Usuario', function() {
  this.timeout(30000);
  let driver;

  beforeEach(async function() {
    const options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--no-sandbox');
    // options.addArguments('--headless=new'); // Descomenta si quieres ocultar el navegador

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async function() {
    if (driver) await driver.quit();
  });

  it('Debería iniciar sesión correctamente', async function() {
    // 1. Limpieza inicial
    await driver.get("http://localhost:3000");
    await driver.manage().deleteAllCookies();
    await driver.get("http://localhost:3000/login");

    // 2. Usamos los selectores CORRECTOS según tu diagnóstico
    // (type='text' y placeholder='Email')
    const emailInput = await driver.wait(until.elementLocated(By.css("input[placeholder='Email']")), 5000);
    const passInput = await driver.findElement(By.css("input[placeholder='Password']"));

    console.log("🔵 Escribiendo credenciales...");
    
    // 3. Escribimos (usando sendKeys normal, ahora debería funcionar)
    await emailInput.clear();
    await emailInput.sendKeys("mariog2@gmail.com");
    
    await passInput.clear();
    // Pulsamos ENTER directamente en la contraseña (más fiable que buscar el botón)
    await passInput.sendKeys("Mario123", Key.RETURN);

    // 4. Esperar redirección O mensaje de error
    console.log("🔵 Esperando redirección...");
    
    try {
        // Esperamos 5 segundos a que cambie la URL
        await driver.wait(until.urlContains("/collection"), 5000);
        console.log("✅ Login exitoso. Redirección completada.");
    } catch (e) {
        // Si falla, miramos si ha salido algún mensaje de error en la pantalla
        console.log("⚠️ No se redirigió. Buscando mensajes de error en pantalla...");
        
        // Intentamos leer todo el texto del body para ver si dice "Error", "Invalid", etc.
        const pageText = await driver.findElement(By.tagName("body")).getText();
        
        if (pageText.includes("Invalid") || pageText.includes("incorrect") || pageText.includes("Error")) {
            throw new Error(`❌ FALLO DE LOGIN: La web muestra un error. Texto encontrado: \n${pageText.substring(0, 200)}...`);
        } else {
            // Si no hay error visible, quizás el backend falló silenciosamente
            console.log("URl actual:", await driver.getCurrentUrl());
            throw new Error("❌ Timeout: Se pulsó login pero la página no hizo nada. ¿El backend está respondiendo?");
        }
    }
  });
});