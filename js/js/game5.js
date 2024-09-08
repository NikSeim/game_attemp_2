const bossHealthBar = document.querySelector('.boss-health-fill');
const playerHealthBar = document.querySelector('.player-health-fill');
const bossHealthTet = document.getElementById('boss-health-text');
const playerHealthText = document.getElementById('player-health-text');
const bossImage = document.querySelector('.boss-image');
const bossNameText = document.getElementById('boss-name-text');
const playerNameText = document.getElementById('player-name-text');

const hitSound = document.getElementById('hit-sound');
const blockSound = document.getElementById('block-sound');
const phaseSound = document.getElementById('phase-sound');
const counterHitSound = document.getElementById('counter-hit-sound');
const deathSound = document.getElementById('death-sound');

let bossHealth = 100;
let playerHealth = 100;
let isBossEnraged = false;
let currentZone = null;
let attackTimeout;
let lastZoneIndex = null;
let damageStacks = 0;  // Количество стаков урона

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




const phase1Zones = [
    { x: '44%', y: '19%' },
    { x: '47%', y: '42%' },
    { x: '61%', y: '32%' },
    { x: '29.5%', y: '47%' },
    { x: '37%', y: '62%' },
    { x: '57.9%', y: '57%' },
];

const phase2Zones = [
    { x: '43%', y: '20%' },
    { x: '42.7%', y: '32%' },
    { x: '30.4%', y: '50.5%' },
    { x: '42%', y: '50%' },
    { x: '37%', y: '66.6%' },
    { x: '49%', y: '66.6%' },
];

function createAttackZone(x, y) {
    if (currentZone) {
        currentZone.remove();
    }

    const zone = document.createElement('div');
    zone.classList.add('attack-zone');
    zone.classList.add(isBossEnraged ? 'phase-2' : 'phase-1');
    zone.style.left = x;
    zone.style.top = y;

    let zoneHits = 0;
    const requiredHits = 10;

    zone.addEventListener('click', () => {
        const damage = isBossEnraged ? 0.5 : 1; // Урон: 1 в первой фазе, 0.5 во второй фазе
        zoneHits += damage;
        bossHealth -= damage;
        updateBossHealth();

        if (zoneHits >= requiredHits) {
            clearTimeout(attackTimeout);
            blockSound.play();
            counterHitSound.play();
            zone.remove();
            currentZone = null;
            if (bossHealth > 0) {
                setTimeout(spawnAttackZones, 1000);
            }
        }
    });

    document.querySelector('.attack-zones').appendChild(zone);
    currentZone = zone;

    startAttackTimer(requiredHits - zoneHits);
}

function startAttackTimer(remainingHits) {
    clearTimeout(attackTimeout);
    const attackDuration = isBossEnraged ? 7000 : 4000;

    attackTimeout = setTimeout(() => {
        const additionalDamage = damageStacks * 5;  // Дополнительный урон за каждый стак
        playerHealth -= (10 + additionalDamage);  // Наносим основной урон плюс урон от стаков

        updatePlayerHealth();
        hitSound.play();

        if (playerHealth > 0) {
            damageStacks++;  // Увеличиваем количество стаков после урона
            if (remainingHits > 0) {
                startAttackTimer(remainingHits);  // Продолжаем атаку до тех пор, пока игрок не умрет или не успеет нанести 10 ударов
            } else if (bossHealth > 0) {
                setTimeout(spawnAttackZones, 1000); // Новая зона атаки
            }
        } else {
            playerHealth = 0;  // Устанавливаем значение здоровья в 0, если оно ниже 0
            updatePlayerHealth();
            showDefeatModal();  // Показываем окно поражения
        }
    }, attackDuration);
}

function updateBossHealth() {
    const healthPercentage = (bossHealth / 100) * 100;
    bossHealthBar.style.width = healthPercentage + '%';
    bossHealthText.textContent = `${Math.ceil(bossHealth)}/100`;

    if (bossHealth <= 0 && !isBossEnraged) {
        // Босс входит во вторую фазу (ярость)
        isBossEnraged = true;
        phaseSound.play();
        clearTimeout(attackTimeout);
        removeAttackZones();
        resetDamageStacks();

        bossImage.classList.add('boss-blink');
        bossNameText.classList.add('blink'); // Добавляем мигание имени
        setTimeout(() => {
            bossImage.classList.remove('boss-blink');
            bossImage.src = './image/angryboss.webp';
            bossImage.classList.add('boss-blink');
            bossNameText.textContent = 'Angry Boss Name'; // Смена имени на вторую фазу
            setTimeout(() => {
                bossImage.classList.remove('boss-blink');
                bossNameText.classList.remove('blink'); // Останавливаем мигание имени
                bossHealth = 50; // Восстановление здоровья на 50

                bossHealthBar.style.backgroundColor = 'rgb(162, 0, 143)';
                bossHealthBar.style.width = '50%';
                bossHealthText.textContent = `${Math.ceil(bossHealth)}/100`;

                setTimeout(spawnAttackZones, 1000);
            }, 1000); // Мигание нового изображения 1 секунда
        }, 1500); // Мигание старого изображения 1.5 секунды
    } else if (bossHealth <= 0 && isBossEnraged) {
        deathSound.play(); 
        grantVictory(); 
    }
}

function updatePlayerHealth() {
    const healthPercentage = (playerHealth / 100) * 100;
    playerHealthBar.style.width = healthPercentage + '%';
    playerHealthText.textContent = `${Math.ceil(playerHealth)}/100`;
}

function spawnAttackZones() {
    let randomIndex;

    do {
        randomIndex = Math.floor(Math.random() * (isBossEnraged ? phase2Zones : phase1Zones).length);
    } while (randomIndex === lastZoneIndex);

    lastZoneIndex = randomIndex;
    const { x, y } = isBossEnraged ? phase2Zones[randomIndex] : phase1Zones[randomIndex];
    createAttackZone(x, y);
}

function removeAttackZones() {
    const zones = document.querySelectorAll('.attack-zone');
    zones.forEach(zone => zone.remove());
}

function resetDamageStacks() {
    damageStacks = 0; // Сбрасываем стаки дополнительного урона
}

function grantVictory() {
    resetDamageStacks(); 

    let currentCoins = parseInt(localStorage.getItem('coins') || '0', 10);
    currentCoins += 200;
    localStorage.setItem('coins', currentCoins);

    showVictoryModal();
}

function showVictoryModal() {
    const modal = createModal('Вы победили! Но он еще вернется.', 'Забрать');
    document.body.appendChild(modal); 
}

function showDefeatModal() {
    const modal = createModal('Вы проиграли!', 'Выйти');
    document.body.appendChild(modal); 
}

function createModal(message, buttonText) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.zIndex = '100';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.textAlign = 'center';

    const modalText = document.createElement('h2');
    modalText.innerText = message;
    modalContent.appendChild(modalText);

    const actionButton = document.createElement('button');
    actionButton.innerText = buttonText;
    actionButton.style.backgroundColor = 'green';
    actionButton.style.color = 'white';
    actionButton.style.padding = '10px 20px';
    actionButton.style.border = 'none';
    actionButton.style.borderRadius = '5px';
    actionButton.style.fontSize = '16px';
    actionButton.style.cursor = 'pointer';

    actionButton.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    modalContent.appendChild(actionButton);
    modal.appendChild(modalContent);
    return modal;
}


// Запуск игры
spawnAttackZones();

document.querySelector('.close-button').addEventListener('click', () => {
    window.location.href = '../index.html';
});
