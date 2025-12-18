// /* eslint-disable */
// require('chromedriver');
// const { Builder, By, Key, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');

// describe('Test: Flujo de Intercambio (Inteligente)', function() {
//   this.timeout(90000); // Más tiempo por si hay que navegar atrás/adelante
//   let driver;

//   beforeEach(async function() {
//     const options = new chrome.Options();
//     options.addArguments('--window-size=1920,1080');
//     options.addArguments('--no-sandbox');
//     driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    
//     // --- LOGIN ---
//     console.log("🔵 Iniciando sesión...");
//     await driver.get("http://localhost:3000/login");
//     const emailInput = await driver.wait(until.elementLocated(By.css("input[placeholder='Email']")), 10000);
//     const passInput = await driver.findElement(By.css("input[placeholder='Password']"));
//     await emailInput.sendKeys("mariog2@gmail.com");
//     await passInput.sendKeys("Mario123", Key.RETURN);
//     await driver.wait(until.urlContains("/collection"), 15000);
//     console.log("✅ Login completado.");
//   });

//   afterEach(async function() {
//     if (driver) await driver.quit();
//   });

//   it('Debería explorar usuarios, iniciar intercambio y enviar propuesta', async function() {
    
//     // 0. CHECK MIS CARTAS
//     console.log("🔵 Verificando mis cartas...");
//     try {
//         await driver.wait(until.elementLocated(By.css(".grid")), 3000);
//         const myCards = await driver.findElements(By.css(".grid img"));
//         if (myCards.length === 0) {
//             console.log("⚠️ Añadiendo carta de emergencia...");
//             const addBtnText = await driver.findElement(By.xpath("//*[contains(text(), 'Add Card')]"));
//             await driver.executeScript("arguments[0].closest('button').click()", addBtnText);
//             const searchInput = await driver.wait(until.elementLocated(By.css("input.px-4, input[type='text']")), 5000);
//             await searchInput.sendKeys("mew", Key.RETURN); 
//             await driver.sleep(2000);
//             const cardResult = await driver.wait(until.elementLocated(By.css(".grid img")), 5000);
//             await driver.executeScript("arguments[0].click();", cardResult);
//             try {
//                 const dropdown = await driver.wait(until.elementLocated(By.css("select")), 2000);
//                 await dropdown.click();
//                 await dropdown.findElement(By.css("option:nth-child(2)")).click();
//             } catch(e) {}
//             const confirmBtn = await driver.findElement(By.css("button[type='submit'], button.bg-blue-600"));
//             await driver.executeScript("arguments[0].click();", confirmBtn);
//             await driver.sleep(2000);
//         }
//     } catch(e) {}

//     // 1. IR A EXPLORAR
//     console.log("🔵 Buscando enlace Explore...");
//     const exploreLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(., 'Explore') or contains(., 'Explorar')]")), 5000);
//     await exploreLink.click();
    
//     // 2. BUSQUEDA AMPLIA
//     console.log("🔵 Buscando usuarios (letra 'a')...");
//     const searchSelector = By.css("input[placeholder*='Search'], input[placeholder*='Buscar']");
//     let searchInput = await driver.wait(until.elementLocated(searchSelector), 5000);
    
//     await driver.executeScript("arguments[0].value = 'a';", searchInput); 
//     await driver.executeScript("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", searchInput);
//     await driver.sleep(1000); 
//     searchInput = await driver.findElement(searchSelector);
//     await searchInput.sendKeys(Key.RETURN);

//     // 3. SELECCIÓN INTELIGENTE (LOOP DE NAVEGACIÓN) 🔄
//     console.log("🔵 Buscando un rival válido...");
//     await driver.sleep(2000);

//     let foundRival = false;
    
//     // Obtenemos cuántos resultados hay
//     const results = await driver.findElements(By.css(".grid > div, div[class*='border']"));
//     const count = results.length;
//     console.log(`   👉 Hay ${count} resultados.`);

//     if (count === 0) throw new Error("No hay usuarios. Ejecuta setup_rival.spec.js");

//     // Recorremos los resultados por ÍNDICE
//     for (let i = 0; i < count; i++) {
//         console.log(`   🔎 Probando usuario #${i+1}...`);
        
//         // Volvemos a buscar la lista (anti-stale)
//         const freshResults = await driver.findElements(By.css(".grid > div, div[class*='border']"));
        
//         // Click en el usuario i
//         await driver.executeScript("arguments[0].click();", freshResults[i]);
//         await driver.sleep(1000); // Esperar navegación

//         // VERIFICAR URL
//         const url = await driver.getCurrentUrl();
//         console.log(`      📍 URL: ${url}`);

//         if (url.includes("/profile") && !url.includes("/user/")) {
//             console.log("      ❌ Soy yo mismo. Volviendo atrás...");
//             await driver.navigate().back();
//             await driver.sleep(1000); // Esperar a que cargue la lista de nuevo
//         } else {
//             console.log("      ✅ ¡Es otro usuario! Buscando botón Trade...");
//             foundRival = true;
//             break; // Salimos del bucle, ya estamos donde queremos
//         }
//     }

//     if (!foundRival) throw new Error("Solo te encontré a ti en la lista. Necesitas crear otro usuario con setup_rival.spec.js");

//     // 4. INICIAR INTERCAMBIO
//     try {
//         const tradeBtn = await driver.wait(until.elementLocated(By.css("button.bg-green-600, button:has(svg), button[title='Trade']")), 5000);
//         await driver.executeScript("arguments[0].click();", tradeBtn);
//     } catch (e) {
//         throw new Error("❌ Estoy en el perfil de otro, pero NO veo botón Trade. (¿Tiene cartas ese usuario?)");
//     }

//     // 5. SELECCIONAR CARTAS
//     console.log("🔵 Seleccionando cartas...");

//     // Oponente
//     console.log("   👉 Carta del oponente...");
//     try {
//         const oppCards = await driver.wait(until.elementLocated(By.css(".grid img, .grid > div[class*='border']")), 8000);
//         await driver.executeScript("arguments[0].click();", oppCards);
//     } catch(e) { throw new Error("El rival no tiene cartas disponibles."); }
    
//     // Next
//     const nextBtn1 = await driver.wait(until.elementLocated(By.css("button.bg-blue-600, button[type='submit']")), 5000);
//     await driver.executeScript("arguments[0].click();", nextBtn1);

//     // Mi carta
//     console.log("   👉 Mi carta...");
//     await driver.sleep(1000);
//     try {
//         const myCards = await driver.wait(until.elementLocated(By.css(".grid img, .grid > div[class*='border']")), 5000);
//         await driver.executeScript("arguments[0].click();", myCards);
//     } catch(e) { throw new Error("Error seleccionando mi carta."); }

//     // Next
//     const nextBtn2 = await driver.wait(until.elementLocated(By.css("button.bg-blue-600, button[type='submit']")), 5000);
//     await driver.executeScript("arguments[0].click();", nextBtn2);

//     // 6. ENVIAR
//     console.log("🔵 Enviando propuesta...");
//     const msgInput = await driver.wait(until.elementLocated(By.css("textarea")), 5000);
//     await msgInput.sendKeys("Test Selenium Final");

//     const sendBtn = await driver.findElement(By.xpath("//button[contains(., 'Send') or contains(., 'Enviar') or contains(., 'Propose')]"));
//     await driver.executeScript("arguments[0].click();", sendBtn);

//     await driver.sleep(2000);
//     console.log("✅ ¡PROPUESTA ENVIADA CON ÉXITO!");
//   });
// });

// /// TODO: not worked yet