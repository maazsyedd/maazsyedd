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

// Hide the sticky navbar after 2 seconds of continuous downward scrolling,
// or after 3 seconds of no activity at all, and bring it back the moment
// the user scrolls up (or returns to the top). A pause in scrolling resets
// the 2-second countdown.
(function () {
    const header = document.querySelector('.header');
    const bar = header && header.parentElement;
    if (!bar) return;

    const HIDE_AFTER_MS = 2000;
    const IDLE_RESET_MS = 1500;
    const INACTIVE_HIDE_MS = 3000;

    let lastY = window.scrollY;
    let idleTimer = null;
    let hideTimer = null;
    let inactiveTimer = null;

    // Stays up at the very top of the page, and while the user is pointing
    // at or tabbed into the bar.
    function hideIfIdle() {
        if (window.scrollY <= header.offsetHeight) return;
        if (header.matches(':hover') || header.contains(document.activeElement)) return;
        bar.classList.add('nav-hidden');
    }

    function restartInactivityTimer() {
        clearTimeout(inactiveTimer);
        inactiveTimer = setTimeout(hideIfIdle, INACTIVE_HIDE_MS);
    }

    ['scroll', 'mousemove', 'keydown', 'pointerdown', 'touchstart'].forEach((type) => {
        window.addEventListener(type, restartInactivityTimer, { passive: true });
    });
    restartInactivityTimer();

    // Lets the CSS slide the bar up by exactly its own height, leaving the
    // watermark underneath it in view.
    function measure() {
        bar.style.setProperty('--nav-shift', header.offsetHeight + 'px');
    }
    measure();
    window.addEventListener('resize', measure);

    function show() {
        bar.classList.remove('nav-hidden');
    }

    function resetCountdown() {
        clearTimeout(hideTimer);
        hideTimer = null;
    }

    window.addEventListener('scroll', () => {
        const y = window.scrollY;

        if (y < lastY || y <= header.offsetHeight) {
            resetCountdown();
            show();
        } else if (y > lastY && hideTimer === null) {
            hideTimer = setTimeout(() => bar.classList.add('nav-hidden'), HIDE_AFTER_MS);
        }

        lastY = y;

        clearTimeout(idleTimer);
        idleTimer = setTimeout(resetCountdown, IDLE_RESET_MS);
    }, { passive: true });
})();

// Light deterrent against saving artwork: blocks the right-click menu and
// drag-to-desktop on images. Delegated on document so images added later
// (e.g. the cart drawer) are covered too.
['contextmenu', 'dragstart'].forEach((type) => {
    document.addEventListener(type, (event) => {
        if (event.target instanceof HTMLImageElement) {
            event.preventDefault();
        }
    });
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