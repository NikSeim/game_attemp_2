const gameArea = document.getElementById('game-area');
const exitButton = document.getElementById('exit');
const roundCounter = document.getElementById('round-counter');
const timerDisplay = document.getElementById('timer');
const successCounter = document.getElementById('success-counter');
const gridSize = 6;
let path = [];
let userPath = [];
let currentStep = 0;
let gameInProgress = false;
let round = 0;
let rounds = 3;
let memorizationTime = 3; // Time to memorize the path
let timeLimit = 15; // Time limit for each round
let timeLeft;
let timerInterval;
let successfulRounds = 0; // Number of successful rounds

// Exit button event
exitButton.addEventListener('click', () => {
    endGame();
    window.location.href = '../index.html';
});

// Initialize game area
for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = `${i}-${j}`;
        cell.addEventListener('click', handleCellClick);
        gameArea.appendChild(cell);
    }
}

// Start the game
startGame();

function startGame() {
    round = 0;
    successfulRounds = 0;
    updateSuccessCounter();
    startRound();
}

function startRound() {
    round++;
    path = generatePath();
    highlightPath();
    updateRoundCounter();
    timeLeft = memorizationTime;
    updateTimerDisplay();
    timerInterval = setInterval(updateMemorizationTimer, 1000);
}

function startMemorizationPhase() {
    gameInProgress = false;
    currentStep = 0;
    userPath = [];
    timeLeft = memorizationTime;
    updateTimerDisplay();
    timerInterval = setInterval(updateMemorizationTimer, 1000);
}

function startUserInputPhase() {
    gameInProgress = true;
    currentStep = 0;
    userPath = [];
    timeLeft = timeLimit;
    updateTimerDisplay();
    timerInterval = setInterval(updateRoundTimer, 1000);
}

function generatePath() {
    const path = [];
    let x = Math.floor(Math.random() * gridSize);
    let y = Math.floor(Math.random() * gridSize);
    for (let i = 0; i < gridSize; i++) {
        path.push(`${x}-${y}`);
        if (Math.random() > 0.5) {
            x = (x + 1) % gridSize;
        } else {
            y = (y + 1) % gridSize;
        }
    }
    return path;
}

function highlightPath() {
    path.forEach(index => {
        const cell = document.querySelector(`.cell[data-index='${index}']`);
        cell.classList.add('highlight');
    });
}

function clearHighlight() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight');
    });
}

function clearAllSelections() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });
}

function handleCellClick(event) {
    if (!gameInProgress) return;

    const index = event.target.dataset.index;

    if (!userPath.includes(index)) {
        userPath.push(index);
        event.target.classList.add('selected');
    }

    if (userPath.length === path.length) {
        setTimeout(checkUserPath, 200); // Delay the check to allow the last selection to be highlighted
    }
}

function checkUserPath() {
    const isCorrect = userPath.length === path.length && userPath.every(cell => path.includes(cell));

    endRound(isCorrect);
}

function endRound(success) {
    clearInterval(timerInterval);
    gameInProgress = false;
    clearHighlight();
    clearAllSelections(); // Clear all highlights and selections

    if (success) {
        successfulRounds++;
        updateSuccessCounter();
    }

    if (round >= rounds) {
        endGame();
    } else {
        setTimeout(() => {
            startRound();
        }, 1000); // 1 second delay before the next round
    }
}

function endGame() {
    updateCoins(successfulRounds * 10); // Add 10 coins for each successful round
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000); // 1 second delay before redirecting to the main menu
}

function updateMemorizationTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        clearHighlight();
        startUserInputPhase();
    }
}

function updateRoundTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        endRound(false); // Time out
    }
}

function updateRoundCounter() {
    roundCounter.textContent = `Round ${round}/${rounds}`;
}

function updateSuccessCounter() {
    successCounter.textContent = `Success ${successfulRounds}/${rounds}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = timeLeft;
}

function updateCoins(amount) {
    const savedGameState = localStorage.getItem('gameState');
    let gameState = savedGameState ? JSON.parse(savedGameState) : null;

    if (gameState) {
        gameState.coins += amount;
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }
}
