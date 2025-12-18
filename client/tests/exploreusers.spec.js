/* eslint-disable */
require('chromedriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Test: Explorar Usuarios', function() {
  this.timeout(40000);
  let driver;

  beforeEach(async function() {
    const options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--no-sandbox');
    // options.addArguments('--headless=new');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    
    // --- LOGIN ---
    console.log("🔵 Iniciando sesión...");
    await driver.get("http://localhost:3000");
    await driver.manage().deleteAllCookies();
    await driver.get("http://localhost:3000/login");

    const emailInput = await driver.wait(until.elementLocated(By.css("input[placeholder='Email']")), 10000);
    const passInput = await driver.findElement(By.css("input[placeholder='Password']"));

    await emailInput.sendKeys("mariog2@gmail.com");
    await passInput.sendKeys("Mario123", Key.RETURN);
    
    await driver.wait(until.urlContains("/collection"), 15000);
    console.log("✅ Login completado.");
  });

  afterEach(async function() {
    if (driver) await driver.quit();
  });

  it('Debería buscar un usuario y ver su perfil', async function() {
    console.log("🔵 Buscando enlace Explore...");
    const exploreLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(., 'Explore') or contains(., 'Explorar')]")), 5000);
    await exploreLink.click();
    
    console.log("🔵 Escribiendo búsqueda...");
    // 1. Encontramos el input
    const searchInputSelector = By.css("input[placeholder*='Search'], input[placeholder*='Buscar']");
    let searchInput = await driver.wait(until.elementLocated(searchInputSelector), 5000);
    
    // 2. CORRECCIÓN ANTI-STALE: Usamos JS para escribir de golpe sin eventos intermedios
    await driver.executeScript("arguments[0].value = 'mario';", searchInput);
    await driver.executeScript("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", searchInput);
    
    // 3. IMPORTANTE: Volvemos a buscar el input "fresco" antes de dar Enter
    // Esto arregla el StaleElementReferenceError si React re-renderizó tras el evento input
    await driver.sleep(500); 
    searchInput = await driver.findElement(searchInputSelector);
    await searchInput.sendKeys(Key.RETURN);

    console.log("🔵 Esperando resultados...");
    
    try {
        // Esperamos a que aparezca CUALQUIER resultado (grid item, link, o borde)
        const firstResult = await driver.wait(until.elementLocated(By.css(".grid > div, a[href*='/user/'], .truncate, .border-gray-700")), 8000);
        
        console.log("   👉 Resultado encontrado. Haciendo clic...");
        // Click JS forzado
        await driver.executeScript("arguments[0].click();", firstResult);

    } catch (e) {
        console.error("❌ ERROR: No se encontraron usuarios.");
        const body = await driver.findElement(By.tagName("body")).getText();
        console.log("--- TEXTO EN PANTALLA ---");
        console.log(body.substring(0, 300) + "...");
        throw e;
    }

    // Verificar perfil
    console.log("🔵 Verificando perfil...");
    try {
        // Buscamos indicadores de perfil (h1, texto grande, botón trade)
        await driver.wait(until.elementLocated(By.css("h1, .text-2xl, button.bg-green-600")), 8000);
        console.log("✅ Perfil de usuario cargado correctamente.");
    } catch(e) {
        throw new Error("❌ Se hizo clic pero no parece un perfil de usuario.");
    }
  });
});