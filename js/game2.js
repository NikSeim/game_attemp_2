const gameArea = document.getElementById('game-area');
const exitButton = document.getElementById('exit');
const roundCounter = document.getElementById('round-counter');
const timerDisplay = document.getElementById('timer');
const successCounter = document.getElementById('success-counter');

const gridSize = 6;
const rounds = 3;
const memorizationTime = 3;
const timeLimit = 15;
let path = [];
let userPath = [];
let round = 0;
let successfulRounds = 0;
let coinsEarned = 0;
let gameInProgress = false;
let timerInterval;

document.addEventListener('DOMContentLoaded', () => {
    const selectedCard = JSON.parse(localStorage.getItem('selectedCard'));

    if (selectedCard && selectedCard.miniGameBgSrc) {
        // Применение фона к тегу body
        document.body.style.backgroundImage = `url("${selectedCard.miniGameBgSrc}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
    } else {
        console.error('Фон для мини-игры не найден в localStorage или не был выбран.');
    }
});





// Обработчик кнопки выхода
exitButton.addEventListener('click', () => {
    endGame();
    window.location.href = '../index.html';
});

// Инициализация игрового поля
for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    gameArea.appendChild(cell);
}

startGame();

function startGame() {
    round = 0;
    successfulRounds = 0;
    coinsEarned = 0;
    updateSuccessCounter();
    startRound();
}

function startRound() {
    round++;
    path = generatePattern(5 + round);
    updateRoundCounter();
    gameInProgress = false;
    highlightPath(() => {
        startUserInputPhase();
    });
}

function startUserInputPhase() {
    gameInProgress = true;
    userPath = [];
    timeLeft = timeLimit;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateRoundTimer, 1000);
}

function generatePattern(cellCount) {
    const pattern = new Set();
    while (pattern.size < cellCount) {
        pattern.add(Math.floor(Math.random() * gridSize * gridSize));
    }
    return [...pattern];
}

function highlightPath(callback) {
    path.forEach(index => {
        const cell = gameArea.children[index];
        cell.classList.add('highlight');
    });

    timeLeft = memorizationTime;
    updateTimerDisplay();
    clearInterval(timerInterval);

    // Таймер, синхронизированный с подсветкой
    timerInterval = setInterval(() => {
        if (timeLeft > 1) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            clearHighlight();
            callback(); // Переход к следующей фазе
        }
    }, 1000);
}

function clearHighlight() {
    document.querySelectorAll('.cell.highlight').forEach(cell => {
        cell.classList.remove('highlight');
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
        setTimeout(checkUserPath, 200);
    }
}

function checkUserPath() {
    const isCorrect = userPath.length === path.length && userPath.every(index => path.includes(parseInt(index)));
    endRound(isCorrect);
}

function endRound(success) {
    clearInterval(timerInterval);
    gameInProgress = false;
    clearAllSelections();

    if (success) {
        successfulRounds++;
        coinsEarned += 15;
        updateSuccessCounter();
    }

    if (round >= rounds) {
        showEndGameMenu();
    } else {
        setTimeout(startRound, 1000);
    }
}

function updateRoundTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        endRound(false);
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

function showEndGameMenu() {
    clearGameArea();

    const endGameMenu = document.createElement('div');
    endGameMenu.classList.add('end-game-menu');

    endGameMenu.innerHTML = `
        <p>You won ${successfulRounds}/3 rounds</p>
        <p>You earned ${coinsEarned} coins</p>
        <button id="collect-coins-button" style="background-color:green;color:white;padding:10px 20px;font-size:18px;border:none;border-radius:5px;cursor:pointer;">Collect</button>
    `;

    document.body.appendChild(endGameMenu);

    document.getElementById('collect-coins-button').addEventListener('click', () => {
        endGame();
    });
}

function clearGameArea() {
    gameArea.innerHTML = '';
}

function clearAllSelections() {
    document.querySelectorAll('.cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
}

function endGame() {
    localStorage.setItem('earnedCoins', coinsEarned);
    window.location.href = '../index.html';
}


document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();  // Запрещаем вызов контекстного меню
        });

        img.setAttribute('draggable', false);  // Отключаем перетаскивание изображения
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        // Отключаем контекстное меню при нажатии правой кнопкой мыши
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();  // Блокируем контекстное меню
        });

        // Отключаем перетаскивание изображения
        img.setAttribute('draggable', false);

        // Отключаем долгие нажатия на мобильных устройствах
        img.addEventListener('touchstart', (e) => {
            let timeoutId = setTimeout(() => {
                e.preventDefault();  // Блокируем вызов контекстного меню при долгом нажатии
            }, 300);  // 300 мс — время долгого нажатия, можно настроить

            // Сбрасываем таймер, если палец убран раньше
            img.addEventListener('touchend', () => clearTimeout(timeoutId));
            img.addEventListener('touchmove', () => clearTimeout(timeoutId));
        });
    });
});

