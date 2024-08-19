// Дополнительный функционал для вкладки Tasks

document.querySelectorAll('.claim-button').forEach(button => {
    button.addEventListener('click', () => {
        alert('Task claimed!');
    });
});
