const coinImage = document.getElementById('coin-image');
const message = document.getElementById('message');
const timerElement = document.getElementById('timer');
const exitButton = document.getElementById('exit');
let coinsEarned = 0;
let timeLeft = 20;
const maxClicks = 500;
let clickCount = 0;
let clicksPerSecond = 0;
let lastClickTime = 0;

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




// Функция для проверки, находится ли точка (x, y) внутри круга
function isInsideCircle(x, y, circleX, circleY, radius) {
    const dx = x - circleX;
    const dy = y - circleY;
    return (dx * dx + dy * dy) <= (radius * radius);
}

function updateMessage() {
    message.textContent = `Монет заработано: ${coinsEarned}`;
}

function handleCoinClick(event) {
    event.preventDefault();
    const touches = event.touches || [{ clientX: event.clientX, clientY: event.clientY }];

    const rect = coinImage.getBoundingClientRect();
    const padding = parseFloat(window.getComputedStyle(coinImage).paddingLeft); // Получаем значение padding
    const circleX = rect.left + rect.width / 2;
    const circleY = rect.top + rect.height / 2;
    const radius = (rect.width - padding * 2) / 2; // Радиус круга с учетом padding

    let currentTime = Date.now();
    if (currentTime - lastClickTime < 1000) {
        if (clicksPerSecond >= 25) return;
    } else {
        clicksPerSecond = 0;
        lastClickTime = currentTime;
    }

    for (let i = 0; i < touches.length; i++) {
        const touchX = touches[i].clientX;
        const touchY = touches[i].clientY;

        if (isInsideCircle(touchX, touchY, circleX, circleY, radius)) {
            clicksPerSecond++;
            if (clickCount < maxClicks) {
                clickCount++;
                coinsEarned++;
                updateMessage();
                createPlusOneEffect(touchX, touchY);
            }
        }
    }

    if (clickCount >= maxClicks) {
        endGame();
    }
}

function createPlusOneEffect(x, y) {
    const plusOne = document.createElement('div');
    plusOne.textContent = '+1';
    plusOne.className = 'plus-one';
    plusOne.style.left = `${x}px`;
    plusOne.style.top = `${y}px`;
    document.body.appendChild(plusOne);

    setTimeout(() => plusOne.remove(), 400);
}

function startTimer() {
    const timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Оставшееся время: ${timeLeft} секунд`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}

function endGame() {
    coinImage.removeEventListener('click', handleCoinClick);
    coinImage.removeEventListener('touchstart', handleCoinClick);
    showEndGameMenu();
}

function showEndGameMenu() {
    document.getElementById('end-screen').style.display = 'block';
    document.getElementById('end-message').textContent = `Время вышло! Монет заработано: ${coinsEarned}`;
    localStorage.setItem('earnedCoins', coinsEarned);

    document.getElementById('collect-button').addEventListener('click', () => {
        window.location.href = '../index.html';
    });
}

exitButton.addEventListener('click', () => {
    window.location.href = '../index.html';
});

coinImage.addEventListener('click', handleCoinClick);
coinImage.addEventListener('touchstart', handleCoinClick);



startTimer();
updateMessage();


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

