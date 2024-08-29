// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация глобальной переменной для монет
let globalCoins = 0;

function loadGameState() {
    const savedGameState = localStorage.getItem('gameState');
    const removeTrader = localStorage.getItem('removeTrader');

    if (savedGameState) {
        const gameState = JSON.parse(savedGameState);
        playerCol = gameState.playerCol;
        playerRow = gameState.playerRow;
        fogState = gameState.fogState;
        world = gameState.world;
        globalCoins = gameState.globalCoins;
        earnedCoins = gameState.earnedCoins;
        offsetX = gameState.offsetX;
        offsetY = gameState.offsetY;
        steps = gameState.steps || 100;
        trader = gameState.trader;
        isTraderVisible = gameState.isTraderVisible;

        // Если торговец был удален, убедимся, что он не отображается
        if (removeTrader === 'true') {
            isTraderVisible = false;
            trader = null;
        }

        document.getElementById('step-counter').textContent = `${steps}/100`;
        drawVisibleArea();
    } else {
        initializeTrader();
    }
}

// Функция для сохранения текущего состояния игры в localStorage
function saveGameState() {
    const gameState = {
        globalCoins,
        // здесь можно добавить другие данные, которые нужно сохранить
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Функция для обновления отображения количества монет на странице
function updateTokenCount() {
    const tokenCountElement = document.getElementById('token-count');
    if (tokenCountElement) {
        tokenCountElement.textContent = globalCoins.toLocaleString();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tokenCountElement = document.getElementById('token-count');
    const addCoinsButton = document.getElementById('add-coins-button');

    // Загружаем начальное состояние игры
    loadGameState(); 
    updateTokenCount(); // Обновляем отображение баланса

    // Универсальная функция для добавления монет
    function addCoins(amount) {
        globalCoins += amount; // Добавляем указанное количество монет
        updateTokenCount(); // Обновляем отображение с форматированием
        saveGameState(); // Сохраняем обновленное состояние игры
    }

    // Обработчик нажатия на кнопку для добавления 10 000 монет
    if (addCoinsButton) {
        addCoinsButton.addEventListener('click', () => {
            addCoins(10000);
        });
    }

    loadGameState(); // Загружаем состояние игры при загрузке страницы
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const visibleCols = 5;
const visibleRows = 5;
const mapCols = 50;
const mapRows = 50;
const grassTiles = 10;

const tileSize = canvas.width / visibleCols;
const mapWidth = mapCols * tileSize;
const mapHeight = mapRows * tileSize;

let playerCol = Math.floor(mapCols / 2);
let playerRow = Math.floor(mapRows / 2);

let offsetX = 0;
let offsetY = 0;

const visibilityRadius = 1;
let isAnimating = false;
let steps = 100;
let portal = null;
let stepTimer = 5;
let stepInterval = null;

let fogState = Array.from({ length: mapRows }, () => Array(mapCols).fill(1));

const grassImage = loadImage('./image/grace.webp', 'Grass image');
const fogImage = loadImage('./image/fogg.webp', 'Fog image');
const playerImage = loadImage('./image/xyeta.webp', 'Player image');
const portalImage = loadImage('./image/portal.webp', 'Portal image');
const traderImage = loadImage('./image/trader.webp', 'Trader image');

const fogCanvas = document.createElement('canvas');
fogCanvas.width = mapWidth;
fogCanvas.height = mapHeight;
const fogCtx = fogCanvas.getContext('2d');
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем все необходимые изображения перед отображением карты
    preloadImages([grassImage, fogImage, playerImage, portalImage, traderImage], () => {
        const removeTrader = localStorage.getItem('removeTrader');
        
        if (removeTrader === 'true') {
            localStorage.removeItem('removeTrader'); // Убираем флаг из localStorage
            isTraderVisible = false;
            trader = null;  // Удаляем торговца
        }

        loadGameState();  // Загружаем состояние игры
        initInitialVisibility(); // Инициализируем начальную видимость тумана войны
        placePortalNearEdge(); // Устанавливаем портал

        if (!world) {
            world = generateNewWorld();  // Генерация нового мира, если он не загружен
        }

        drawVisibleArea();  // Обновляем отображение мира
        restoreSteps();  // Восстанавливаем шаги
    });
});

// Функция для предварительной загрузки изображений
function preloadImages(images, callback) {
    let loadedCount = 0;
    images.forEach(image => {
        if (image.complete) {
            incrementCount();
        } else {
            image.onload = incrementCount;
            image.onerror = incrementCount;
        }
    });

    function incrementCount() {
        loadedCount++;
        if (loadedCount === images.length) {
            callback(); // Все изображения загружены, вызываем колбэк
        }
    }
}

// Функция для загрузки изображения с обработкой ошибок
function loadImage(src, name) {
    const img = new Image();
    img.src = src;
    img.onload = () => console.log(`${name} loaded successfully`);
    img.onerror = () => {
        console.error(`Failed to load ${name}`);
    };
    return img;
}

// Функция для показа оверлея
function showOverlay() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
}

// Функция для скрытия оверлея
function hideOverlay() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
}

function hideTrader() {
    const tradeMenu = document.getElementById('trade-menu');
    
    if (tradeMenu) {
        tradeMenu.style.transition = 'opacity 0.2s ease';
        tradeMenu.style.opacity = '0';

        setTimeout(() => {
            tradeMenu.remove();
            hideOverlay();

            isTraderVisible = false;
            trader = null;

            // Сохраняем состояние, что торговец был удален
            localStorage.setItem('removeTrader', 'true');
            saveGameState(); // Сохраняем текущее состояние игры

            drawVisibleArea();
        }, 400); 
    }
}



// Функция для отображения меню торговца
function showTradeMenu() {
    // Убедимся, что предыдущий элемент меню удален, если он есть
    const existingMenu = document.getElementById('trade-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Создаем новое меню
    const tradeMenu = document.createElement('div');
    tradeMenu.id = 'trade-menu';
    tradeMenu.innerHTML = `
        <img src="./image/naperstki.webp" class="modal-image" id="choose-naperstki" alt="Наперстки">
        <img src="./image/stavki.webp" class="modal-image" id="choose-stavki" alt="Ставки">
        <button id="cancel-trade" class="small-button cancel-button">Отказаться</button>
    `;
    document.body.appendChild(tradeMenu);

    // Привязываем обработчики событий после добавления элементов в DOM
    document.getElementById('choose-naperstki').onclick = () => {
        console.log('Наперстки выбраны');
        window.location.href = '/game_attemp0_2-main123/html/stavki.html';
    };

    document.getElementById('choose-stavki').onclick = () => {
        console.log('Ставки выбраны');
        window.location.href = '/game_attemp0_2-main123/html/naperstki.html';
    };

    document.getElementById('cancel-trade').onclick = () => {
        console.log('Отказаться нажато');
        hideTrader();
    };

    showOverlay();  // Показываем оверлей, когда открывается окно торговца
}

// Функция для появления торговца рядом с игроком только один раз в начале игры
function initializeTrader() {
    if (!trader) {
        const potentialPositions = [
            { x: playerCol + 1, y: playerRow }, // Справа
            { x: playerCol - 1, y: playerRow }, // Слева
            { x: playerCol, y: playerRow + 1 }, // Внизу
            { x: playerCol, y: playerRow - 1 }  // Сверху
        ];

        const validPositions = potentialPositions.filter(pos => 
            pos.x >= 0 && pos.x < mapCols && pos.y >= 0 && pos.y < mapRows
        );

        const position = validPositions[Math.floor(Math.random() * validPositions.length)];
        trader = { x: position.x, y: position.y };
        isTraderVisible = true;
    }
    drawVisibleArea();
}

// Функция пересчета смещений для центрации игрока на экране
function recalculateOffsets() {
    offsetX = Math.min(0, Math.max(-(mapCols * tileSize - canvas.width), -playerCol * tileSize + (canvas.width / 2) - (tileSize / 2)));
    offsetY = Math.min(0, Math.max(-(mapRows * tileSize - canvas.height), -playerRow * tileSize + (canvas.height / 2) - (tileSize / 2)));
}

// Генерация мира с монетами
function generateNewWorld() {
    const newWorld = Array.from({ length: mapRows }, () => Array(mapCols).fill(0));
    for (let i = 0; i < 50; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * mapCols);
            y = Math.floor(Math.random() * mapRows);
        } while (newWorld[y][x] !== 0);  // Избегаем повторной установки монет
        newWorld[y][x] = 'coin';
    }
    return newWorld;
}

function placePortalNearEdge() {
    const positions = [];
    for (let i = 2; i < mapCols - 2; i++) {
        positions.push({ x: i, y: 2 }, { x: i, y: mapRows - 3 });
    }
    for (let i = 2; i < mapRows - 2; i++) {
        positions.push({ x: 2, y: i }, { x: mapCols - 3, y: i });
    }

    do {
        portal = positions[Math.floor(Math.random() * positions.length)];
    } while (world[portal.y][portal.x] === 'coin');
}

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tileOffsetX = offsetX % (tileSize * mapCols / grassTiles) - tileSize;
    const tileOffsetY = offsetY % (tileSize * mapRows / grassTiles) - tileSize;

    for (let x = tileOffsetX; x < canvas.width; x += tileSize * mapCols / grassTiles) {
        for (let y = tileOffsetY; y < canvas.height; y += tileSize * mapRows / grassTiles) {
            ctx.drawImage(grassImage, x, y, tileSize * mapCols / grassTiles, tileSize * mapRows / grassTiles);
        }
    }

    world.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile === 'coin') {
                ctx.fillStyle = 'gold';
                ctx.beginPath();
                ctx.arc(offsetX + x * tileSize + tileSize / 2, offsetY + y * tileSize + tileSize / 2, 10, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    });

    if (portal) {
        ctx.drawImage(portalImage, offsetX + portal.x * tileSize, offsetY + portal.y * tileSize, tileSize, tileSize);
    }

    ctx.drawImage(playerImage, offsetX + playerCol * tileSize + tileSize / 4, offsetY + playerRow * tileSize + tileSize / 4, tileSize / 2, tileSize / 2);
}

// Рисуем торговца на карте
function drawTrader() {
    if (trader && isTraderVisible && traderImage.complete && traderImage.naturalHeight !== 0) {
        ctx.drawImage(traderImage, offsetX + trader.x * tileSize, offsetY + trader.y * tileSize, tileSize, tileSize);
    }
}

// Изменяем функцию drawVisibleArea, чтобы учитывать торговца
function drawVisibleArea() {
    recalculateOffsets();
    drawMap(); // Отрисовываем карту и все объекты на ней, включая торговца
    drawTrader(); // Отрисовываем торговца на карте перед туманом
    drawFog(); // Отрисовываем туман поверх карты и торговца
}

function drawFog() {
    fogCtx.clearRect(0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(grassImage, 0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(fogImage, 0, 0, mapWidth, mapHeight);

    fogState.forEach((row, y) => {
        row.forEach((state, x) => {
            if (state > 1) {
                fogCtx.save();
                fogCtx.globalCompositeOperation = 'destination-out';
                fogCtx.globalAlpha = state === 2 ? 1 : 0.3;
                fogCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                fogCtx.restore();
            }
        });
    });

    ctx.drawImage(fogCanvas, offsetX, offsetY, mapWidth, mapHeight);
}

function updateFogState() {
    fogState.forEach((row, y) => {
        row.forEach((state, x) => {
            if (Math.abs(x - playerCol) <= visibilityRadius && Math.abs(y - playerRow) <= visibilityRadius) {
                fogState[y][x] = 2;
            } else if (state === 2) {
                fogState[y][x] = checkForAdjacentFog(x, y) ? 3 : 2;
            }
        });
    });

    fogState.forEach((row, y) => {
        row.forEach((state, x) => {
            if (state === 3 && !checkForAdjacentFog(x, y)) {
                fogState[y][x] = 2;
            }
        });
    });
}

function checkForAdjacentFog(x, y) {
    return [-1, 0, 1].some(dx => [-1, 0, 1].some(dy => fogState[y + dy]?.[x + dx] === 1));
}

function animateFogClear() {
    updateFogState();
    drawVisibleArea();
}

function initInitialVisibility() {
    for (let y = Math.max(0, playerRow - visibilityRadius); y <= Math.min(mapRows - 1, playerRow + visibilityRadius); y++) {
        for (let x = Math.max(0, playerCol - visibilityRadius); x <= Math.min(mapCols - 1, playerCol + visibilityRadius); x++) {
            fogState[y][x] = 2;
        }
    }
}

function updateStepCount() {
    steps = Math.max(0, steps - 1);
    document.getElementById('step-counter').textContent = `${steps}/100`;
    checkStepTimerVisibility();
    saveGameState();
}

function restoreSteps() {
    const stepTimerElement = document.getElementById('step-timer');

    stepInterval = setInterval(() => {
        if (steps < 100) {
            stepTimerElement.style.display = 'inline';
            stepTimer -= 1;
            if (stepTimer <= 0) {
                steps = Math.min(100, steps + 1);
                stepTimer = 5;
                document.getElementById('step-counter').textContent = `${steps}/100`;
                checkStepTimerVisibility();
                saveGameState();
            }
            stepTimerElement.textContent = `00:0${stepTimer}`;
        } else {
            stepTimerElement.style.display = 'none';
            clearInterval(stepInterval);
            stepInterval = null;
        }
    }, 1000);
}

function checkStepTimerVisibility() {
    const stepTimerElement = document.getElementById('step-timer');
    stepTimerElement.style.display = steps === 100 ? 'none' : 'inline';
}

function movePlayer(dx, dy) {
    if (isAnimating || steps <= 0) return;

    const newCol = playerCol + dx;
    const newRow = playerRow + dy;

    // Проверка на торговца
    if (trader && newCol === trader.x && newRow === trader.y) {
        // Если игрок пытается перейти на клетку с торговцем, остановим движение
        showTradeMenu(); // Открываем меню торговца при попытке хода на его клетку
        return;
    }

    if (newCol >= 0 && newCol < mapCols && newRow >= 0 && newRow < mapRows) {
        isAnimating = true;
        animatePlayerMove(newCol, newRow);
        updateStepCount();
        saveGameState();

        if (steps < 100 && !stepInterval) {
            restoreSteps();
        }
    }
}

function animatePlayerMove(newCol, newRow) {
    const startCol = playerCol;
    const startRow = playerRow;
    const duration = 700;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        playerCol = startCol + progress * (newCol - startCol);
        playerRow = startRow + progress * (newRow - startRow);

        drawVisibleArea();

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            playerCol = newCol;
            playerRow = newRow;
            recalculateOffsets();
            animateFogClear();
            saveGameState();

            if (checkAndCollectCoin(newCol, newRow)) {
                savePreMiniGameState();
                launchRandomMiniGame();
            }

            if (portal && newCol === portal.x && newRow === portal.y) {
                showConfirmationBox();
            }

            isAnimating = false;
            updateControlButtons();
        }
    }

    requestAnimationFrame(step);
}

function checkAndCollectCoin(x, y) {
    if (world[y][x] === 'coin') {
        world[y][x] = 0;
        earnedCoins += 1;
        saveGameState();
        return true;
    }
    return false;
}

function saveGameState() {
    const gameState = {
        playerCol,
        playerRow,
        globalCoins,
        earnedCoins,
        fogState,
        world,
        offsetX,
        offsetY,
        steps,
        trader,  // Сохраняем позицию торговца
        isTraderVisible
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedGameState = localStorage.getItem('gameState');
    const removeTrader = localStorage.getItem('removeTrader');

    if (savedGameState) {
        const gameState = JSON.parse(savedGameState);
        playerCol = gameState.playerCol;
        playerRow = gameState.playerRow;
        fogState = gameState.fogState;
        world = gameState.world;
        globalCoins = gameState.globalCoins;
        earnedCoins = gameState.earnedCoins;
        offsetX = gameState.offsetX;
        offsetY = gameState.offsetY;
        steps = gameState.steps || 100;

        // Проверяем, был ли торговец удален
        if (removeTrader === 'true') {
            isTraderVisible = false;
            trader = null;
        } else {
            trader = gameState.trader; // Загружаем торговца
            isTraderVisible = gameState.isTraderVisible;
        }

        document.getElementById('step-counter').textContent = `${steps}/100`;
        drawVisibleArea();
    } else {
        initializeTrader(); // Инициализируем торговца, если игра запускается впервые
    }
}

function savePreMiniGameState() {
    saveGameState();
}

function launchRandomMiniGame() {
    savePreMiniGameState();

    const miniGames = [
        'html/game1.html',
        'html/game2.html',
        'html/game4.html',
        'html/game5.html'
    ];
    window.location.href = miniGames[Math.floor(Math.random() * miniGames.length)];
}

document.addEventListener('DOMContentLoaded', () => {
    const removeTrader = localStorage.getItem('removeTrader');
    
    if (removeTrader === 'true') {
        localStorage.removeItem('removeTrader'); // Убираем флаг из localStorage
        isTraderVisible = false;
        trader = null;  // Удаляем торговца
    }

    loadGameState();  // Загружаем состояние игры
    placePortalNearEdge(); // Устанавливаем портал

    if (!world) {
        world = generateNewWorld();  // Генерация нового мира, если он не загружен
    }

    drawVisibleArea();  // Обновляем отображение мира
    restoreSteps();  // Восстанавливаем шаги
});

canvas.addEventListener('click', (event) => {
    if (isAnimating || steps <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const playerX = playerCol * tileSize + offsetX;
    const playerY = playerRow * tileSize + offsetY;

    let dx = 0;
    let dy = 0;

    // Определяем направление движения
    if (clickX > playerX + tileSize) {
        dx = 1; // Движение вправо
    } else if (clickX < playerX) {
        dx = -1; // Движение влево
    } else if (clickY > playerY + tileSize) {
        dy = 1; // Движение вниз
    } else if (clickY < playerY) {
        dy = -1; // Движение вверх
    }

    if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy); // Двигаем игрока
    }

    // Проверка на клик по торговцу
    const traderX = trader?.x * tileSize + offsetX;
    const traderY = trader?.y * tileSize + offsetY;

    // Проверка на соседство с торговцем
    const isNextToTrader = Math.abs(playerCol - trader.x) <= 1 && Math.abs(playerRow - trader.y) <= 1;

    if (isTraderVisible && isNextToTrader && clickX >= traderX && clickX <= traderX + tileSize &&
        clickY >= traderY && clickY <= traderY + tileSize) {
        showTradeMenu(); // Открываем меню только если игрок на соседней клетке
    }
});


// Управление вкладками и взаимодействием
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('booster-button').addEventListener('click', () => {
        saveGameState();  // Сохраняем игру при переходе на другую страницу
        window.location.href = 'html/booster.html';
    });

    document.getElementById('game-tab').addEventListener('click', showGameTab);
    document.getElementById('shop-tab').addEventListener('click', loadShopContent);
    document.getElementById('friends-tab').addEventListener('click', loadFriendsContent);
    document.getElementById('tasks-tab').addEventListener('click', loadTasksContent);

    showGameTab();
});

function showGameTab() {
    hideAllTabs();
    document.getElementById('game-world').style.display = 'grid';
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('new-game').style.display = 'block';
    document.getElementById('score').style.display = 'flex';
}

// main.js

function loadShopContent() {
    hideAllTabs();
    loadHTMLContent('html/tab-shop.html', 'shop-content', () => {
        loadCSS('css/tab-shop.css');
        loadScript('js/tab-shop.js', () => {
            document.getElementById('shop-content').style.display = 'block';
            initializeShopEventHandlers(); // Повторная инициализация обработчиков
        });
    });
}



function loadFriendsContent() {
    hideAllTabs();
    loadHTMLContent('html/tab-friend.html', 'friends-content', () => {
        loadCSS('css/tab-friend.css');
        loadScript('js/tab-friend.js', () => {
            document.getElementById('friends-content').style.display = 'block';
        });
    });
}

function loadTasksContent() {
    hideAllTabs();
    loadHTMLContent('html/tab-tasks.html', 'tasks-content', () => {
        loadCSS('css/tab-tasks.css');
        loadScript('js/tab-tasks.js', () => {
            document.getElementById('tasks-content').style.display = 'block';
            initializeTaskEventHandlers(); // Повторная инициализация обработчиков
        });
    });
}


function loadHTMLContent(url, containerId, callback) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById(containerId).innerHTML = html;
            if (callback) callback();
        })
        .catch(error => console.error('Ошибка загрузки HTML:', error));
}

function loadCSS(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}

function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.body.appendChild(script);
}

document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('gameState');
    resetGame();  // Сбрасываем игру при нажатии на "New Game"
});

function resetGame() {
    localStorage.removeItem('gameState');
    localStorage.removeItem('removeTrader'); // Убираем флаг удаления торговца

    playerCol = Math.floor(mapCols / 2);
    playerRow = Math.floor(mapRows / 2);
    fogState = Array(mapRows).fill().map(() => Array(mapCols).fill(1));
    world = generateNewWorld();

    offsetX = -playerCol * tileSize + canvas.width / 2 - tileSize / 2;
    offsetY = -playerRow * tileSize + canvas.height / 2 - tileSize / 2;

    placePortalNearEdge();
    initInitialVisibility();
    initializeTrader();  // Позиция торговца фиксирована на начальном этапе
    drawVisibleArea();
    globalCoins = 0;
    steps = 100;
    document.getElementById('step-counter').textContent = `${steps}/100`;
    updateControlButtons();
    saveGameState();
}


function showConfirmationBox() {
    const confirmationBox = document.getElementById('confirmation-box');
    confirmationBox.style.display = 'block';

    document.getElementById('confirm-yes').addEventListener('click', () => {
        confirmationBox.style.display = 'none';
        startTransition();
    });

    document.getElementById('confirm-no').addEventListener('click', () => {
        confirmationBox.style.display = 'none';
    });
}

function startTransition() {
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'block';
    blackout.style.opacity = '0';
    setTimeout(() => {
        blackout.style.transition = 'opacity 1.5s ease';
        blackout.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        document.getElementById('new-game').click();
        setTimeout(() => {
            blackout.style.transition = 'opacity 1s ease';
            blackout.style.opacity = '0';
            setTimeout(() => {
                blackout.style.display = 'none';
            }, 1000);
        }, 1000);
    }, 1500);
}

function hideAllTabs() {
    document.getElementById('game-world').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('new-game').style.display = 'none';
    document.getElementById('score').style.display = 'none';
    document.getElementById('shop-content').style.display = 'none';
    document.getElementById('friends-content').style.display = 'none';
    document.getElementById('tasks-content').style.display = 'none';
}

function updateControlButtons() {
    // В этой функции можно реализовать логику для обновления состояния кнопок управления
}
