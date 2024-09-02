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