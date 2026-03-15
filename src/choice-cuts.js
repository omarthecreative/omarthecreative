document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const lessonRows = document.querySelectorAll('.lesson-row');

    // Filtering logic
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            // Update button active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter rows
            lessonRows.forEach(row => {
                const categories = row.getAttribute('data-category').split(' ');
                if (filter === 'all' || categories.includes(filter)) {
                    row.style.display = 'grid';
                    setTimeout(() => { row.style.opacity = '1'; }, 10);
                } else {
                    row.style.opacity = '0';
                    setTimeout(() => { row.style.display = 'none'; }, 300);
                }
            });
        });
    });

    // Navigation logic
    lessonRows.forEach(row => {
        row.addEventListener('click', () => {
            const url = row.getAttribute('data-project-url');
            if (url) {
                // Tracking
                const viewed = JSON.parse(localStorage.getItem('omar_viewed') || '[]');
                if (!viewed.includes('deep-cut')) {
                    viewed.push('deep-cut');
                    localStorage.setItem('omar_viewed', JSON.stringify(viewed));
                }
                window.location.href = url;
            }
        });
    });

    // Global Escape to return home
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.location.href = 'index.html';
        }
    });
});
