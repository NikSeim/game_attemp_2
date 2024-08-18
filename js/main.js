// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const visibleCols = 5;
const visibleRows = 5;
const mapCols = 50;
const mapRows = 50;
const grassTiles = 10; // Количество повторений травы на карте

const tileSize = canvas.width / visibleCols; // Размер тайла определяется исходя из видимой области 5x5
const mapWidth = mapCols * tileSize;
const mapHeight = mapRows * tileSize;

let playerCol = Math.floor(mapCols / 2);
let playerRow = Math.floor(mapRows / 2);

let offsetX = 0;
let offsetY = 0;

const visibilityRadius = 1; // Радиус видимости
let isAnimating = false; // Флаг для блокировки ввода во время анимации
let steps = 100; // Начальное количество шагов, максимум 100
let portal = null; // Переменная для хранения позиции портала
let stepTimer = 5; // Таймер восстановления шагов (5 секунд)
let stepInterval = null; // Интервал для таймера

// Инициализация fogState
let fogState = Array.from({ length: mapRows }, () => Array(mapCols).fill(1)); // Заполняем массив значениями 1 (не исследовано)

// Функция пересчета смещений для центрирования игрока
function recalculateOffsets() {
    const maxOffsetX = -(mapCols * tileSize - canvas.width);
    const maxOffsetY = -(mapRows * tileSize - canvas.height);

    offsetX = Math.min(0, Math.max(maxOffsetX, -playerCol * tileSize + (canvas.width / 2) - (tileSize / 2)));
    offsetY = Math.min(0, Math.max(maxOffsetY, -playerRow * tileSize + (canvas.height / 2) - (tileSize / 2)));
}

const grassImage = new Image();
grassImage.src = 'image/grace.jpg'; // Путь к изображению травы

const fogImage = new Image();
fogImage.src = 'image/revorkFog.png';  // Путь к туману

const playerImage = new Image();
playerImage.src = 'image/boss.jpg';  // Путь к изображению персонажа

const portalImage = new Image();
portalImage.src = 'image/portal.png';  // Путь к изображению портала

const fogCanvas = document.createElement('canvas');
fogCanvas.width = mapWidth;
fogCanvas.height = mapHeight;
const fogCtx = fogCanvas.getContext('2d');

let globalCoins = parseInt(localStorage.getItem('globalCoins') || '0', 10); // Глобальные монеты
let earnedCoins = 0;  // Монеты, заработанные в мини-игре

fogImage.onload = () => {
    fogCtx.drawImage(grassImage, 0, 0, mapWidth, mapHeight); // Отрисовка травы
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

// Функция для размещения портала по краям карты, на расстоянии 2 клеток от края
function placePortalNearEdge() {
    const positions = [];

    // Собираем возможные позиции для портала на верхнем и нижнем краях
    for (let col = 2; col < mapCols - 2; col++) {
        positions.push({ x: col, y: 2 }); // Верхний край
        positions.push({ x: col, y: mapRows - 3 }); // Нижний край
    }

    // Собираем возможные позиции для портала на левом и правом краях
    for (let row = 2; row < mapRows - 2; row++) {
        positions.push({ x: 2, y: row }); // Левый край
        positions.push({ x: mapCols - 3, y: row }); // Правый край
    }

    // Выбираем случайную позицию из собранных
    let portalPosition;
    do {
        portalPosition = positions[Math.floor(Math.random() * positions.length)];
    } while (world[portalPosition.y][portalPosition.x] === 'coin'); // Проверяем, что на позиции нет монеты

    portal = portalPosition; // Устанавливаем портал в выбранную позицию
}

// Функция для отрисовки карты с учетом портала
function drawMap(offsetX, offsetY) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка бесшовной текстуры травы
    for (let x = offsetX % (tileSize * mapCols / grassTiles) - tileSize; x < canvas.width; x += tileSize * mapCols / grassTiles) {
        for (let y = offsetY % (tileSize * mapRows / grassTiles) - tileSize; y < canvas.height; y += tileSize * mapRows / grassTiles) {
            ctx.drawImage(grassImage, x, y, tileSize * mapCols / grassTiles, tileSize * mapRows / grassTiles);
        }
    }

    // Отрисовка монет
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

    // Отрисовка портала
    if (portal) {
        ctx.drawImage(
            portalImage,
            offsetX + portal.x * tileSize,
            offsetY + portal.y * tileSize,
            tileSize,
            tileSize
        );
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
    fogCtx.drawImage(grassImage, 0, 0, mapWidth, mapHeight); // Отрисовка травы
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
    steps = Math.max(0, steps - 1); // Уменьшаем количество шагов на 1, но не ниже 0
    document.getElementById('step-counter').textContent = `${steps}/100`; // Обновляем отображение на экране

    checkStepTimerVisibility(); // Проверяем видимость таймера после обновления шагов
}

// Функция для восстановления шагов каждые 5 секунд
function restoreSteps() {
    const stepTimerElement = document.getElementById('step-timer');

    stepInterval = setInterval(() => {
        if (steps < 100) {
            stepTimerElement.style.display = 'inline'; // Показываем таймер
            stepTimer -= 1;
            if (stepTimer <= 0) {
                steps = Math.min(100, steps + 1); // Восстанавливаем 1 шаг
                stepTimer = 5; // Сброс таймера на 5 секунд
                document.getElementById('step-counter').textContent = `${steps}/100`;
                checkStepTimerVisibility(); // Проверяем видимость таймера после восстановления шагов
            }
            stepTimerElement.textContent = `00:0${stepTimer}`;
        } else {
            stepTimerElement.style.display = 'none'; // Скрываем таймер, если шаги восстановлены до 100
            clearInterval(stepInterval); // Останавливаем таймер
            stepInterval = null;
        }
    }, 1000);
}

// Функция для проверки видимости таймера
function checkStepTimerVisibility() {
    const stepTimerElement = document.getElementById('step-timer');
    if (steps === 100) {
        stepTimerElement.style.display = 'none'; // Таймер не виден, когда шаги равны 100/100
    } else {
        stepTimerElement.style.display = 'inline'; // Таймер виден, когда шаги меньше 100/100
    }
}

// Обновление функции movePlayer для уменьшения шагов
function movePlayer(dx, dy) {
    if (isAnimating) return; // Если происходит анимация, не обрабатываем ввод
    if (steps <= 0) return; // Если шагов нет, не перемещаем игрока

    const newCol = playerCol + dx;
    const newRow = playerRow + dy;

    if (newCol >= 0 && newCol < mapCols && newRow >= 0 && newRow < mapRows) {
        isAnimating = true; // Устанавливаем флаг, что начинается анимация
        animatePlayerMove(newCol, newRow);
        updateStepCount(); // Уменьшаем количество шагов при каждом перемещении

        // Запускаем таймер восстановления шагов, если он еще не активен и шаги меньше 100
        if (steps < 100 && !stepInterval) {
            restoreSteps();
        }
    }
}

// Функция для анимации перемещения игрока
function animatePlayerMove(newCol, newRow) {
    const startCol = playerCol;
    const startRow = playerRow;
    const duration = 700; // 700 ms на перемещение
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
            saveGameState(); // Сохранение состояния игры после движения

            // Проверяем, есть ли монета на новой клетке
            if (checkAndCollectCoin(newCol, newRow)) {
                savePreMiniGameState(); // Сохраняем состояние перед мини-игрой
                launchRandomMiniGame(); // Запускаем случайную мини-игру
            }

            // Проверяем, достиг ли игрок портала
            if (portal && newCol === portal.x && newRow === portal.y) {
                showConfirmationBox();
            }

            isAnimating = false; // Снимаем флаг после завершения анимации
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
    placePortalNearEdge(); // Размещаем портал по краям карты на расстоянии 2 клеток при загрузке игры

    const earnedCoins = parseInt(localStorage.getItem('earnedCoins') || '0', 10);
    
    if (earnedCoins > 0) {
        globalCoins += earnedCoins; // Добавляем заработанные монеты к основному счету
        document.getElementById('token-count').textContent = globalCoins; // Обновляем отображение монет
        localStorage.removeItem('earnedCoins'); // Удаляем из localStorage после использования
        saveGameState(); // Сохраняем обновленное состояние игры

        loadGameState(); // Загружаем сохранённое состояние игры
        animateFogClear(); // Обновляем туман
    }

    restoreSteps(); // Запускаем таймер восстановления шагов
});

// Оптимизированный обработчик кликов по клеткам для мобильных устройств
canvas.addEventListener('click', (event) => {
    if (isAnimating) return; // Если происходит анимация, не обрабатываем ввод
    if (steps <= 0) return; // Если шагов нет, не перемещаем игрока

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
    if (dx !== 0 || dy !== 0) {
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
    checkStepTimerVisibility(); // Проверяем видимость таймера при загрузке страницы
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

    placePortalNearEdge(); // Размещаем портал по краям карты на расстоянии 2 клеток от игрока

    initInitialVisibility();
    drawVisibleArea();
    globalCoins = 0;
    steps = 100; // Сбрасываем шаги до 100/100
    document.getElementById('step-counter').textContent = `${steps}/100`; // Обновляем отображение шагов
    updateControlButtons(); // Обновляем кнопки управления после начала новой игры
});

// Функция для показа модального окна подтверждения перехода
function showConfirmationBox() {
    const confirmationBox = document.getElementById('confirmation-box');
    confirmationBox.style.display = 'block';

    // Обработчик для кнопки "Да"
    document.getElementById('confirm-yes').addEventListener('click', () => {
        confirmationBox.style.display = 'none';
        startTransition(); // Начинаем плавное затемнение экрана
    });

    // Обработчик для кнопки "Нет"
    document.getElementById('confirm-no').addEventListener('click', () => {
        confirmationBox.style.display = 'none';
    });
}

// Функция для начала плавного затемнения экрана и перехода в новую локацию
function startTransition() {
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'block';           // Показываем элемент
    blackout.style.opacity = '0';               // Устанавливаем начальную прозрачность
    setTimeout(() => {
        blackout.style.transition = 'opacity 1.5s ease'; // Плавный переход за 1.5 секунды
        blackout.style.opacity = '1';           // Увеличиваем прозрачность до 100%
    }, 10); // Небольшая задержка перед запуском анимации, чтобы изменение стилей применилось

    setTimeout(() => {
        document.getElementById('new-game').click(); // Запуск новой игры
        setTimeout(() => {
            blackout.style.transition = 'opacity 1s ease'; // Переход от черного к прозрачному за 1 секунду
            blackout.style.opacity = '0';                  // Уменьшаем прозрачность до 0
            setTimeout(() => {
                blackout.style.display = 'none';           // Скрываем элемент после завершения анимации
            }, 1000);
        }, 1000); // Длительность черного экрана 1 секунда
    }, 1500); // Переход в черный экран 1.5 секунды
}
