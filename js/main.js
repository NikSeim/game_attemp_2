// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

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

const visibilityRadius = 1; // Радиус видимости
let isAnimating = false;
let steps = 100;
let portal = null;
let stepTimer = 5;
let stepInterval = null;

let fogState = Array.from({ length: mapRows }, () => Array(mapCols).fill(1));

function recalculateOffsets() {
    const maxOffsetX = -(mapCols * tileSize - canvas.width);
    const maxOffsetY = -(mapRows * tileSize - canvas.height);

    offsetX = Math.min(0, Math.max(maxOffsetX, -playerCol * tileSize + (canvas.width / 2) - (tileSize / 2)));
    offsetY = Math.min(0, Math.max(maxOffsetY, -playerRow * tileSize + (canvas.height / 2) - (tileSize / 2)));
}

const grassImage = new Image();
grassImage.src = 'https://github.com/NikSeim/images/raw/main/grace.webp';

const fogImage = new Image();
fogImage.src = 'https://github.com/NikSeim/images/raw/main/fogg.webp';

const playerImage = new Image();
playerImage.src = 'https://github.com/NikSeim/images/raw/main/xyeta.webp';

const portalImage = new Image();
portalImage.src = 'https://github.com/NikSeim/images/raw/main/portal.webp';

const fogCanvas = document.createElement('canvas');
fogCanvas.width = mapWidth;
fogCanvas.height = mapHeight;
const fogCtx = fogCanvas.getContext('2d');

let globalCoins = 0, earnedCoins = 0;






// Обработка клика по кнопке "Booster"
document.getElementById('booster-button').addEventListener('click', () => {
    saveGameState();  // Сохраняем игру при переходе на другую страницу
    window.location.href = 'html/booster.html';
});

fogImage.onload = () => {
    fogCtx.drawImage(grassImage, 0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(fogImage, 0, 0, mapWidth, mapHeight);
    recalculateOffsets();
    drawVisibleArea(); 
};

let world = generateNewWorld();

function generateNewWorld() {
    let newWorld = Array.from({ length: mapRows }, () => Array(mapCols).fill(0));
    for (let i = 0; i < 50; i++) {
        let x = Math.floor(Math.random() * mapCols), y = Math.floor(Math.random() * mapRows);
        newWorld[y][x] = 'coin';
    }
    return newWorld;
}

function placePortalNearEdge() {
    const positions = [];

    for (let col = 2; col < mapCols - 2; col++) {
        positions.push({ x: col, y: 2 });
        positions.push({ x: col, y: mapRows - 3 });
    }

    for (let row = 2; row < mapRows - 2; row++) {
        positions.push({ x: 2, y: row });
        positions.push({ x: mapCols - 3, y: row });
    }

    let portalPosition;
    do {
        portalPosition = positions[Math.floor(Math.random() * positions.length)];
    } while (world[portalPosition.y][portalPosition.x] === 'coin');

    portal = portalPosition;
}

function drawMap(offsetX, offsetY) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = offsetX % (tileSize * mapCols / grassTiles) - tileSize; x < canvas.width; x += tileSize * mapCols / grassTiles) {
        for (let y = offsetY % (tileSize * mapRows / grassTiles) - tileSize; y < canvas.height; y += tileSize * mapRows / grassTiles) {
            ctx.drawImage(grassImage, x, y, tileSize * mapCols / grassTiles, tileSize * mapRows / grassTiles);
        }
    }

    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            if (world[y][x] === 'coin') {
                ctx.fillStyle = 'gold';
                ctx.beginPath();
                ctx.arc(offsetX + x * tileSize + tileSize / 2, offsetY + y * tileSize + tileSize / 2, 10, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    if (portal) {
        ctx.drawImage(
            portalImage,
            offsetX + portal.x * tileSize,
            offsetY + portal.y * tileSize,
            tileSize,
            tileSize
        );
    }

    ctx.drawImage(
        playerImage,
        offsetX + playerCol * tileSize + tileSize / 4,
        offsetY + playerRow * tileSize + tileSize / 4,
        tileSize / 2,
        tileSize / 2
    );
}

function drawFog(offsetX, offsetY) {
    fogCtx.clearRect(0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(grassImage, 0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(fogImage, 0, 0, mapWidth, mapHeight);

    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            if (fogState[y][x] === 2) {
                fogCtx.save();
                fogCtx.globalCompositeOperation = 'destination-out';
                fogCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                fogCtx.restore();
            } else if (fogState[y][x] === 3) {
                fogCtx.save();
                fogCtx.globalAlpha = 0.3;
                fogCtx.globalCompositeOperation = 'destination-out';
                fogCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                fogCtx.restore();
            }
        }
    }

    ctx.drawImage(fogCanvas, offsetX, offsetY, mapWidth, mapHeight);
    fogCtx.globalAlpha = 1;
}

function updateFogState() {
    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            if (Math.abs(x - playerCol) <= visibilityRadius && Math.abs(y - playerRow) <= visibilityRadius) {
                fogState[y][x] = 2;
            } else if (fogState[y][x] === 2) {
                fogState[y][x] = checkForAdjacentFog(x, y) ? 3 : 2;
            }
        }
    }

    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            if (fogState[y][x] === 3 && !checkForAdjacentFog(x, y)) {
                fogState[y][x] = 2;
            }
        }
    }
}

function checkForAdjacentFog(x, y) {
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];

    return directions.some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && nx < mapCols && ny >= 0 && ny < mapRows && fogState[ny][nx] === 1;
    });
}

function animateFogClear() {
    updateFogState();
    drawVisibleArea();
}

function drawVisibleArea() {
    recalculateOffsets();
    drawMap(offsetX, offsetY);
    drawFog(offsetX, offsetY);
}

function initInitialVisibility() {
    for (let y = Math.max(0, playerRow - visibilityRadius); y <= Math.min(mapRows - 1, playerRow + visibilityRadius); y++) {
        for (let x = Math.max(0, playerCol - visibilityRadius); x <= Math.min(mapCols - 1, playerCol + visibilityRadius); x++) {
            fogState[y][x] = 2;
        }
    }
}

initInitialVisibility();
drawVisibleArea();

function updateStepCount() {
    steps = Math.max(0, steps - 1);
    document.getElementById('step-counter').textContent = `${steps}/100`;
    checkStepTimerVisibility();
    saveGameState();  // Сохранение игры при каждом изменении шагов
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
                saveGameState();  // Сохранение игры при восстановлении шагов
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
    if (steps === 100) {
        stepTimerElement.style.display = 'none';
    } else {
        stepTimerElement.style.display = 'inline';
    }
}

function movePlayer(dx, dy) {
    if (isAnimating) return;
    if (steps <= 0) return;

    const newCol = playerCol + dx;
    const newRow = playerRow + dy;

    if (newCol >= 0 && newCol < mapCols && newRow >= 0 && newRow < mapRows) {
        isAnimating = true;
        animatePlayerMove(newCol, newRow);
        updateStepCount();
        saveGameState();  // Сохранение игры после перемещения игрока

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
            saveGameState();  // Сохранение игры после завершения перемещения

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

function checkAndCollectCoin(y, x) {
    if (world[x][y] === 'coin') {
        world[x][y] = 0;
        earnedCoins += 1;
        saveGameState();  // Сохранение игры после сбора монеты
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
        steps
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedGameState = localStorage.getItem('gameState');
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
        
        document.getElementById('step-counter').textContent = `${steps}/100`;
        drawVisibleArea();
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
    const randomIndex = Math.floor(Math.random() * miniGames.length);
    window.location.href = miniGames[randomIndex];
}

document.addEventListener('DOMContentLoaded', () => {
    loadGameState();  // Загрузка состояния игры при загрузке страницы
    placePortalNearEdge();

    const earnedCoins = parseInt(localStorage.getItem('earnedCoins') || '0', 10);
    
    if (earnedCoins > 0) {
        globalCoins += earnedCoins;
        document.getElementById('token-count').textContent = globalCoins;
        localStorage.removeItem('earnedCoins');
        saveGameState();

        loadGameState();
        animateFogClear();
    }

    restoreSteps();
});

canvas.addEventListener('click', (event) => {
    if (isAnimating) return;
    if (steps <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    const playerX = playerCol * tileSize + offsetX;
    const playerY = playerRow * tileSize + offsetY;

    let dx = 0;
    let dy = 0;

    if (clickX > playerX + tileSize && clickX <= playerX + 2 * tileSize && clickY >= playerY && clickY <= playerY + tileSize) {
        dx = 1;
    } else if (clickX < playerX && clickX >= playerX - tileSize && clickY >= playerY && clickY <= playerY + tileSize) {
        dx = -1;
    } else if (clickY > playerY + tileSize && clickY <= playerY + 2 * tileSize && clickX >= playerX && clickX <= playerX + tileSize) {
        dy = 1;
    } else if (clickY < playerY && clickY >= playerY - tileSize && clickX >= playerX && clickX <= playerX + tileSize) {
        dy = -1;
    }

    if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Назначаем обработчики событий на вкладки
    document.getElementById('game-tab').addEventListener('click', showGameTab);
    document.getElementById('shop-tab').addEventListener('click', loadShopContent);
    document.getElementById('friends-tab').addEventListener('click', loadFriendsContent);
    document.getElementById('tasks-tab').addEventListener('click', loadTasksContent);

    // Показываем вкладку "Game" по умолчанию
    showGameTab();
});

function hideAllTabs() {
    // Скрываем все вкладки и связанные элементы
    document.getElementById('game-world').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('new-game').style.display = 'none';
    document.getElementById('score').style.display = 'none';
    document.getElementById('shop-content').style.display = 'none';
    document.getElementById('friends-content').style.display = 'none';
    document.getElementById('tasks-content').style.display = 'none';
}

function showGameTab() {
    // Показываем вкладку "Game"
    hideAllTabs();
    document.getElementById('game-world').style.display = 'grid';
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('new-game').style.display = 'block';
    document.getElementById('score').style.display = 'flex';
}

function loadShopContent() {
    // Загружаем и показываем вкладку "Shop"
    hideAllTabs();
    loadHTMLContent('html/tab-shop.html', 'shop-content', () => {
        loadCSS('css/tab-shop.css');
        loadScript('js/tab-shop.js');
        document.getElementById('shop-content').style.display = 'block';
    });
}

function loadFriendsContent() {
    // Загружаем и показываем вкладку "Friends"
    hideAllTabs();
    loadHTMLContent('html/tab-friend.html', 'friends-content', () => {
        loadCSS('css/tab-friend.css');
        loadScript('js/tab-friend.js');
        document.getElementById('friends-content').style.display = 'block';
    });
}

function loadTasksContent() {
    // Загружаем и показываем вкладку "Tasks"
    hideAllTabs();
    loadHTMLContent('html/tab-tasks.html', 'tasks-content', () => {
        loadCSS('css/tab-tasks.css');
        loadScript('js/tab-tasks.js');
        document.getElementById('tasks-content').style.display = 'block';
    });
}

function loadHTMLContent(url, containerId, callback) {
    // Загружаем HTML-контент в указанный контейнер
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById(containerId).innerHTML = html;
            if (callback) callback();
        })
        .catch(error => console.error('Ошибка загрузки HTML:', error));
}

function loadCSS(url) {
    // Динамически подключаем CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}

function loadScript(url) {
    // Динамически подключаем JS
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
}

document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('gameState');
    playerCol = Math.floor(mapCols / 2);
    playerRow = Math.floor(mapRows / 2);
    fogState = Array(mapRows).fill().map(() => Array(mapCols).fill(1));
    world = generateNewWorld();

    offsetX = -playerCol * tileSize + canvas.width / 2 - tileSize / 2;
    offsetY = -playerRow * tileSize + canvas.height / 2 - tileSize / 2;

    placePortalNearEdge();

    initInitialVisibility();
    drawVisibleArea();
    globalCoins = 0;
    steps = 100;
    document.getElementById('step-counter').textContent = `${steps}/100`;
    updateControlButtons();
    saveGameState();  // Сохранение игры после начала новой игры
});

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
