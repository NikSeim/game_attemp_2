// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const tileSize = canvas.width / 5; // Размер тайла определяется в зависимости от ширины canvas
const mapCols = 50;
const mapRows = 50;

const mapWidth = mapCols * tileSize;
const mapHeight = mapRows * tileSize;

let playerCol = Math.floor(mapCols / 2);
let playerRow = Math.floor(mapRows / 2);

let offsetX = 0;
let offsetY = 0;

const visibilityRadius = 1; // Радиус видимости
let isAnimating = false; // Флаг для блокировки ввода во время анимации

// Инициализация fogState
let fogState = Array.from({ length: mapRows }, () => Array(mapCols).fill(1)); // Заполняем массив значениями 1 (не исследовано)

// Функция пересчета смещений для центрирования игрока
function recalculateOffsets() {
    offsetX = -playerCol * tileSize + canvas.width / 2 - tileSize / 2;
    offsetY = -playerRow * tileSize + canvas.height / 2 - tileSize / 2;
}

const mapImage = new Image();
mapImage.src = 'image/grace.jpg';  // Путь к карте

const fogImage = new Image();
fogImage.src = 'image/revorkFog.png';  // Путь к туману

const playerImage = new Image();
playerImage.src = 'image/boss.jpg';  // Путь к изображению персонажа

const fogCanvas = document.createElement('canvas');
fogCanvas.width = mapWidth;
fogCanvas.height = mapHeight;
const fogCtx = fogCanvas.getContext('2d');

let globalCoins = parseInt(localStorage.getItem('globalCoins') || '0', 10); // Глобальные монеты
let earnedCoins = 0;  // Монеты, заработанные в мини-игре
let steps = 100; // Начальное количество шагов

fogImage.onload = () => {
    fogCtx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(fogImage, 0, 0, mapWidth, mapHeight);
    recalculateOffsets(); // Пересчитываем смещения после загрузки изображений
    drawVisibleArea(); 
};

// Генерация карты и монет
let world = generateNewWorld();

function generateNewWorld() {
    let newWorld = Array.from({ length: mapRows }, () => Array(mapCols).fill(0));
    for (let i = 0; i < 50; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * mapCols);
            y = Math.floor(Math.random() * mapRows);
        } while (x === playerCol && y === playerRow); // Исключаем позицию игрока

        newWorld[y][x] = 'coin';
    }
    return newWorld;
}

// Функции рисования карты и тумана
function drawMap(offsetX, offsetY) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, offsetX, offsetY, mapWidth, mapHeight);

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

    // Отрисовка персонажа
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
    fogCtx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
    fogCtx.drawImage(fogImage, 0, 0, mapWidth, mapHeight);

    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            if (fogState[y][x] === 2) { // Проверка на значение fogState
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
                fogState[y][x] = 2; // Открываем клетку
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

// Обновляем смещения перед отрисовкой видимой области
function drawVisibleArea() {
    recalculateOffsets();
    drawMap(offsetX, offsetY);
    drawFog(offsetX, offsetY);
}

function initInitialVisibility() {
    // Инициализация видимости клеток вокруг игрока в радиусе 1
    for (let y = Math.max(0, playerRow - visibilityRadius); y <= Math.min(mapRows - 1, playerRow + visibilityRadius); y++) {
        for (let x = Math.max(0, playerCol - visibilityRadius); x <= Math.min(mapCols - 1, playerCol + visibilityRadius); x++) {
            fogState[y][x] = 2; // Помечаем клетки как исследованные
        }
    }
}

initInitialVisibility();
drawVisibleArea();

// Функция для обновления и отображения количества оставшихся шагов
function updateStepCount() {
    steps--; // Уменьшаем количество шагов на 1
    document.getElementById('step-counter').textContent = `${steps}/100`; // Обновляем отображение на экране
}

// Функция для обновления кнопок управления после перемещения игрока
function updateControlButtons() {
    const controlInfo = `Player at (${playerCol}, ${playerRow})`;
    document.getElementById('control-info').textContent = controlInfo;
}

// Функция перемещения игрока
function movePlayer(dx, dy) {
    if (isAnimating) return; // Если происходит анимация, не обрабатываем ввод

    const newCol = playerCol + dx;
    const newRow = playerRow + dy;

    if (newCol >= 0 && newCol < mapCols && newRow >= 0 && newRow < mapRows) {
        isAnimating = true; // Устанавливаем флаг, что начинается анимация
        animatePlayerMove(newCol, newRow);
    }
}

// Функция для анимации перемещения игрока
function animatePlayerMove(newCol, newRow) {
    const startCol = playerCol;
    const startRow = playerRow;
    const duration = 300; // 300 ms на перемещение
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
            // После завершения анимации обновляем позицию игрока и состояние тумана
            playerCol = newCol;
            playerRow = newRow;
            recalculateOffsets(); // Пересчитываем смещения после перемещения
            animateFogClear();
            isAnimating = false; // Снимаем флаг после завершения анимации

            if (checkAndCollectCoin(newCol, newRow)) {
                launchRandomMiniGame(); // Запускаем случайную мини-игру после подбора монеты
            }

            saveGameState(); // Сохранение состояния игры после движения
            updateControlButtons(); // Обновляем кнопки управления после завершения анимации
        }
    }

    requestAnimationFrame(step);
}

// Проверка на монету и её сбор
function checkAndCollectCoin(col, row) {
    if (world[row][col] === 'coin') {
        world[row][col] = 0; // Убираем монету с карты
        earnedCoins += 1; // Увеличиваем количество заработанных монет
        return true;
    }
    return false;
}

// Функция для сохранения состояния игры
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
        steps // Сохраняем количество шагов
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Функция для загрузки состояния игры
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
        steps = gameState.steps || 100; // Восстанавливаем количество шагов или устанавливаем начальное значение
        
        document.getElementById('step-counter').textContent = `${steps}/100`; // Обновляем отображение шагов на экране
        drawVisibleArea();
    }
}

// Функция для сохранения состояния перед мини-игрой
function savePreMiniGameState() {
    saveGameState();
}

// Запуск случайной мини-игры
function launchRandomMiniGame() {
    savePreMiniGameState();

    const miniGames = [
        'html/game1.html',
        'html/game2.html',
        'html/game3.html',
        'html/game4.html',
        'html/game5.html'
    ];
    const randomIndex = Math.floor(Math.random() * miniGames.length);
    window.location.href = miniGames[randomIndex];
}

// Обработка события coinsEarned для добавления монет после завершения мини-игры
document.addEventListener('DOMContentLoaded', () => {
    const earnedCoins = parseInt(localStorage.getItem('earnedCoins') || '0', 10);
    
    if (earnedCoins > 0) {
        globalCoins += earnedCoins; // Добавляем заработанные монеты к основному счету
        document.getElementById('token-count').textContent = globalCoins; // Обновляем отображение монет
        localStorage.removeItem('earnedCoins'); // Удаляем из localStorage после использования
        saveGameState(); // Сохраняем обновленное состояние игры

        loadGameState(); // Загружаем сохранённое состояние игры
        animateFogClear(); // Обновляем туман
    }
});

// Обработчик кликов по клеткам
canvas.addEventListener('click', (event) => {
    if (isAnimating) return; // Если происходит анимация, не обрабатываем ввод

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // Масштабируем координаты клика по ширине
    const scaleY = canvas.height / rect.height;  // Масштабируем координаты клика по высоте

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Находим координаты текущего положения игрока
    const playerX = playerCol * tileSize + offsetX;
    const playerY = playerRow * tileSize + offsetY;

    // Проверяем направление движения на соседние клетки строго по вертикали и горизонтали
    let dx = 0;
    let dy = 0;

    if (clickX > playerX + tileSize && clickX <= playerX + 2 * tileSize && clickY >= playerY && clickY <= playerY + tileSize) {
        dx = 1;  // Вправо
    } else if (clickX < playerX && clickX >= playerX - tileSize && clickY >= playerY && clickY <= playerY + tileSize) {
        dx = -1; // Влево
    } else if (clickY > playerY + tileSize && clickY <= playerY + 2 * tileSize && clickX >= playerX && clickX <= playerX + tileSize) {
        dy = 1;  // Вниз
    } else if (clickY < playerY && clickY >= playerY - tileSize && clickX >= playerX && clickX <= playerX + tileSize) {
        dy = -1; // Вверх
    }

    // Перемещаем игрока, только если он может двигаться на одну клетку и только по горизонтали или вертикали
    if ((dx !== 0 || dy !== 0) && Math.abs(dx) + Math.abs(dy) === 1) {
        movePlayer(dx, dy);
    }
});

// Переключение между вкладками
document.getElementById('game-tab').addEventListener('click', showGameTab);
document.getElementById('friends-tab').addEventListener('click', showFriendsTab);
document.getElementById('tasks-tab').addEventListener('click', showTasksTab);

function hideAllTabs() {
    document.getElementById('game-world').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('new-game').style.display = 'none';
    document.getElementById('score').style.display = 'none';
    document.getElementById('friends-content').style.display = 'none';
    document.getElementById('tasks-content').style.display = 'none';
}

function showGameTab() {
    hideAllTabs();
    document.getElementById('game-world').style.display = 'grid';
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('new-game').style.display = 'block';
    document.getElementById('score').style.display = 'flex';
}

function showFriendsTab() {
    hideAllTabs();
    document.getElementById('friends-content').style.display = 'block';
}

function showTasksTab() {
    hideAllTabs();
    document.getElementById('tasks-content').style.display = 'block';
}

// Загрузка состояния при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    hideAllTabs();
    showGameTab();
    loadGameState();
    document.getElementById('token-count').textContent = globalCoins;
    document.getElementById('step-counter').textContent = `${steps}/100`; // Отображаем оставшиеся шаги
    drawVisibleArea();
    updateControlButtons(); // Обновляем кнопки управления при загрузке страницы
});

// Обработка нажатия на кнопку "New Game"
document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('gameState');
    playerCol = Math.floor(mapCols / 2);
    playerRow = Math.floor(mapRows / 2);
    fogState = Array(mapRows).fill().map(() => Array(mapCols).fill(1)); // Переинициализация fogState
    world = generateNewWorld(); // Генерация новой карты

    // Обновляем смещение камеры на центр игрока
    offsetX = -playerCol * tileSize + canvas.width / 2 - tileSize / 2;
    offsetY = -playerRow * tileSize + canvas.height / 2 - tileSize / 2;

    initInitialVisibility();
    drawVisibleArea();
    globalCoins = 0;
    steps = 100; // Сброс шагов на начальное значение
    saveGameState();
    document.getElementById('step-counter').textContent = `${steps}/100`; // Обновляем отображение шагов
    updateControlButtons(); // Обновляем кнопки управления после начала новой игры
});
