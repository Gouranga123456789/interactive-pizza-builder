document.addEventListener('DOMContentLoaded', () => {
    const BASE_PRICE = 150;
    const TOPPINGS = {
        pepperoni: { name: 'Pepperoni', price: 80, image: 'images/pepperoni.png' },
        mushrooms: { name: 'Mushrooms', price: 50, image: 'images/mushrooms.png' },
        onions: { name: 'Onions', price: 40, image: 'images/onions.png' },
        olives: { name: 'Olives', price: 60, image: 'images/olives.png' },
    };
    let currentTotal = BASE_PRICE;
    let customerData = {};

    // --- DOM ELEMENT SELECTION ---
    const pages = document.querySelectorAll('.page');
    const pizzaContainer = document.getElementById('pizza-container');
    const toppingControlsContainer = document.getElementById('topping-controls');
    const summaryList = document.getElementById('summary-list');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutForm = document.getElementById('checkout-form');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');


    // --- CLIENT-SIDE ROUTING ---
    const handleRouteChange = () => {
        const hash = window.location.hash || '#builder';
        pages.forEach(page => page.classList.add('hidden'));
        const activePage = document.querySelector(hash);
        if (activePage) activePage.classList.remove('hidden');
    };
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange(); // Initial load


    // Dynamically generate topping controls
    function createToppingControls() {
        for (const [key, topping] of Object.entries(TOPPINGS)) {
            const controlHTML = `
                <div class="topping-control">
                    <input type="checkbox" id="${key}" data-topping="${key}" data-price="${topping.price}">
                    <label for="${key}">
                        <img src="${topping.image}" alt="${topping.name}" width="30">
                        <span>${topping.name} (+₹${topping.price})</span>
                    </label>
                </div>
            `;
            toppingControlsContainer.innerHTML += controlHTML;
        }
    }

    // Handle topping selection
    function handleToppingChange(event) {
        const checkbox = event.target;
        if (!checkbox.matches('input[type="checkbox"]')) return;

        const toppingKey = checkbox.dataset.topping;
        if (checkbox.checked) {
            addTopping(toppingKey);
        } else {
            removeTopping(toppingKey);
        }
        updateSummary();
    }

    // 🍕 DYNAMIC DOM MANIPULATION: Add topping images
    function addTopping(toppingKey) {
        const toppingData = TOPPINGS[toppingKey];
        // Add multiple images for a realistic look
        for (let i = 0; i < 4; i++) {
            const toppingImg = document.createElement('img');
            toppingImg.src = toppingData.image;
            toppingImg.alt = toppingData.name;
            toppingImg.classList.add('topping', `topping-${toppingKey}`);
            // Randomize position and rotation
            toppingImg.style.top = `${Math.random() * 80}%`;
            toppingImg.style.left = `${Math.random() * 80}%`;
            toppingImg.style.transform = `rotate(${Math.random() * 270}deg)`;
            pizzaContainer.appendChild(toppingImg);
        }
    }

    // 🍕 DYNAMIC DOM MANIPULATION: Remove topping images
    function removeTopping(toppingKey) {
        const toppingImages = document.querySelectorAll(`.topping-${toppingKey}`);
        toppingImages.forEach(img => img.remove());
    }

    // 🍕 DYNAMIC DOM MANIPULATION: Update the order summary
    function updateSummary() {
        summaryList.innerHTML = `<li>Base Pizza - ₹${BASE_PRICE.toFixed(2)}</li>`;
        currentTotal = BASE_PRICE;

        const selectedToppings = document.querySelectorAll('#topping-controls input:checked');
        selectedToppings.forEach(checkbox => {
            const toppingKey = checkbox.dataset.topping;
            const toppingData = TOPPINGS[toppingKey];
            currentTotal += toppingData.price;
            const summaryItem = document.createElement('li');
            summaryItem.innerHTML = `<span>${toppingData.name}</span><span>+₹${toppingData.price.toFixed(2)}</span>`;
            summaryList.appendChild(summaryItem);
        });
        totalPriceElement.textContent = `₹${currentTotal.toFixed(2)}`;
    }


    // --- CHECKOUT FORM LOGIC ---

    let currentStep = 1;

    function navigateForm(direction) {
        if (direction === 'next' && validateStep(currentStep)) {
            currentStep++;
        } else if (direction === 'prev') {
            currentStep--;
        }
        updateFormStep();
    }

    function updateFormStep() {
        formSteps.forEach(step => step.classList.remove('active'));
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');

        progressSteps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // 📝 COMPLEX FORM VALIDATION
    function validateStep(step) {
        let isValid = true;
        const currentStepInputs = document.querySelectorAll(`.form-step[data-step="${step}"] input`);
        
        // Clear previous errors
        currentStepInputs.forEach(input => showError(input, ''));

        for (const input of currentStepInputs) {
            if (input.id === 'name' && input.value.trim() === '') {
                isValid = false;
                showError(input, 'Name cannot be empty.');
            }
            if (input.id === 'phone' && !/^[6-9]\d{9}$/.test(input.value)) {
                isValid = false;
                showError(input, 'Please enter a valid 10-digit Indian phone number.');
            }
            if (input.id === 'address' && input.value.trim().length < 10) {
                isValid = false;
                showError(input, 'Please enter a complete address.');
            }
            if (input.id === 'pincode') {
                const serviceablePincodes = ['123456', '987654', '213454', '781009'];
                if (!serviceablePincodes.includes(input.value)) {
                    isValid = false;
                    showError(input, 'Sorry, we do not deliver to this pincode yet.');
                }
            }
            if (input.id === 'card-number' && !/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(input.value.trim())) {
                isValid = false;
                showError(input, 'Please enter a valid 16-digit card number.');
            }
            if (input.id === 'expiry') {
                const [month, year] = input.value.split('/');
                const expiryDate = new Date(`20${year}`, month - 1);
                if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(input.value) || expiryDate < new Date()) {
                    isValid = false;
                    showError(input, 'Please enter a valid, future expiry date (MM/YY).');
                }
            }
            if (input.id === 'cvv' && !/^\d{3,4}$/.test(input.value)) {
                isValid = false;
                showError(input, 'Please enter a valid 3 or 4 digit CVV.');
            }
        }
        return isValid;
    }
    
    // Live card number formatting
    document.getElementById('card-number').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim();
    });

    function showError(inputElement, message) {
        const errorSpan = inputElement.nextElementSibling;
        errorSpan.textContent = message;
    }
    
    function handleFormSubmit(event) {
        event.preventDefault();
        if (validateStep(3)) {
            // Store customer data
            customerData.name = document.getElementById('name').value;
            // ... store other data if needed
            
            displayConfirmation();
            window.location.hash = '#confirmation';
        }
    }

    // --- CONFIRMATION PAGE LOGIC ---
    function displayConfirmation() {
        document.getElementById('customer-name').textContent = customerData.name;
        const finalSummaryContainer = document.getElementById('final-summary');
        finalSummaryContainer.innerHTML = ''; // Clear previous
        
        const summaryItems = summaryList.querySelectorAll('li');
        summaryItems.forEach(item => {
            const [name, price] = item.innerText.split(' - ');
            const div = document.createElement('div');
            div.innerHTML = `<span>${name}</span><strong>${price || ''}</strong>`;
            finalSummaryContainer.appendChild(div);
        });
        
        const totalDiv = document.createElement('div');
        totalDiv.innerHTML = `<span><strong>Total</strong></span><strong>${totalPriceElement.textContent}</strong>`;
        finalSummaryContainer.appendChild(totalDiv);
    }
    
    // --- RESET & INITIALIZATION ---
    function resetApp() {
        // Reset pizza
        removeTopping('pepperoni'); removeTopping('mushrooms'); removeTopping('onions'); removeTopping('olives');
        document.querySelectorAll('#topping-controls input').forEach(cb => cb.checked = false);
        updateSummary();
        // Reset form
        checkoutForm.reset();
        currentStep = 1;
        updateFormStep();
    }
    
    document.getElementById('new-order-btn').addEventListener('click', resetApp);


    // --- EVENT LISTENERS ---
    toppingControlsContainer.addEventListener('change', handleToppingChange);
    checkoutForm.addEventListener('submit', handleFormSubmit);
    // Add listeners for next/prev buttons
    document.querySelectorAll('.btn-next').forEach(btn => btn.addEventListener('click', () => navigateForm('next')));
    document.querySelectorAll('.btn-prev').forEach(btn => btn.addEventListener('click', () => navigateForm('prev')));
    

    // --- INITIALIZE APP ---
    createToppingControls();

});