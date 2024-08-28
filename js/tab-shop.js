// Находим элементы на странице
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-image');
const closeModal = document.getElementsByClassName('close')[0];
const buyButton = document.getElementById('buy-button');
const tokenCountElement = document.getElementById('token-count');
const resetPurchasesButton = document.getElementById('reset-purchases-button');
let toggleButton = null; // Кнопка для активации/деактивации
let currentItemID = null; // Текущий ID предмета
const firstItemID = 'item1'; // ID первого объекта

// Обновление отображения количества монет при загрузке страницы
if (tokenCountElement) {
    tokenCountElement.textContent = globalCoins.toLocaleString();
}

// Функция для открытия модального окна
document.querySelectorAll('.market-item').forEach((item) => {
    item.addEventListener('click', function () {
        currentItemID = this.getAttribute('data-item-id');
        const imgSrc = this.querySelector('img').src;

        modalImg.src = imgSrc;
        document.getElementById('column1').textContent = this.getAttribute('data-name1');
        document.getElementById('column2').textContent = this.getAttribute('data-name2');
        document.getElementById('column3').textContent = this.getAttribute('data-name3');
        document.getElementById('column4').textContent = this.getAttribute('data-name4');

        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        let itemState = purchasedItems[currentItemID]?.state || null;

        // Показываем оригинальную цену в модальном окне
        const price = purchasedItems[currentItemID]?.originalPrice || this.querySelector('.price').textContent;
        modal.querySelector('.price').textContent = price;

        // Отображаем toggleButton для всех объектов после покупки, включая первый
        if (itemState === 'activated') {
            showToggleButton('activated');
            buyButton.style.display = 'none';
        } else if (itemState === 'deactivated') {
            showToggleButton('deactivated');
            buyButton.style.display = 'none';
        } else {
            buyButton.style.display = 'block';
            hideToggleButton();
        }

        modal.style.display = "block";
    });
});

// Функция для закрытия модального окна
closeModal.addEventListener('click', function () {
    modal.style.display = "none";
    currentItemID = null;
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
        currentItemID = null;
    }
});

// Обработчик клика по кнопке "Купить"
buyButton.addEventListener('click', function () {
    const priceText = modal.querySelector('.price').textContent;
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

    if (globalCoins >= price || price === 0) {
        globalCoins -= price;
        updateTokenCount();
        saveGameState();

        purchaseItem(currentItemID);
        activateItem(currentItemID);
        buyButton.style.display = 'none';
        showToggleButton('activated');
    }
});

// Функция для покупки предмета
function purchaseItem(itemID) {
    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
    purchasedItems[itemID] = { state: 'activated' };
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
}

// Функция для активации предмета
function activateItem(itemID) {
    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

    // Деактивируем все другие элементы
    for (let id in purchasedItems) {
        if (id !== itemID && purchasedItems[id].state === 'activated') {
            purchasedItems[id].state = 'deactivated';
            const itemElement = document.querySelector(`.market-item[data-item-id="${id}"]`);
            if (itemElement) {
                itemElement.classList.remove('active'); // Убираем зеленую окантовку
            }
        }
    }

    // Активируем выбранный элемент
    purchasedItems[itemID].state = 'activated';
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

    updateActiveItemsUI();
    showToggleButton('activated');
}

// Функция для отображения toggleButton с соответствующим состоянием
function showToggleButton(state) {
    if (!toggleButton) {
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-button';
        toggleButton.style.width = '100%';
        toggleButton.style.marginTop = '20px';
        buyButton.parentNode.insertBefore(toggleButton, buyButton);
        toggleButton.addEventListener('click', toggleButtonState);
    }

    if (state === 'activated') {
        toggleButton.textContent = 'Деактивировать';
        toggleButton.style.backgroundColor = 'black';
        toggleButton.style.color = 'red';
        toggleButton.classList.add('active');
    } else {
        toggleButton.textContent = 'Активировать';
        toggleButton.style.backgroundColor = 'green';
        toggleButton.style.color = 'white';
        toggleButton.classList.remove('active');
    }

    toggleButton.style.display = 'block';
}

// Функция для скрытия toggleButton
function hideToggleButton() {
    if (toggleButton) {
        toggleButton.style.display = 'none';
    }
}

// Функция для переключения состояния toggleButton
function toggleButtonState() {
    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

    if (toggleButton.classList.contains('active')) {
        purchasedItems[currentItemID].state = 'deactivated';
        toggleButton.textContent = 'Активировать';
        toggleButton.style.backgroundColor = 'green';
        toggleButton.style.color = 'white';
        toggleButton.classList.remove('active');
    } else {
        for (let id in purchasedItems) {
            if (purchasedItems[id].state === 'activated') {
                purchasedItems[id].state = 'deactivated';
                const itemElement = document.querySelector(`.market-item[data-item-id="${id}"]`);
                if (itemElement) {
                    itemElement.classList.remove('active'); // Убираем зеленую окантовку
                }
            }
        }

        purchasedItems[currentItemID].state = 'activated';
        toggleButton.textContent = 'Деактивировать';
        toggleButton.style.backgroundColor = 'black';
        toggleButton.style.color = 'red';
        toggleButton.classList.add('active');
    }

    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    updateActiveItemsUI();
}

// Функция для сброса покупок
resetPurchasesButton.addEventListener('click', function () {
    localStorage.removeItem('purchasedItems');
    globalCoins = 10000;
    updateTokenCount();
    saveGameState();
    alert('Покупки и баланс сброшены!');
    location.reload();
});

// Функция для обновления отображения количества монет
function updateTokenCount() {
    if (tokenCountElement) {
        tokenCountElement.textContent = globalCoins.toLocaleString();
    }
}

// Функция для сохранения состояния игры
function saveGameState() {
    localStorage.setItem('globalCoins', globalCoins);
}

// Функция для загрузки состояния игры
function loadGameState() {
    globalCoins = parseInt(localStorage.getItem('globalCoins')) || 10000;
    updateTokenCount();

    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

    // Если первый объект не куплен, покупаем и активируем его автоматически
    if (!purchasedItems[firstItemID]) {
        purchaseItem(firstItemID); // Покупаем
        activateItem(firstItemID); // Активируем
    } else if (purchasedItems[firstItemID].state !== 'activated') {
        activateItem(firstItemID); // Если первый объект был деактивирован, активируем его
    }

    // Обновляем интерфейс с учетом активных предметов
    updateActiveItemsUI();

    // Если есть активный элемент, показываем кнопку toggle с соответствующим состоянием
    const activeItemID = Object.keys(purchasedItems).find(id => purchasedItems[id].state === 'activated');
    if (activeItemID) {
        currentItemID = activeItemID;
        showToggleButton('activated');
    }
}

// Функция для обновления окантовки у активных элементов
function updateActiveItemsUI() {
    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

    document.querySelectorAll('.market-item').forEach(item => {
        const itemID = item.getAttribute('data-item-id');
        if (purchasedItems[itemID] && purchasedItems[itemID].state === 'activated') {
            item.classList.add('active'); // Добавляем зеленую окантовку
        } else {
            item.classList.remove('active'); // Убираем зеленую окантовку
        }
    });
}

// Загрузка состояния игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
});
