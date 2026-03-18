// nav-name-reveal.js — Nav name unlock + menu sound on all sub-pages
(function () {
    function applyNavReveal() {
        var el = document.querySelector('.nav-name');
        if (!el) return;
        if (el.dataset.revealApplied) return;
        el.dataset.revealApplied = 'true';

        var viewed = JSON.parse(localStorage.getItem('omar_viewed') || '[]');
        if (viewed.length === 0) return;

        el.textContent = 'OMAR, THE CREATIVE';
    }

    function wireMenuSound() {
        var trigger = document.querySelector('.menu-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', function () {
            if (window.ApexSound) {
                ApexSound.init();
                ApexSound.play('door');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyNavReveal();
            wireMenuSound();
        });
    } else {
        applyNavReveal();
        wireMenuSound();
    }
})();
