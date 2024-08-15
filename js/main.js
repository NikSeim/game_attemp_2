// Initialize Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const mapCols = 50;
const mapRows = 50;
let tileSize;

let playerCol = Math.floor(mapCols / 2);
let playerRow = Math.floor(mapRows / 2);

let offsetX = 0;
let offsetY = 0;

const visibilityRadius = 1; // Visibility radius

let fogState = Array(mapRows).fill().map(() => Array(mapCols).fill(1)); // 1 - unexplored, 2 - visible, 3 - semi-transparent

const mapImage = new Image();
mapImage.src = 'image/grace.jpg';  // Path to the map

const fogImage = new Image();
fogImage.src = 'image/revorkFog.png';  // Path to the fog

const playerImage = new Image();
playerImage.src = 'image/boss.jpg';  // Path to the player image

const fogCanvas = document.createElement('canvas');
const fogCtx = fogCanvas.getContext('2d');

let globalCoins = parseInt(localStorage.getItem('globalCoins') || '0', 10); // Global coins
let earnedCoins = 0;  // Coins earned in the mini-game
let steps = 100; // Initial number of steps

fogImage.onload = () => {
    fogCtx.drawImage(mapImage, 0, 0, fogCanvas.width, fogCanvas.height);
    fogCtx.drawImage(fogImage, 0, 0, fogCanvas.width, fogCanvas.height);
    drawVisibleArea();
};

// Generate map and coins
let world = generateNewWorld();

// Function to generate a new map with coins
function generateNewWorld() {
    let newWorld = Array.from({ length: mapRows }, () => Array(mapCols).fill(0));
    for (let i = 0; i < 50; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * mapCols);
            y = Math.floor(Math.random() * mapRows);
        } while (x === playerCol && y === playerRow); // Exclude player's position

        newWorld[y][x] = 'coin';
    }
    return newWorld;
}

// Functions to draw the map and fog
function drawMap(offsetX, offsetY) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, offsetX, offsetY, fogCanvas.width, fogCanvas.height);

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

    // Draw player
    ctx.drawImage(
        playerImage,
        offsetX + playerCol * tileSize + tileSize / 4,
        offsetY + playerRow * tileSize + tileSize / 4,
        tileSize / 2,
        tileSize / 2
    );
}

function drawFog(offsetX, offsetY) {
    fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
    fogCtx.drawImage(mapImage, 0, 0, fogCanvas.width, fogCanvas.height);
    fogCtx.drawImage(fogImage, 0, 0, fogCanvas.width, fogCanvas.height);

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

    ctx.drawImage(fogCanvas, offsetX, offsetY, fogCanvas.width, fogCanvas.height);
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
    drawMap(offsetX, offsetY);
    drawFog(offsetX, offsetY);
}

function initInitialVisibility() {
    // Initialize visibility of cells around the player within radius 1
    for (let y = Math.max(0, playerRow - visibilityRadius); y <= Math.min(mapRows - 1, playerRow + visibilityRadius); y++) {
        for (let x = Math.max(0, playerCol - visibilityRadius); x <= Math.min(mapCols - 1, playerCol + visibilityRadius); x++) {
            fogState[y][x] = 2; // Mark cells as explored
        }
    }
}

initInitialVisibility();
drawVisibleArea();

// Function to update and display the remaining steps
function updateStepCount() {
    steps--; // Decrease steps by 1
    document.getElementById('step-counter').textContent = `${steps}/100`; // Update the display on the screen
}

// Update movePlayer function to decrease steps
function movePlayer(dx, dy) {
    const newCol = playerCol + dx;
    const newRow = playerRow + dy;

    if (newCol >= 0 && newCol < mapCols && newRow >= 0 && newRow < mapRows) {
        animatePlayerMove(newCol, newRow);
        updateStepCount(); // Decrease steps on each move
    }
}

// Function to animate the player's movement
function animatePlayerMove(newCol, newRow) {
    const startCol = playerCol;
    const startRow = playerRow;
    const duration = 700; // 700 ms for movement
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth player movement
        const currentCol = startCol + progress * (newCol - startCol);
        const currentRow = startRow + progress * (newRow - startRow);

        offsetX = -currentCol * tileSize + canvas.width / 2 - tileSize / 2;
        offsetY = -currentRow * tileSize + canvas.height / 2 - tileSize / 2;

        drawVisibleArea();

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            playerCol = newCol;
            playerRow = newRow;
            animateFogClear();
            saveGameState();
        }
    }

    requestAnimationFrame(step);
}

// Check for coin and collect it
function checkAndCollectCoin(col, row) {
    if (world[row][col] === 'coin') {
        world[row][col] = 0; // Remove the coin from the map
        earnedCoins += 1; // Increase earned coins
        return true;
    }
    return false;
}

// Function to save game state
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
        steps // Save the number of steps
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

// Function to load game state
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
        steps = gameState.steps || 100; // Restore steps or set to initial value
        
        document.getElementById('step-counter').textContent = `${steps}/100`; // Update the steps display
        drawVisibleArea();
    }
}

// Function to save state before mini-game
function savePreMiniGameState() {
    saveGameState();
}

// Launch random mini-game
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

// Handle coinsEarned event to add coins after mini-game
document.addEventListener('DOMContentLoaded', () => {
    const earnedCoins = parseInt(localStorage.getItem('earnedCoins') || '0', 10);
    
    if (earnedCoins > 0) {
        globalCoins += earnedCoins; // Add earned coins to the main score
        document.getElementById('token-count').textContent = globalCoins; // Update the coin display
        localStorage.removeItem('earnedCoins'); // Remove from localStorage after use
        saveGameState(); // Save updated game state

        // After completing the mini-game, return the player to the coin's position
        loadGameState(); // Load saved game state
        animateFogClear(); // Update the fog
    }
});

// Handle arrow key events for movement
document.addEventListener('keydown', (event) => {
    let dx = 0;
    let dy = 0;

    switch (event.key) {
        case 'ArrowUp':
            dy = -1;
            break;
        case 'ArrowDown':
            dy = 1;
            break;
        case 'ArrowLeft':
            dx = -1;
            break;
        case 'ArrowRight':
            dx = 1;
            break;
    }

    movePlayer(dx, dy);
});

// Handle clicks on cells
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // Width scaling
    const scaleY = canvas.height / rect.height;  // Height scaling

    const clickX = (event.clientX - rect.left) * scaleX;  // Scale X coordinate
    const clickY = (event.clientY - rect.top) * scaleY;   // Scale Y coordinate

    const clickedCol = Math.floor((clickX - offsetX) / tileSize);
    const clickedRow = Math.floor((clickY - offsetY) / tileSize);

    const dx = clickedCol - playerCol;
    const dy = clickedRow - playerRow;

    // Handle click only if player moves within one cell
    if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
        movePlayer(dx, dy);
    }
});

// Switch between tabs
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

// Load game state on page load
document.addEventListener('DOMContentLoaded', () => {
    hideAllTabs();
    showGameTab();
    loadGameState();
    document.getElementById('token-count').textContent = globalCoins;
    document.getElementById('step-counter').textContent = `${steps}/100`; // Display remaining steps
    drawVisibleArea();
});

// Function to resize the canvas to fit the container while keeping the aspect ratio
function resizeCanvas() {
    const container = document.getElementById('game-container');
    
    // Aspect ratio of the map
    const aspectRatio = mapCols / mapRows;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
        // If container is wider than the map's aspect ratio
        canvas.height = containerHeight;
        canvas.width = containerHeight * aspectRatio;
    } else {
        // If container is taller than the map's aspect ratio
        canvas.width = containerWidth;
        canvas.height = containerWidth / aspectRatio;
    }

    tileSize = canvas.width / mapCols; // Update tile size to match canvas width
    fogCanvas.width = mapCols * tileSize;
    fogCanvas.height = mapRows * tileSize;
    
    offsetX = -playerCol * tileSize + canvas.width / 2 - tileSize / 2;
    offsetY = -playerRow * tileSize + canvas.height / 2 - tileSize / 2;
    
    drawVisibleArea(); // Update the map after resizing
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Adjust sizes on initial load

// Handle "New Game" button click
document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('gameState');
    playerCol = Math.floor(mapCols / 2);
    playerRow = Math.floor(mapRows / 2);
    fogState = Array(mapRows).fill().map(() => Array(mapCols).fill(1));
    world = generateNewWorld(); // Generate a new map

    // Update camera offset to center the player
    offsetX = -playerCol * tileSize + canvas.width / 2 - tileSize / 2;
    offsetY = -playerRow * tileSize + canvas.height / 2 - tileSize / 2;

    initInitialVisibility();
    drawVisibleArea();
    globalCoins = 0;
    steps = 100; // Reset steps to the initial value
    saveGameState();
    document.getElementById('step-counter').textContent = `${steps}/100`; // Update the steps display
});
