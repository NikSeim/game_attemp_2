// game4.js
let coinImage = document.getElementById('coin-image');
let message = document.getElementById('message');
let timerElement = document.getElementById('timer');
let exitButton = document.getElementById('exit');

let coinsEarned = 0;
let timeLeft = 20; // Таймер на 20 секунд
const maxClicks = 500;
let clickCount = 0;
let clicksPerSecond = 0;
let lastClickTime = 0;

function updateMessage() {
    message.textContent = `Монет заработано: ${coinsEarned}`;
}

function handleCoinClick(event) {
    let currentTime = Date.now();
    if (currentTime - lastClickTime < 1000) { // Проверка кликов в последнюю секунду
        if (clicksPerSecond >= 25) {
            return; // Если уже 25 кликов, выходим
        }
    } else {
        clicksPerSecond = 0; // Сбрасываем счетчик если прошла секунда
        lastClickTime = currentTime;
    }

    clicksPerSecond++;
    if (clickCount < maxClicks) {
        clickCount++;
        coinsEarned++;
        updateMessage();

        // Создаем анимацию "+1"
        createPlusOneEffect(event.clientX, event.clientY);
    }

    if (clickCount >= maxClicks) {
        coinImage.removeEventListener('click', handleCoinClick);
        showEndScreen();
    }
}

function createPlusOneEffect(x, y) {
    const plusOne = document.createElement('div');
    plusOne.textContent = '+1';
    plusOne.className = 'plus-one';
    plusOne.style.left = `${x}px`;
    plusOne.style.top = `${y}px`;
    document.body.appendChild(plusOne);

    // Удаляем элемент после завершения анимации
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
            showEndScreen();
        }
    }, 1000);
}

function showEndScreen() {
    // Скрываем надписи о заработанных монетах и оставшемся времени
    message.style.display = 'none';
    timerElement.style.display = 'none';

    // Создаем затемненное окно с текстом и кнопкой
    const endScreen = document.createElement('div');
    endScreen.id = 'end-screen';
    endScreen.innerHTML = `
        <div id="end-screen-content">
            <p>Время вышло! Монет заработано: ${coinsEarned}</p>
            <button id="collect-button">Забрать</button>
        </div>
    `;
    document.body.appendChild(endScreen);

    // Слушатель на кнопку "Забрать"
    document.getElementById('collect-button').addEventListener('click', () => {
        localStorage.setItem('earnedCoins', coinsEarned);
        window.location.href = '../index.html';
    });
}

exitButton.addEventListener('click', () => {
    window.location.href = '../index.html';
});

coinImage.addEventListener('click', handleCoinClick);
coinImage.addEventListener('touchstart', handleCoinClick); // Для многопальцевого взаимодействия

startTimer();
updateMessage();
