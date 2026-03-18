// nav-name-reveal.js — Apply OMAR, THE CREATIVE unlock on all sub-pages
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyNavReveal);
    } else {
        applyNavReveal();
    }
})();
