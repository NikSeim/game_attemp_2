document.addEventListener('DOMContentLoaded', () => {
    initializeShopEventHandlers(); // Инициализация обработчиков событий при загрузке вкладки
});

function initializeShopEventHandlers() {
    const modal = document.getElementById('shop-modal');
    const modalImg = document.getElementById('shop-modal-image');
    const closeModal = document.querySelector('.shop-close');
    const buyButton = document.getElementById('shop-buy-button');
    const tokenCountElement = document.getElementById('token-count');
    const resetPurchasesButton = document.getElementById('reset-purchases-button');
    let toggleButton = null;
    let currentItemID = null;
    const firstItemID = 'item1';

    if (tokenCountElement) {
        tokenCountElement.textContent = globalCoins.toLocaleString();
    }

    document.querySelectorAll('.market-item').forEach((item) => {
        item.addEventListener('click', function () {
            currentItemID = this.getAttribute('data-item-id');
            const imgSrc = this.querySelector('img').src;

            modalImg.src = imgSrc;
            document.getElementById('shop-column1').textContent = this.getAttribute('data-name1');
            document.getElementById('shop-column2').textContent = this.getAttribute('data-name2');
            document.getElementById('shop-column3').textContent = this.getAttribute('data-name3');
            document.getElementById('shop-column4').textContent = this.getAttribute('data-name4');

            const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
            let itemState = purchasedItems[currentItemID]?.state || null;

            const price = purchasedItems[currentItemID]?.originalPrice || this.querySelector('.price').textContent;
            modal.querySelector('.shop-price').textContent = price;

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

    closeModal.addEventListener('click', function () {
        modal.style.display = "none";
        currentItemID = null;
    });

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            currentItemID = null;
        }
    });

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

    resetPurchasesButton.addEventListener('click', function () {
        localStorage.removeItem('purchasedItems');
        globalCoins = 10000;
        updateTokenCount();
        saveGameState();
        alert('Покупки и баланс сброшены!');
        location.reload();
    });

    function purchaseItem(itemID) {
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        purchasedItems[itemID] = { state: 'activated' };
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    }

    function activateItem(itemID) {
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

        for (let id in purchasedItems) {
            if (id !== itemID && purchasedItems[id].state === 'activated') {
                purchasedItems[id].state = 'deactivated';
                const itemElement = document.querySelector(`.market-item[data-item-id="${id}"]`);
                if (itemElement) {
                    itemElement.classList.remove('active');
                }
            }
        }

        purchasedItems[itemID].state = 'activated';
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

        updateActiveItemsUI();
        showToggleButton('activated');
    }

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

    function hideToggleButton() {
        if (toggleButton) {
            toggleButton.style.display = 'none';
        }
    }

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

    function updateTokenCount() {
        if (tokenCountElement) {
            tokenCountElement.textContent = globalCoins.toLocaleString();
        }
    }

    function saveGameState() {
        localStorage.setItem('globalCoins', globalCoins);
    }

    function loadGameState() {
        globalCoins = parseInt(localStorage.getItem('globalCoins')) || 10000;
        updateTokenCount();

        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

        if (!purchasedItems[firstItemID]) {
            purchaseItem(firstItemID);
            activateItem(firstItemID);
        } else if (purchasedItems[firstItemID].state !== 'activated') {
            activateItem(firstItemID);
        }

        updateActiveItemsUI();

        const activeItemID = Object.keys(purchasedItems).find(id => purchasedItems[id].state === 'activated');
        if (activeItemID) {
            currentItemID = activeItemID;
            showToggleButton('activated');
        }
    }

    document.addEventListener('DOMContentLoaded', loadGameState);
}
