const gameArea = document.getElementById('game-area');
const coinCounter = document.getElementById('coin-counter');
const exitButton = document.getElementById('exit');
const timerElement = document.getElementById('timer');
const endMenu = document.createElement('div'); // Создаем элемент для меню
let earnedCoins = 0;
const objectFallInterval = 400; // Увеличен интервал спавна объектов (скорость спавна уменьшена)

// Массив объектов с значением 1 для каждой монеты и -10 для бомбы
const objects = [
    { src: '../image/blummedium.jpg', value: 1 },
    { src: '../image/blummedium.jpg', value: 1 },
    { src: '../image/blummedium.jpg', value: 1 },
    { src: '../image/blummedium.jpg', value: 1 }, // Добавляем больше монет для уменьшения шанса спавна бомбы
    { src: '../image/bomb.jpg', value: -10 }
];

// Добавляем слушатель для кнопки выхода
exitButton.addEventListener('click', () => {
    addCoinsAndExit();
});

// Функция добавления монет и возврат в главное меню

// Функция создания падающего объекта
function createFallingObject() {
    const objectData = objects[Math.floor(Math.random() * objects.length)];
    const object = document.createElement('img');
    object.src = objectData.src;
    object.classList.add('falling-object');
    object.style.left = `${Math.random() * 90}vw`; // Случайная горизонтальная позиция
    object.style.top = `-50px`; // Начало выше игрового поля
    object.value = objectData.value;

    // Убедимся, что каждый клик по объекту будет корректно обработан
    object.addEventListener('mousedown', () => {
        earnedCoins += object.value;
        if (earnedCoins < 0) earnedCoins = 0;
        coinCounter.textContent = earnedCoins;
        object.remove();

        // Проверка, остались ли еще монеты на экране
        if (document.querySelectorAll('.falling-object').length === 0) {
            endGameMenu(); // Показать меню, если все объекты собраны или исчезли
        }
    });

    gameArea.appendChild(object);
    animateFallingObject(object);
}

// Анимация падающего объекта
function animateFallingObject(object) {
    let top = -50; // Начало выше игрового поля
    const fallSpeed = Math.random() * 2 + 2; // Случайная скорость падения

    function fall() {
        if (top < window.innerHeight) {
            top += fallSpeed;
            object.style.top = `${top}px`;
            requestAnimationFrame(fall);
        } else {
            object.remove(); // Удаляем объект, когда он выходит за пределы экрана

            // Проверка, остались ли еще монеты на экране
            if (document.querySelectorAll('.falling-object').length === 0) {
                endGameMenu(); // Показать меню, если все объекты собраны или исчезли
            }
        }
    }

    fall();
}

// Функция запуска игры
function startGame() {
    // Инициализация таймера
    timerElement.textContent = `0:30`;
    timerElement.style.backgroundColor = 'rgb(0, 170, 255)'; // Синий цвет

    // Интервал падения объектов
    const gameInterval = setInterval(createFallingObject, objectFallInterval);
    let timeLeft = 30; // Конвертация в секунды

    // Интервал для таймера
    const timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Изменение цвета таймера в зависимости от оставшегося времени
        if (timeLeft <= 5) {
            timerElement.style.backgroundColor = 'rgb(255, 0, 0)'; // Красный
        } else if (timeLeft <= 15) {
            timerElement.style.backgroundColor = 'rgb(255, 153, 0)'; // Желтый
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGameMenu(); // Показать меню по завершению времени
        }
    }, 1000);

    // Завершение игры по окончанию времени
    setTimeout(() => {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        endGameMenu(); // Показать меню после завершения времени
    }, gameDuration);
}

// Функция отображения конечного меню
function endGameMenu() {
    // Очистка игрового поля
    gameArea.removeChild(gameArea.firstChild);

    // Создание меню
    endMenu.id = 'end-menu';
    endMenu.innerHTML = `
        <div id="end-menu-content">
            <p>Вы получили ${earnedCoins} монет</p>
            <button id="collect-coins-button">Забрать</button>
        </div>
    `;
    gameArea.appendChild(endMenu);
        // Слушатель для кнопки "Забрать"
    document.getElementById('collect-coins-button').addEventListener('click', () => {
    const savedGameState = localStorage.getItem('gameState');
    let gameState = savedGameState ? JSON.parse(savedGameState) : null;

    localStorage.setItem('earnedCoins', earnedCoins);
    

    window.location.href = '../index.html'; // Возвращаемся в главное меню
    });
}

startGame();