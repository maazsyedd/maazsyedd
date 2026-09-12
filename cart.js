document.addEventListener('DOMContentLoaded', () => {
    // The site's product images were migrated from .png to .jpg. Carts saved
    // in localStorage before that migration still point at the old .png
    // filenames, which no longer exist on disk (broken icon in the cart).
    // Since every image was renamed 1:1 with the same base filename, we can
    // self-heal any leftover .png reference by simply swapping the
    // extension, and persist the fix back so it only has to happen once.
    function migrateLegacyImagePaths(cart) {
        let changed = false;
        cart.forEach(item => {
            if (item.image && /\.png$/i.test(item.image)) {
                item.image = item.image.replace(/\.png$/i, '.jpg');
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        return cart;
    }

    // ------------------------------------------------------------------
    // Cart drawer - injected once per page so every page (not just
    // cart.html/checkout.html) gets the same slide-out cart.
    // ------------------------------------------------------------------
    function ensureCartDrawer() {
        if (document.getElementById('cart-drawer')) return;

        const overlay = document.createElement('div');
        overlay.className = 'cart-drawer-overlay';
        overlay.id = 'cart-drawer-overlay';

        const drawer = document.createElement('aside');
        drawer.className = 'cart-drawer';
        drawer.id = 'cart-drawer';
        drawer.setAttribute('aria-hidden', 'true');
        drawer.innerHTML = `
            <div class="cart-drawer-header">
                <h2>Cart</h2>
                <span class="cart-drawer-count" id="cart-drawer-count">0</span>
                <button type="button" class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">&times;</button>
            </div>
            <div class="cart-drawer-body"></div>
            <div class="cart-drawer-footer">
                <div class="total-amount">
                    <p>Estimated total</p>
                    <p class="price">$0.00</p>
                </div>
                <div class="checkout-btn-container"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        overlay.addEventListener('click', closeCartDrawer);
        document.getElementById('cart-drawer-close').addEventListener('click', closeCartDrawer);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeCartDrawer();
        });
    }

    function openCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-drawer-overlay');
        if (!drawer || !overlay) return;
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cart-drawer-locked');
    }

    function closeCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-drawer-overlay');
        if (!drawer || !overlay) return;
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-drawer-locked');
    }

    // ------------------------------------------------------------------
    // Rendering - shared between the full cart/checkout page panels
    // (.order-summary) and the drawer's item list (.cart-drawer-body).
    // ------------------------------------------------------------------
    function buildCartItemRowHTML(item) {
        const imageSrc = item.image.startsWith('assets/') ? item.image : `assets/${item.image}`;

        return `
            <div class="product-thumb">
                <img src="${imageSrc}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.style.visibility='hidden';">
                <span class="quantity-badge">${item.quantity}</span>
            </div>
            <div class="product-info">
                <h1>${item.name}</h1>
                <div class="quantity-controls">
                    <button class="decrease" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}><i class="fa-solid fa-square-minus"></i></button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="increase" data-id="${item.id}"><i class="fa-solid fa-square-plus"></i></button>
                    <button class="remove-item" data-id="${item.id}" aria-label="Remove ${item.name} from cart"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <p class="line-price">$${(item.price * item.quantity).toFixed(2)}</p>
        `;
    }

    function renderItemsIntoPanel(panel, cart) {
        const existingContainer = panel.querySelector('.product-summary-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const productSummaryContainer = document.createElement('div');
        productSummaryContainer.classList.add('product-summary-container');

        cart.forEach(item => {
            const productSummary = document.createElement('div');
            productSummary.classList.add('product-summary');
            productSummary.dataset.id = item.id;
            productSummary.innerHTML = buildCartItemRowHTML(item);
            productSummaryContainer.appendChild(productSummary);
        });

        // On the full cart/checkout page, items sit above a .total-amount
        // sibling within the same panel. The drawer's item list has no such
        // sibling (its total lives in a separate footer), so it just appends.
        const totalAnchor = panel.querySelector('.total-amount');
        if (totalAnchor) {
            panel.insertBefore(productSummaryContainer, totalAnchor);
        } else {
            panel.appendChild(productSummaryContainer);
        }
    }

    // Renders the "Checkout" button (or the empty-cart state) into every
    // matching container - the cart page's own container and the drawer's.
    function updateCheckoutButtonState(cart) {
        document.querySelectorAll('.checkout-btn-container').forEach(container => {
            container.innerHTML = '';

            if (cart.length > 0) {
                const checkoutButton = document.createElement('a');
                checkoutButton.href = 'checkout.html';
                checkoutButton.innerHTML = `
                    <button class="checkout-btn">Checkout</button>
                `;
                container.appendChild(checkoutButton);
            } else {
                const greyedOutButton = document.createElement('div');
                greyedOutButton.innerHTML = `
                    <a><button class="greyed-checkout-btn">Checkout</button></a>
                    <p class="empty-cart-message">
                        Your cart is empty, go to
                        <a class="store-link" href="store.html">Store</a> to add items!
                    </p>
                `;
                container.appendChild(greyedOutButton);
            }
        });
    }

    function updateCartBadge(cart) {
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

        document.querySelectorAll('.cart-count').forEach(badge => {
            badge.textContent = totalQuantity;
            badge.hidden = totalQuantity === 0;
        });

        const drawerCount = document.getElementById('cart-drawer-count');
        if (drawerCount) {
            drawerCount.textContent = totalQuantity;
        }
    }

    // The single entry point that keeps everything in sync: the full cart
    // page panel (if present), the checkout page's order summary (if
    // present), the drawer, and the header badge.
    function refreshCart() {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = migrateLegacyImagePaths(cart);

        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        document.querySelectorAll('.order-summary, .cart-drawer-body').forEach(panel => {
            renderItemsIntoPanel(panel, cart);
        });

        document.querySelectorAll('.total-amount .price').forEach(el => {
            el.textContent = `$${totalAmount.toFixed(2)}`;
        });

        // Rebuilding the rows above destroys and recreates every button, so
        // listeners are (re)attached globally afterwards rather than per
        // panel - there's nothing stale left to double-bind to.
        document.querySelectorAll('.decrease').forEach(button => {
            button.addEventListener('click', () => updateQuantity(button.dataset.id, -1));
        });
        document.querySelectorAll('.increase').forEach(button => {
            button.addEventListener('click', () => updateQuantity(button.dataset.id, 1));
        });
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => removeItem(button.dataset.id));
        });

        updateCheckoutButtonState(cart);
        updateCartBadge(cart);
    }

    // Function to update the cart item quantity
    function updateQuantity(productId, change) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const productIndex = cart.findIndex(item => item.id === productId);

        if (productIndex >= 0) {
            const newQuantity = cart[productIndex].quantity + change;

            // Quantity can never drop below 1 here - deleting the item
            // entirely is handled separately by the trash icon.
            if (newQuantity < 1) return;

            cart[productIndex].quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            refreshCart();
        }
    }

    // Function to remove an item from the cart entirely, regardless of quantity
    function removeItem(productId) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        refreshCart();
    }

    // ------------------------------------------------------------------
    // Add to cart - checkmark on the button + the product image flying
    // into the header cart icon, instead of redirecting to cart.html.
    // ------------------------------------------------------------------
    function showAddedState(button) {
        if (button.dataset.originalLabel === undefined) {
            button.dataset.originalLabel = button.textContent;
        }
        const original = button.dataset.originalLabel;

        button.classList.add('is-added');
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Added to cart';

        setTimeout(() => {
            button.classList.remove('is-added');
            button.disabled = false;
            button.textContent = original;
        }, 1400);
    }

    function flyToCart(sourceEl, targetEl) {
        if (!sourceEl || !targetEl) return;

        const startRect = sourceEl.getBoundingClientRect();
        const endRect = targetEl.getBoundingClientRect();
        if (startRect.width === 0 || startRect.height === 0) return;

        const flyer = document.createElement('img');
        flyer.src = sourceEl.currentSrc || sourceEl.src;
        flyer.className = 'cart-fly-image';
        flyer.style.width = `${startRect.width}px`;
        flyer.style.height = `${startRect.height}px`;
        flyer.style.left = `${startRect.left}px`;
        flyer.style.top = `${startRect.top}px`;
        flyer.style.opacity = '1';
        document.body.appendChild(flyer);

        const endX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
        const endY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

        // Double rAF: let the browser paint the flyer at its start position
        // first, otherwise it can collapse the start/end styles into one
        // frame and skip the transition entirely.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                flyer.style.transform = `translate(${endX}px, ${endY}px) scale(0.12)`;
                flyer.style.opacity = '0.3';
            });
        });

        let didCleanup = false;
        const cleanup = () => {
            if (didCleanup) return;
            didCleanup = true;
            clearTimeout(safetyTimeout);
            flyer.remove();
            targetEl.classList.add('cart-icon-bump');
            setTimeout(() => targetEl.classList.remove('cart-icon-bump'), 350);
        };

        flyer.addEventListener('transitionend', cleanup, { once: true });
        const safetyTimeout = setTimeout(cleanup, 1000); // in case transitionend never fires
    }

    function addToCart(event) {
        event.preventDefault();

        const button = event.currentTarget;
        const productId = button.dataset.id;
        const productName = button.dataset.name;
        const productPrice = parseFloat(button.dataset.price);
        const productImage = button.dataset.image;

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        showAddedState(button);
        flyToCart(document.querySelector('.product-image img'), document.getElementById('cart-icon-link'));

        refreshCart();
        openCartDrawer();
    }

    // ------------------------------------------------------------------
    // Wiring
    // ------------------------------------------------------------------
    ensureCartDrawer();

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', addToCart);
    });

    const cartIconLink = document.getElementById('cart-icon-link');
    if (cartIconLink) {
        cartIconLink.addEventListener('click', (event) => {
            event.preventDefault();
            openCartDrawer();
        });
    }

    refreshCart();
});
