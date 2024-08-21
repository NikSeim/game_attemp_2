// game4.js
let coinImage = document.getElementById('coin-image');
let message = document.getElementById('message');
let timerElement = document.getElementById('timer');
let exitButton = document.getElementById('exit');

let coinsEarned = 0; // Счетчик заработанных монет
let timeLeft = 5; // Таймер на 20 секунд
const maxClicks = 500;
let clickCount = 0;
let clicksPerSecond = 0;
let lastClickTime = 0;

function updateMessage() {
    message.textContent = `Монет заработано: ${coinsEarned}`;
}

function handleCoinClick(event) {
    event.preventDefault(); // Предотвращаем стандартное поведение

    // Проверка для обработки множественных касаний
    const touches = event.touches || [{ clientX: event.clientX, clientY: event.clientY }];
    
    let currentTime = Date.now();
    if (currentTime - lastClickTime < 1000) {
        if (clicksPerSecond >= 25) {
            return;
        }
    } else {
        clicksPerSecond = 0;
        lastClickTime = currentTime;
    }

    for (let i = 0; i < touches.length; i++) {
        const touchX = touches[i].clientX;
        const touchY = touches[i].clientY;
        
        clicksPerSecond++;
        if (clickCount < maxClicks) {
            clickCount++;
            coinsEarned++;
            updateMessage();

            // Создаем анимацию "+1" для каждого касания
            createPlusOneEffect(touchX, touchY);
        }
    }

    if (clickCount >= maxClicks) {
        coinImage.removeEventListener('click', handleCoinClick);
        coinImage.removeEventListener('touchstart', handleCoinClick);
        endGameMenu();
    }
}

function createPlusOneEffect(x, y) {
    const plusOne = document.createElement('div');
    plusOne.textContent = '+1';
    plusOne.className = 'plus-one';
    plusOne.style.left = `${x}px`;
    plusOne.style.top = `${y}px`;
    document.body.appendChild(plusOne);

    setTimeout(() => {
        plusOne.remove();
    }, 400); // 0.4 секунды
}

function startTimer() {
    let timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Оставшееся время: ${timeLeft} секунд`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            coinImage.removeEventListener('click', handleCoinClick);
            coinImage.removeEventListener('touchstart', handleCoinClick);
            endGameMenu();
        }
    }, 1000);
}

function endGameMenu() {

    const endScreen = document.createElement('div');
    endScreen.id = 'end-screen';
    endScreen.innerHTML = `
    <div id="end-screen-content">
        <p>Время вышло! Монет заработано: ${coinsEarned}</p>
        <button id="collect-button">Забрать</button>
    </div>`;

    document.body.appendChild(endScreen);
    localStorage.setItem('earnedCoins', coinsEarned);
    
    const collectButton = document.getElementById('collect-button');

    // Добавляем обработчик события только к кнопке
    console.log(" ");
    
    collectButton.addEventListener('click', () => {
        console.log(" ");
        window.location.href = '../index.html';
    });
}


/*function endGameMenu() {
    // Очистка игрового поля
    gameArea.removeChild(gameArea.firstChild);

    // Создание меню
    endMenu.id = 'end-menu';
    endMenu.innerHTML = `
        <div id="end-menu-content">
            <p>Время вышло! Монет заработано: ${coinsEarned}</p>
            <button id="collect-button">Забрать</button>
        </div>
    `;
    document.getElementById('collect-button').addEventListener('click', () => {
        // Сохраняем заработанные монеты в localStorage
        localStorage.setItem('earnedCoins', coinsEarned);

        // Переход на главное меню
        window.location.href = '../index.html';
    });*/

// Обработка кликов мышью и касаний на телефоне
coinImage.addEventListener('click', handleCoinClick);
coinImage.addEventListener('touchstart', handleCoinClick);

startTimer();
updateMessage();
