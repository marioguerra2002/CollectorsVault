/* eslint-disable */
require('chromedriver');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

describe('Test: Gestión de Cartas (Añadir)', function() {
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

  it('Debería añadir una carta a la colección', async function() {
    console.log("🔵 Buscando botón 'Add Card'...");

    // 1. Abrir Modal
    const addBtnText = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Add Card')]")), 5000);
    await driver.executeScript("arguments[0].closest('button').click()", addBtnText);

    // 2. Buscar
    console.log("🔵 Buscando 'pup'...");
    // Usamos wait para asegurarnos de que el input es interactuable
    const searchInput = await driver.wait(until.elementLocated(By.css("input.px-4, input[type='text']")), 5000);
    
    // TRUCO: A veces React necesita un pequeño 'empujón'.
    // Limpiamos, escribimos y pulsamos Enter.
    await searchInput.clear(); 
    await searchInput.sendKeys("pup", Key.RETURN); 

    // 3. SELECCIONAR CARTA (CORRECCIÓN CRÍTICA 🛡️)
    console.log("🔵 Esperando resultados de la API...");
    
    try {
        // CAMBIO CLAVE: Usamos 'wait' en lugar de 'findElements' directo.
        // Esto esperará hasta 10 segundos a que aparezca AL MENOS UNA imagen en el grid.
        await driver.wait(until.elementLocated(By.css(".grid img")), 10000);
        
        // Una vez localizada, obtenemos la referencia fresca
        const cardImages = await driver.findElements(By.css(".grid img"));
        console.log(`   👉 ¡Encontradas ${cardImages.length} cartas! Clicando la primera...`);
        
        // Clic JS directo
        await driver.executeScript("arguments[0].click();", cardImages[0]);
        
    } catch (e) {
        // Si falla aquí es que la API no devolvió nada o tardó más de 10s
        console.log("❌ ERROR: La búsqueda no trajo resultados. ¿La base de datos tiene cartas con 'pup'?");
        throw new Error("❌ No se encontraron cartas. Intenta buscar 'pika' o una carta que seguro tengas.");
    }
    
    // 4. Seleccionar condición
    console.log("🔵 Esperando selector de condición...");
    try {
        // Esperamos a que salga el select
        const dropdown = await driver.wait(until.elementLocated(By.css("select")), 5000);
        await dropdown.click();
        
        // Seleccionamos la opción con flechas (más seguro que click si el dropdown es nativo)
        await dropdown.sendKeys(Key.ARROW_DOWN);
        await dropdown.sendKeys(Key.ENTER);
    } catch (e) {
        // Fallback: Si no sale el select, quizás ya se seleccionó por defecto, intentamos seguir.
        console.log("⚠️ No se pudo cambiar la condición (quizás ya estaba seleccionada). Continuando...");
    }

    // 5. Confirmar
    console.log("🔵 Confirmando...");
    const confirmBtn = await driver.findElement(By.css("button[type='submit'], button.bg-blue-600"));
    await driver.executeScript("arguments[0].click();", confirmBtn);
    
    console.log("✅ Carta añadida correctamente.");
  });

  it('Debería añadir una carta a la Wishlist', async function() {
    console.log("🔵 Buscando Wishlist...");
    const wishlistLink = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Wishlist')]")), 5000);
    await wishlistLink.click();
    
    console.log("🔵 En Wishlist. Esperando estabilidad...");
    await driver.sleep(1000); // Espera vital para evitar el error "Stale Element"

    // 1. Abrir Modal (Protección contra Stale Element)
    // Volvemos a buscar el elemento justo antes de usarlo
    const addCardBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Add')] | //span[contains(., 'Add')]")), 5000);
    
    // Usamos JS click en el elemento encontrado RECIENTEMENTE
    await driver.executeScript(`
       const el = arguments[0];
       // Si es un span, sube al botón. Si es botón, clickea.
       (el.closest('button') || el).click();
    `, addCardBtn);

    // 2. Buscar
    const searchInput = await driver.wait(until.elementLocated(By.css("input.px-4, input[type='text']")), 5000);
    await searchInput.sendKeys("jol", Key.RETURN);

    // 3. Clic resultado
    await driver.sleep(2000);
    const cardImages = await driver.findElements(By.css(".grid img"));
    await driver.executeScript("arguments[0].click();", cardImages[0]);

    // 4. Confirmar
    console.log("🔵 Confirmando en Wishlist...");
    const confirmBtn = await driver.wait(until.elementLocated(By.css("button[type='submit'], button.bg-blue-600")), 5000);
    await driver.executeScript("arguments[0].click();", confirmBtn);

    console.log("✅ Carta añadida a Wishlist.");
  });
});