document.addEventListener('DOMContentLoaded', () => {
    initializeShopEventHandlers();
});

function initializeShopEventHandlers() {
    const marketWrapper = document.getElementById('market-wrapper');
    const modal = document.getElementById('shop-modal');
    const modalImg = document.getElementById('shop-modal-image');
    const closeModal = document.querySelector('.shop-close');
    const buyButton = document.getElementById('shop-buy-button');
    const resetPurchasesButton = document.getElementById('reset-purchases-button');
    let toggleButton = null;
    let currentItemID = null;

    // Обработчик для каждого элемента магазина
    document.querySelectorAll('.market-item').forEach((item) => {
        item.addEventListener('click', function () {

            const imgElement = this.querySelector('img');
            const imgSrc = imgElement ? imgElement.getAttribute('src') : null;
            const grassSrc = this.getAttribute('data-grass');
            const itemID = this.getAttribute('data-item-id');   
            const miniGameBgSrc = this.getAttribute('data-minigame-background'); // Новый атрибут

            // Сохранение выбора
            if (imgSrc && grassSrc && miniGameBgSrc) {
                // Сохраняем выбранные фон, траву и фон мини-игры в localStorage
                localStorage.setItem('selectedBackgroundPending', imgSrc);
                localStorage.setItem('selectedGrassPending', grassSrc);
                localStorage.setItem('selectedMiniGameBackgroundPending', miniGameBgSrc);
                localStorage.setItem('hasPendingSelection', 'true');
            } else {
                console.error("Ошибка: Элемент <img>, атрибут src, grass или miniGameBg отсутствуют.");
            }

            currentItemID = this.getAttribute('data-item-id');

            // Обновляем модальное окно с информацией
            modalImg.src = imgSrc;
            document.getElementById('shop-column1').textContent = this.getAttribute('data-name1');
            document.getElementById('shop-column2').textContent = this.getAttribute('data-name2');
            document.getElementById('shop-column3').textContent = this.getAttribute('data-name3');
            document.getElementById('shop-column4').textContent = this.getAttribute('data-name4');

            const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
            let itemState = purchasedItems[currentItemID]?.state || null;

            const priceText = this.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            modal.querySelector('.shop-price').textContent = priceText;

            if (itemState === 'activated') {
                showToggleButton('activated');
                buyButton.style.display = 'none';
            } else if (itemState === 'deactivated') {
                showToggleButton('deactivated');
                buyButton.style.display = 'none';
            } else {
                buyButton.style.display = 'block';
                hideToggleButton();

                if (globalCoins >= price) {
                    buyButton.disabled = false;
                } else {
                    buyButton.disabled = true;
                }
            }

            // Сохраняем выбранную карту в localStorage
            saveSelectedCard(this.getAttribute('data-item-id'), imgSrc, grassSrc, miniGameBgSrc);
            modal.style.display = "block";
        });
    });

    // Закрытие модального окна
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

    // Покупка товара
    buyButton.addEventListener('click', function () {
        const priceText = modal.querySelector('.shop-price').textContent;
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

    // Сброс покупок
    resetPurchasesButton.addEventListener('click', function () {
        localStorage.removeItem('purchasedItems');
        globalCoins = 10000;
        updateTokenCount();
        saveGameState();
        alert('Покупки и баланс сброшены!');
        location.reload();
    });

    // Покупка товара
    function purchaseItem(itemID) {
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        purchasedItems[itemID] = { state: 'activated' };
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    }

    // Активация товара
    function activateItem(itemID) {
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        
        for (let id in purchasedItems) {
            if (id !== itemID && purchasedItems[id].state === 'activated') {
                purchasedItems[id].state = 'deactivated';
            }
        }
        
        purchasedItems[itemID].state = 'activated';
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
        localStorage.setItem('lastActiveItemID', itemID);
        
        // Сохраняем фон для мини-игр
        const miniGameBackgroundSrc = document.querySelector(`.market-item[data-item-id="${itemID}"]`).getAttribute('data-minigame-background');
        localStorage.setItem('selectedMiniGameBackground', miniGameBackgroundSrc);
    
        updateActiveItemsUI();
    }
    

    // Показ кнопки переключения состояния товара
    function showToggleButton(state) {
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.id = 'shop-toggle-button';
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

    // Скрытие кнопки переключения состояния товара
    function hideToggleButton() {
        if (toggleButton) {
            toggleButton.style.display = 'none';
        }
    }

    // Переключение состояния товара (активация/деактивация)
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
                        itemElement.classList.remove('active');
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

    // Обновление UI активных товаров
    function updateActiveItemsUI() {
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
    
        document.querySelectorAll('.market-item').forEach(item => {
            const itemID = item.getAttribute('data-item-id');
            if (purchasedItems[itemID] && purchasedItems[itemID].state === 'activated') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Сохранение выбранной карты в localStorage, без немедленного применения
    function saveSelectedCard(itemID, imgSrc, grassSrc, miniGameBgSrc) {
        const selectedCard = {
            itemID,
            imgSrc,
            grassSrc,
            miniGameBgSrc  // Добавляем фон мини-игры в сохраненные данные
        };
        localStorage.setItem('selectedCard', JSON.stringify(selectedCard));
    }

    // Загрузка и обновление состояния игры
    function loadGameState() {
        globalCoins = parseInt(localStorage.getItem('globalCoins')) || 10000;
        updateTokenCount();
    
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
    
        updateActiveItemsUI();
    
        let activeItemID = Object.keys(purchasedItems).find(id => purchasedItems[id].state === 'activated');
        
        // Если активного элемента нет, ищем последний активный элемент
        if (!activeItemID) {
            const lastActiveItemID = localStorage.getItem('lastActiveItemID');
            if (lastActiveItemID && purchasedItems[lastActiveItemID]) {
                activeItemID = lastActiveItemID;
    
                // Восстанавливаем фон, траву и фон мини-игры для последнего активного элемента
                const imgSrc = document.querySelector(`.market-item[data-item-id="${lastActiveItemID}"] img`).src;
                const grassSrc = document.querySelector(`.market-item[data-item-id="${lastActiveItemID}"]`).getAttribute('data-grass');
                const miniGameBgSrc = document.querySelector(`.market-item[data-item-id="${lastActiveItemID}"]`).getAttribute('data-minigame-background');
                
                // Сохраняем и активируем этот элемент
                purchaseItem(activeItemID);
                activateItem(activeItemID);
    
                // Сохраняем выбранную карту
                saveSelectedCard(activeItemID, imgSrc, grassSrc, miniGameBgSrc);
            } else {
                // Если последнего активного элемента нет, активируем первый элемент
                const firstItemElement = document.querySelector('.market-item');
                if (firstItemElement) {
                    const firstItemID = firstItemElement.getAttribute('data-item-id');
                    activeItemID = firstItemID;
            
                    const imgSrc = firstItemElement.querySelector('img').src;
                    const grassSrc = firstItemElement.getAttribute('data-grass');
                    const miniGameBgSrc = firstItemElement.getAttribute('data-minigame-background');
            
                    // Сохраняем первый элемент как активный в localStorage
                    purchaseItem(firstItemID);
                    activateItem(firstItemID);
            
                    // Сохраняем выбранную карту
                    saveSelectedCard(firstItemID, imgSrc, grassSrc, miniGameBgSrc);
                }
            }
        } else {
            // Если активный элемент найден, обновляем UI и сохраняем выбранную карту
            currentItemID = activeItemID;
            const imgSrc = document.querySelector(`.market-item[data-item-id="${activeItemID}"] img`).src;
            const grassSrc = document.querySelector(`.market-item[data-item-id="${activeItemID}"]`).getAttribute('data-grass');
            const miniGameBgSrc = document.querySelector(`.market-item[data-item-id="${activeItemID}"]`).getAttribute('data-minigame-background');
            
            saveSelectedCard(activeItemID, imgSrc, grassSrc, miniGameBgSrc);
            showToggleButton('activated');
        }
    }

    loadGameState();
}
