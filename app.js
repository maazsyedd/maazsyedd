// IntersectionObserver instance. The observer watches for changes in the intersection 
// of a target element.
// The callback function gets executed when the visibility of any observed element changes.

const observer = new IntersectionObserver((entries) => {
    // The callback function receives an array of IntersectionObserverEntry objects (entries).
    // Each entry represents an observed element and its intersection status.

    // Loop through each entry (observed element).
    entries.forEach((entry) => { 
        // Log the entry to the console for debugging purposes.
        console.log(entry);

        // Check if the element is currently intersecting (visible in the viewport).
        if (entry.isIntersecting) {
            // If the element is intersecting, add the 'show' class to it.
            // This class can be used to apply CSS transitions or animations.
            entry.target.classList.add('show');
        } else {
            // If the element is not intersecting, remove the 'show' class.
            // This ensures the element returns to its default state when it's out of view.
            entry.target.classList.remove('show');
        }
    });
});

// Checks for elements with the class 'hidden'
document.querySelectorAll('.hidden').forEach((element) => {
    observer.observe(element);
});

const yearElement = document.getElementById('year');
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Light/dark mode toggle.
// The theme is stored in localStorage under the 'theme' key so every page
// (and every open tab) stays in sync. A tiny inline script in each <head>
// already applies the saved theme before first paint to avoid a flash of
// the wrong theme; this just wires up the switch itself.
(function () {
    const root = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Falls back to the system preference the first time a visitor shows up
    // with nothing saved yet, otherwise defaults to the site's dark theme.
    function getStoredTheme() {
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') return saved;
        } catch (e) {}
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }

    let currentTheme = getStoredTheme();
    applyTheme(currentTheme);

    toggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        try {
            localStorage.setItem('theme', currentTheme);
        } catch (e) {}
    });

    // Keep every other open tab/page in sync the moment the theme changes.
    window.addEventListener('storage', (event) => {
        if (event.key === 'theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
            currentTheme = event.newValue;
            applyTheme(currentTheme);
        }
    });
})();