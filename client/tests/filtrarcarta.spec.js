/* eslint-disable */
require('chromedriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');
const chrome = require('selenium-webdriver/chrome');

describe('Test: Búsqueda y Filtros', function() {
  this.timeout(40000);
  let driver;

  beforeEach(async function() {
    const options = new chrome.Options();
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--no-sandbox');
    // options.addArguments('--headless=new');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  });

  afterEach(async function() {
    if (driver) await driver.quit();
  });

  // TEST 1: BÚSQUEDA (YA FUNCIONA ✅)
  it('Debería buscar "pik" en el buscador global y abrir un resultado', async function() {
    console.log("🔵 Navegando a owners...");
    await driver.get("http://localhost:3000/owners");
    
    console.log("🔵 Escribiendo 'pik'...");
    const searchInput = await driver.wait(until.elementLocated(By.css("input[placeholder*='Search'], input[placeholder*='Buscar']")), 5000);
    
    await searchInput.clear();
    await searchInput.sendKeys("pik", Key.RETURN);

    console.log("🔵 Esperando resultados...");
    try {
        const cardResult = await driver.wait(until.elementLocated(By.css(".grid > div, .object-contain")), 8000);
        await driver.executeScript("arguments[0].click();", cardResult);
        await driver.wait(until.elementLocated(By.css(".text-3xl, h1, .text-2xl")), 5000);
        console.log("✅ Búsqueda y click funcionando.");
    } catch (e) {
        console.error("❌ ERROR: No cargaron las cartas.");
        throw e;
    }
  });

  // TEST 2: FILTRO (CORREGIDO PARA SELECCIONAR 'POKEMON') 🛠️
  it('Debería filtrar cartas en la colección y encontrar a "Bulbasaur"', async function() {
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
    console.log("✅ Login correcto.");
    // -------------

    console.log("🔵 Abriendo filtros...");
    const filterBtn = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Filters') or contains(text(), 'Filtros')]")), 5000);
    await driver.executeScript("arguments[0].click();", filterBtn);
    await driver.sleep(1000); 

    // Abrir acordeón "Card Type"
    console.log("🔵 Abriendo acordeón 'Card Type'...");
    try {
        const cardTypeLabel = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Card Type')]")), 3000);
        // Clic en el padre para asegurar desplegado
        await driver.executeScript(`
            const el = arguments[0];
            const parent = el.closest('div[class*="cursor-pointer"]') || el.parentElement || el;
            parent.click();
        `, cardTypeLabel);
        await driver.sleep(1000);
    } catch (e) {
        console.log("⚠️ Quizás 'Card Type' ya estaba abierto.");
    }

    // SELECCIONAR "POKEMON" (Esto es lo que vimos en tu log que SÍ existe)
    console.log("🔵 Seleccionando filtro 'Pokemon'...");
    try {
        // Buscamos el texto exacto 'Pokemon'
        const pokemonOption = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Pokemon')]")), 3000);
        
        await driver.executeScript("arguments[0].scrollIntoView(true);", pokemonOption);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", pokemonOption);
        
        console.log("✅ Opción 'Pokemon' clicada.");

    } catch (e) {
        console.error("❌ ERROR: No pude clicar 'Pokemon'.");
        throw e;
    }

    // Click Apply (si existe)
    console.log("🔵 Aplicando...");
    try {
        const applyBtn = await driver.findElement(By.xpath("//button[contains(., 'Apply') or contains(., 'Aplicar')]"));
        await driver.executeScript("arguments[0].click();", applyBtn);
    } catch(e) {
        // Si no hay botón apply, cerramos el filtro pulsando fuera o Escape
        console.log("ℹ️ Auto-aplicando (o cerrando modal)...");
        const body = await driver.findElement(By.css("body"));
        await body.sendKeys(Key.ESCAPE);
    }
    
    // Verificar resultado
    console.log("🔵 Esperando a Bulbasaur...");
    await driver.sleep(2000);

    const bodyText = await driver.findElement(By.tagName("body")).getText();
    if (bodyText.includes("Bulbasaur")) {
        console.log("✅ ¡Bulbasaur encontrado!");
    } else {
        throw new Error("❌ Falló el filtrado. Bulbasaur no aparece en la lista.");
    }
  });
});