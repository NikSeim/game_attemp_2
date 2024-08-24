document.addEventListener('DOMContentLoaded', function() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            localStorage.setItem('removeTrader', 'true'); // Установим флаг для удаления торговца
            window.location.href = '/game_attemp0_2-main123/index.html'; // Возвращаемся на index.html
        });
    }
});
