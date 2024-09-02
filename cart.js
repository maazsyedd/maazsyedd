document.addEventListener('DOMContentLoaded', () => {
    // Function to add item to the cart
    function addToCart(event) {
        event.preventDefault(); // Prevent the default button action
        
        const button = event.target;
        const productId = button.dataset.id;
        const productName = button.dataset.name;
        const productPrice = parseFloat(button.dataset.price);
        const productImage = button.dataset.image; // Capture the product image URL

        // Get existing cart items from localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Check if the item already exists in the cart
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex >= 0) {
            // If item already exists, increase the quantity by 1
            cart[existingItemIndex].quantity += 1;
        } else {
            // Otherwise, add the new item to the cart
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });
        }

        // Save the updated cart back to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Redirect to the cart page
        window.location.href = 'cart.html';
    }

    // Function to update the cart item quantity
    function updateQuantity(productId, change) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const productIndex = cart.findIndex(item => item.id === productId);

        if (productIndex >= 0) {
            cart[productIndex].quantity += change;

            // If the quantity is zero or less, remove the item from the cart
            if (cart[productIndex].quantity <= 0) {
                cart.splice(productIndex, 1);
            }

            // Save the updated cart back to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Refresh the display of cart items
            displayCartItems();
        }
    }

    // Function to display cart items on the cart page
    function displayCartItems() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const orderSummary = document.querySelector('.order-summary');

        if (!orderSummary) return; // Exit if we are not on the cart page

        // Clear previous cart display
        const existingContainer = orderSummary.querySelector('.product-summary-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create a new container for product summaries
        const productSummaryContainer = document.createElement('div');
        productSummaryContainer.classList.add('product-summary-container');
        let totalAmount = 0;

        cart.forEach(item => {
            const productSummary = document.createElement('div');
            productSummary.classList.add('product-summary');
            productSummary.dataset.id = item.id; // Add a data-id attribute for reference

            productSummary.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="product-details">
                    <h1>${item.name}</h1>
                    <p class="price">$${(item.price * item.quantity).toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="decrease" data-id="${item.id}"><i class="fa-solid fa-square-minus"></i></button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase" data-id="${item.id}"><i class="fa-solid fa-square-plus"></i></button>
                    </div>
                </div>
            `;

            productSummaryContainer.appendChild(productSummary);

            totalAmount += item.price * item.quantity;
        });

        // Append the product summaries to the order summary section
        orderSummary.insertBefore(productSummaryContainer, orderSummary.querySelector('.total-amount'));

        // Update the total amount
        const totalPriceElement = orderSummary.querySelector('.total-amount .price');
        totalPriceElement.textContent = `$${totalAmount.toFixed(2)}`;

        // Attach event listeners to the increase and decrease buttons
        document.querySelectorAll('.decrease').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                updateQuantity(productId, -1);
            });
        });

        document.querySelectorAll('.increase').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                updateQuantity(productId, 1);
            });
        });

        // Call the function to update the checkout button state
        updateCheckoutButtonState(cart);
    }

    // Function to update the checkout button state based on cart contents
    function updateCheckoutButtonState(cart) {
        const checkoutBtnContainer = document.getElementById('checkout-btn-container');

        // Remove any existing button inside the container
        checkoutBtnContainer.innerHTML = '';

        if (cart.length > 0) {
            // Create the "Checkout" button if there are items in the cart
            const checkoutButton = document.createElement('a');
            checkoutButton.href = 'checkout.html';
            checkoutButton.innerHTML = `
                <button class="checkout-btn">Checkout</button>
            `;
            checkoutBtnContainer.appendChild(checkoutButton);
        } else {
            // Create the greyed-out "Checkout" button if the cart is empty
            const greyedOutButton = document.createElement('div');
            greyedOutButton.href = '#'; // No navigation for the greyed-out button
            greyedOutButton.innerHTML = `
                <a><button class="greyed-checkout-btn">Checkout</button></a>
                <p class="empty-cart-message">
                    Your cart is empty, go to 
                    <a class="store-link" href="store.html">Store</a> to add items!
                </p>
            `;
            checkoutBtnContainer.appendChild(greyedOutButton);
        }
    }

    // Attach event listener to all Add to Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Display cart items on the cart page
    displayCartItems();
});
