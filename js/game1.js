const gameArea = document.getElementById('game-area');
const coinCounter = document.getElementById('coin-counter');
const exitButton = document.getElementById('exit');
const timerElement = document.getElementById('timer');
let earnedCoins = 0;
const objectFallInterval = 400;

const objects = [
    { src: '../image/tokendisgn.webp', value: 1 },
    { src: '../image/bomb.webp', value: -10 }
];

exitButton.addEventListener('click', () => {
    window.location.href = '../index.html';
});

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





function createFallingObject() {
    const objectData = objects[Math.random() < 0.8 ? 0 : 1]; // 80% chance of coin, 20% bomb
    const object = document.createElement('img');
    object.src = objectData.src;
    object.classList.add('falling-object');
    object.style.left = `${Math.random() * 90}vw`;
    object.style.top = '-50px';
    object.value = objectData.value;

    object.addEventListener('mousedown', () => {
        earnedCoins = Math.max(0, earnedCoins + object.value);
        coinCounter.textContent = earnedCoins;
        object.remove();
        if (!document.querySelector('.falling-object')) endGameMenu();
    });

    gameArea.appendChild(object);
    animateFallingObject(object);
}

function animateFallingObject(object) {
    let top = -50;
    const fallSpeed = Math.random() * 2 + 2;

    (function fall() {
        if (top < window.innerHeight) {
            top += fallSpeed;
            object.style.top = `${top}px`;
            requestAnimationFrame(fall);
        } else {
            object.remove();
            if (!document.querySelector('.falling-object')) endGameMenu();
        }
    })();
}

function startGame() {
    let timeLeft = 30;
    timerElement.textContent = `0:${timeLeft}`;
    const gameInterval = setInterval(createFallingObject, objectFallInterval);

    const timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
        timerElement.style.backgroundColor = timeLeft <= 5 ? 'rgb(255, 0, 0)' : timeLeft <= 15 ? 'rgb(255, 153, 0)' : 'rgb(0, 170, 255)';
        if (timeLeft <= 0) endGame();
    }, 1000);

    function endGame() {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        endGameMenu();
    }

    setTimeout(endGame, timeLeft * 1000);
}

function endGameMenu() {
    gameArea.innerHTML = `
        <div id="end-menu" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;max-width:300px;padding:20px;background-color:rgba(0,0,0,0.8);color:white;text-align:center;border-radius:10px;z-index:100;">
            <p>Вы получили ${earnedCoins} монет</p>
            <button id="collect-coins-button" style="background-color:#28a745;color:white;border:none;border-radius:5px;padding:10px 20px;font-size:18px;cursor:pointer;">Забрать</button>
        </div>
    `;

    document.getElementById('collect-coins-button').addEventListener('click', () => {
        localStorage.setItem('earnedCoins', earnedCoins);
        window.location.href = '../index.html';
    });
}




startGame();


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

