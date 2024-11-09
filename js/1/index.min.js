// State Management
let cartData = {
  items: [],
  total: 0,
  discount: 0
};

let selectedProduct = null;
let lastScrollY = 0;


// DOM Elements
const elements = {
  bottomSheet: document.getElementById('bottomSheet'),
  overlay: document.getElementById('overlay'),
  closeBottomSheet: document.getElementById('closeBottomSheet'),
  receiverForm: document.getElementById('receiverForm'),
  cartBtn: document.getElementById('cartBtn'),
  cartPanel: document.getElementById('cartPanel'),
  closeCart: document.getElementById('closeCart'),
  themeToggle: document.getElementById('themeToggle'),
  checkoutModal: document.getElementById('checkoutModal'),
  checkoutForm: document.getElementById('checkoutForm'),
  productGrid: document.getElementById('productGrid'),
  cartItems: document.getElementById('cartItems'),
  cartSummary: document.getElementById('cartSummary'),
  toast: document.getElementById('toast')
};


window.addEventListener('scroll', () => {
  const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
  if (currentScrollY > lastScrollY) {
    document.querySelector('.dth-header').classList.add('dth-header--hidden');
  } else {
    document.querySelector('.dth-header').classList.remove('dth-header--hidden');
  }
  lastScrollY = currentScrollY;
});


// Loader Management
function showLoader() {
  // Remove any existing loader first
  hideLoader();

  const loader = document.createElement('div');
  loader.classList.add('dth-loader');
  loader.innerHTML = '<div class="dth-loader__spinner"></div>';
  document.body.appendChild(loader);

  // Force a small delay to ensure smooth transitions
  return new Promise(resolve => setTimeout(resolve, 300));
}

function hideLoader() {
  const loader = document.querySelector('.dth-loader');
  if (loader) {
    loader.classList.add('dth-loader--fade');
    setTimeout(() => {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    },
      200);
  }
}




// Theme Management
class ThemeManager {
  static init() {
    const theme = localStorage.getItem('dthTheme') || 'light';
    document.documentElement.setAttribute('data-theme',
      theme);
    ThemeManager.updateToggleIcon(theme);
  }

  static toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark': 'light';
    document.documentElement.setAttribute('data-theme',
      newTheme);
    localStorage.setItem('dthTheme',
      newTheme);
    ThemeManager.updateToggleIcon(newTheme);
  }

  static updateToggleIcon(theme) {
    elements.themeToggle.innerHTML = theme === 'light' ?
    '<i class="fas fa-moon"></i>':
    '<i class="fas fa-sun"></i>';
  }
}

// Cart Management
class CartManager {
  static init() {
    const savedCart = localStorage.getItem('dthCart');
    if (savedCart) {
      cartData = JSON.parse(savedCart);
    }
    CartManager.updateCartCount();
  }

  static addToCart(product, receiverPhone) {
    cartData.items.push({
      ...product,
      quantity: 1,
      receiverPhone: receiverPhone
    });
    cartData.total = CartManager.calculateTotal();
    CartManager.updateCart();
    ToastManager.show('Item added to cart', 'success');
  }

  static removeFromCart(productId) {
    const itemIndex = cartData.items.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
      cartData.items.splice(itemIndex, 1);
      cartData.total = CartManager.calculateTotal();
      CartManager.updateCart();
      CartManager.renderCart();
      ToastManager.show('Item removed from cart');
    }
  }

  static calculateTotal() {
    return cartData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  static updateCart() {
    localStorage.setItem('dthCart', JSON.stringify(cartData));
    CartManager.updateCartCount();
  }

  static updateCartCount() {
    document.querySelector('.dth-cart-btn__count').textContent = cartData.items.length;
  }

  static renderCart() {
    elements.cartItems.innerHTML = cartData.items.map(item => `
      <div class="dth-cart-item">
      <div>
      <h3>${item.name}</h3>
      <p>GHS ${item.price}</p>
      <small>Receiver: ${item.receiverPhone}</small>
      </div>
      <button class="dth-cart-item__remove" onclick="CartManager.removeFromCart('${item.id}')">
      <i class="fas fa-trash"></i>
      </button>
      </div>
      `).join('');

    const subtotal = CartManager.calculateTotal();
    const discount = (subtotal * cartData.discount) / 100;
    const total = subtotal - discount;

    elements.cartSummary.innerHTML = `
    <p>Subtotal: GHS ${subtotal.toFixed(2)}</p>
    ${cartData.discount ? `<p>Discount: -GHS ${discount.toFixed(2)} (${cartData.discount}%)</p>`: ''}
    <p><strong>Total: GHS ${total.toFixed(2)}</strong></p>
    `;
  }

  static clearCart() {
    cartData = {
      items: [],
      total: 0,
      discount: 0
    };
    CartManager.updateCart();
  }
}

// Product Display
class ProductDisplay {
  static render(network) {
    elements.productGrid.innerHTML = '';
    products[network].forEach(product => {
      const isAvailable = networkAvailability[network] && product.isAvailable;
      const card = document.createElement('div');
      card.className = `dth-card dth-card--${isAvailable ? 'available': 'out-of-stock'}`;

      card.innerHTML = `
      <div class="dth-card__header">
      <div class="dth-card__icon">
      <i class="fas fa-signal"></i>
      </div>
      <h3 class="dth-card__title">
      ${product.name}
      ${product.isBest ? '<span class="dth-card__best">Best</span>': ''}
      </h3>
      </div>
      <div class="dth-card__info">
      <p class="dth-card__validity">${product.validity}</p>
      <p class="dth-card__price">GHS ${product.price}</p>
      </div>
      <button
      class="dth-card__btn ${!isAvailable ? 'dth-card__btn--disabled': ''}"
      ${!isAvailable ? 'disabled': ''}
      onclick="BottomSheet.show('${product.id}', '${network}')"
      >
      ${isAvailable ? 'Add to Cart': 'Out of Stock'}
      </button>
      `;
      elements.productGrid.appendChild(card);
    });
  }
}


// Bottom Sheet Management
class BottomSheet {
  static show(productId, network) {
    selectedProduct = products[network].find(p => p.id === productId);
    const productElement = document.getElementById('selectedProduct');

    productElement.innerHTML = `
    <div class="dth-bottom-sheet__product-info">
    <h3>${selectedProduct.name}</h3>
    <p>GHS ${selectedProduct.price}</p>
    <small>${selectedProduct.validity}</small>
    </div>
    `;

    elements.bottomSheet.classList.add('dth-bottom-sheet--open');
    elements.overlay.classList.add('dth-overlay--visible');
  }

  static hide() {
    elements.bottomSheet.classList.remove('dth-bottom-sheet--open');
    elements.overlay.classList.remove('dth-overlay--visible');
    selectedProduct = null;
    elements.receiverForm.reset();
  }
}

// Checkout Management
class CheckoutManager {
  static open() {
    if (cartData.items.length === 0) {
      ToastManager.show('Your cart is empty', 'error');
      return;
    }
    elements.checkoutModal.classList.add('dth-modal--open');
  }

  static close() {
    elements.checkoutModal.classList.remove('dth-modal--open');
  }

  static handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    const formData = {
      email,
      phone
    };

    if (CheckoutManager.validateForm(formData)) {
      const total = CartManager.calculateTotal() * (1 - cartData.discount / 100);
      PaymentManager.initiate(total, formData.email);
    }
  }


  static validateForm(formData) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!emailRegex.test(formData.email)) {
      ToastManager.show('Please enter a valid email address', 'error');
      return false;
    }

    if (!phoneRegex.test(formData.phone)) {
      ToastManager.show('Please enter a valid phone number', 'error');
      return false;
    }

    return true;
  }
}

// Payment Processing
class PaymentManager {
  static initiate(amount, email) {
    console.log("Payment initiated");
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: KEYS.PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: amount * 100,
      currency: 'GHS',
      ref: 'DTH_' + Math.random().toString(36).substr(2, 9),
      callback: PaymentManager.handleSuccess,
      onClose: PaymentManager.handleCancel
    });
  }

  static async handleSuccess(response) {
    try {
      showLoader();

      const orderDetails = {
        reference: response.reference,
        items: cartData.items,
        total: CartManager.calculateTotal() * (1 - cartData.discount / 100),
        customer: {
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value
        },
        paymentResponse: response
      };

      // Send notification
      await NotificationManager.sendOrderNotification(orderDetails);

      // Clear cart and close checkout
      CartManager.clearCart();
      CheckoutManager.close();
      elements.cartPanel.classList.remove('dth-cart-panel--open');

      // Hide loader before showing order summary
      hideLoader();

      // Show order summary
      await OrderSummaryModal.open(orderDetails);

      ToastManager.show('Order placed successfully!', 'success');
    } catch (error) {
      console.error('Order processing error:', error);
      hideLoader(); // Ensure loader is hidden even on error
      ToastManager.show('Failed to process order. Please save your payment reference and contact support.', 'error');
    }
  }

  static handleCancel() {
    hideLoader(); // Ensure loader is hidden on cancel
    ToastManager.show('Payment cancelled', 'error');
  }
}


// Order Summary Modal
class OrderSummaryModal {
  static async open(orderDetails) {
    try {
      // Remove any existing modal first
      OrderSummaryModal.close();

      const modal = document.createElement('div');
      modal.className = 'dth-modal';
      modal.innerHTML = `
      <div class="dth-modal__content">
      <h2>Order Summary</h2>
      <div class="dth-order-summary">
      <p><strong>Reference:</strong> ${orderDetails.reference}</p>
      <div class="dth-order-summary__items">
      <h3>Items:</h3>
      <div class="dth-order-summary__items-container">
      ${orderDetails.items.map(item => {
                  const productDetails = NotificationManager.findProductDetails(item.id);
                  const networkName = productDetails?.network?.toUpperCase() || 'UNKNOWN';
                  return `
                    <div class="dth-order-summary__item">
                    <p>📱 ${networkName}</p>
                      <p><strong>${item.name}</strong></p>
                      <p>Receiver: ${item.receiverPhone}</p>
                      <p>Price: GHS ${item.price}</p>
                    </div>
                  `;
                }).join('')}
      </div>
      </div>
      <p><strong>Total:</strong> GHS ${orderDetails.total.toFixed(2)}</p>
      <p><strong>Customer:</strong><br>
      ${orderDetails.customer.email}<br>
      ${orderDetails.customer.phone}</p>
      </div>
      <button class="dth-modal__close" onclick="OrderSummaryModal.close()">
      <i class="fas fa-times"></i>
      </button>
      </div>
      `;

      document.body.appendChild(modal);

      // Add event listeners
      const closeBtn = modal.querySelector('.dth-modal__close');
      closeBtn.addEventListener('click', OrderSummaryModal.close);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          OrderSummaryModal.close();
        }
      });

      // Force layout reflow before adding open class
      modal.offsetHeight;
      modal.classList.add('dth-modal--open');

      // Add keyboard support for closing
      document.addEventListener('keydown',
        (e) => {
          if (e.key === 'Escape') {
            OrderSummaryModal.close();
          }
        });

    } catch (error) {
      console.error('Error showing order summary:',
        error);
      ToastManager.show('Error displaying order summary',
        'error');
    }
  }

  static close() {
    const modal = document.querySelector('.dth-modal');
    if (modal) {
      modal.classList.remove('dth-modal--open');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      },
        300);
    }
  }
}

// Notification Management
class NotificationManager {
  static async sendOrderNotification(orderDetails) {
    try {
      const message = NotificationManager.formatOrderMessage(orderDetails);

      const response = await fetch(`https://api.telegram.org/bot${KEYS.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: KEYS.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
          })
        });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Telegram error: ${data.description}`);
      }

    } catch (error) {
      console.error('Failed to send notification:', error);
      // Re-throw the error to be handled by the payment manager
      throw new Error('Failed to send order notification. Error: ' + error.message);
    }
  }

  static formatOrderMessage(orderDetails) {
    try {
      // Safety checks for required data
      if (!orderDetails || !orderDetails.items || !orderDetails.customer) {
        throw new Error('Invalid order details format');
      }

      const items = orderDetails.items.map(item => {
        // Defensive programming to handle potential missing data
        const productDetails = NotificationManager.findProductDetails(item.id);
        const networkName = productDetails?.network?.toUpperCase() || 'UNKNOWN';

        return `📱 <b>${networkName}</b>
        Package: ${item.name || 'N/A'}
        Price: GHS ${(item.price || 0).toFixed(2)}
        Receiver: ${item.receiverPhone || 'N/A'}
        Validity: ${item.validity || 'N/A'}`;
      }).join('\n\n');

      const formattedMessage = `
      🔔 <b>NEW ORDER RECEIVED</b>

      📋 <b>Order Details:</b>
      Reference: ${orderDetails.reference}

      📦 <b>Items Ordered:</b>
      ${items}

      💰 <b>Order Total:</b> GHS ${orderDetails.total.toFixed(2)}

      👤 <b>Customer Information:</b>
      Email: ${orderDetails.customer.email || 'N/A'}
      Phone: ${orderDetails.customer.phone || 'N/A'}

      💳 <b>Payment Information:</b>
      Status: Success
      Gateway Reference: ${orderDetails.paymentResponse?.reference || 'N/A'}

      ⏰ Order Time: ${new Date().toLocaleString()}
      `.trim();

      return formattedMessage;
    } catch (error) {
      console.error('Error formatting message:', error);
      throw new Error('Failed to format notification message');
    }
  }

  static findProductDetails(productId) {
    // Search through the products object to find the matching product
    for (const [network, networkProducts] of Object.entries(products)) {
      const product = networkProducts.find(p => p.id === productId);
      if (product) {
        return {
          ...product,
          network
        };
      }
    }
    return null;
  }

  static validateOrderDetails(orderDetails) {
    const required = ['reference',
      'items',
      'total',
      'customer'];
    const missing = required.filter(field => !orderDetails[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (!orderDetails.customer.email || !orderDetails.customer.phone) {
      throw new Error('Customer details are incomplete');
    }
  }
}

// Toast Notifications
class ToastManager {
  static show(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `dth-toast dth-toast--${type}`;
    elements.toast.style.display = 'block';

    setTimeout(() => {
      elements.toast.style.display = 'none';
    }, 3000);
  }
}

// Network Availability Management
class NetworkManager {
  static toggleNetworkAvailability(network, status) {
    if (network in networkAvailability) {
      networkAvailability[network] = status;
      // Re-render if we're currently viewing this network
      const currentNetwork = document.querySelector('.dth-tabs__btn--active').dataset.network;
      if (currentNetwork === network) {
        ProductDisplay.render(network);
      }
      ToastManager.show(
        `${network.toUpperCase()} products are now ${status ? 'available': 'out of stock'}`,
        'info'
      );
    }
  }

  static setAllNetworksAvailability(status) {
    Object.keys(networkAvailability).forEach(network => {
      networkAvailability[network] = status;
    });
    const currentNetwork = document.querySelector('.dth-tabs__btn--active').dataset.network;
    ProductDisplay.render(currentNetwork);
    ToastManager.show(
      `All networks are now ${status ? 'available': 'out of stock'}`,
      'info'
    );
  }

  static getNetworkAvailability(network) {
    return networkAvailability[network] || false;
  }
}

// Discount Management
function applyDiscount() {
  const code = document.getElementById('discountCode').value.toUpperCase();
  if (DISCOUNT_CODES[code]) {
    cartData.discount = DISCOUNT_CODES[code];
    CartManager.renderCart();
    ToastManager.show(`Discount code applied: ${cartData.discount}% off`, 'success');
  } else {
    ToastManager.show('Invalid discount code', 'error');
  }
}

// Event Listeners
function initializeEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', ThemeManager.toggle);

  // Cart panel
  elements.cartBtn.addEventListener('click', () => {
    elements.cartPanel.classList.add('dth-cart-panel--open');
    CartManager.renderCart();
  });

  elements.closeCart.addEventListener('click', () => {
    elements.cartPanel.classList.remove('dth-cart-panel--open');
  });

  // Bottom sheet
  elements.closeBottomSheet.addEventListener('click', BottomSheet.hide);
  elements.overlay.addEventListener('click', BottomSheet.hide);

  // Receiver form
  elements.receiverForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const receiverPhone = document.getElementById('receiverPhone').value;

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(receiverPhone)) {
      ToastManager.show('Please enter a valid phone number', 'error');
      return;
    }

    if (selectedProduct) {
      CartManager.addToCart(selectedProduct, receiverPhone);
      BottomSheet.hide();
    }
  });

  // Network tabs
  document.querySelectorAll('.dth-tabs__btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dth-tabs__btn').forEach(t =>
        t.classList.remove('dth-tabs__btn--active'));
      tab.classList.add('dth-tabs__btn--active');
      ProductDisplay.render(tab.dataset.network);
    });
  });

  // Checkout
  elements.checkoutForm.addEventListener('submit',
    CheckoutManager.handleSubmit);
  elements.checkoutModal.addEventListener('click',
    (e) => {
      if (e.target === elements.checkoutModal) {
        CheckoutManager.close();
      }
    });
}

const infoIcon = document.getElementById('infoIcon');
const informationBottomSheet = document.getElementById('informationBottomSheet');
const closeInfoBottomSheet = document.getElementById('closeInfoBottomSheet');
const informationOverlay = document.getElementById('informationOverlay');

infoIcon.addEventListener('click', () => {
  informationBottomSheet.classList.add('dth-bottom-sheet--open');
  informationOverlay.classList.add('dth-overlay--visible');
});

closeInfoBottomSheet.addEventListener('click', () => {
  informationBottomSheet.classList.remove('dth-bottom-sheet--open');
  informationOverlay.classList.remove('dth-overlay--visible');
});

informationOverlay.addEventListener('click', () => {
  informationBottomSheet.classList.remove('dth-bottom-sheet--open');
  informationOverlay.classList.remove('dth-overlay--visible');
});

// Initialize Application
async function initializeApp() {
  ThemeManager.init();
  CartManager.init();

  await showLoader();
  try {
    ProductDisplay.render('mtn');
    initializeEventListeners();
  } finally {
    hideLoader();
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);