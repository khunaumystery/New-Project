function getCart() {
  const saved = localStorage.getItem('mkCart');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  const initialCart = [
    { id: 'b001', name: 'Full Bottle B01', price: 129, image: 'full%20bottle/b001.jpg', quantity: 1 },
    { id: 'b002', name: 'Full Bottle B02', price: 139, image: 'full%20bottle/b002.jpg', quantity: 1 }
  ];
  localStorage.setItem('mkCart', JSON.stringify(initialCart));
  return initialCart;
}

function updateBadge() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartBadge = document.querySelector('.badge');
  if (cartBadge) cartBadge.textContent = total;
}

document.addEventListener('DOMContentLoaded', () => {
  updateBadge();

  const catBtns = document.querySelectorAll('.cat-btn');
  const cards = document.querySelectorAll('.promo-card');
  
  // Category switching logic
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Simulate loading/filtering animation
      cards.forEach(card => {
        card.style.animation = 'none';
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        void card.offsetWidth;
        card.style.animation = 'fadeIn 0.5s ease-out forwards';
      });
    });
  });

  // Add to cart animation and localStorage update
  const addBtns = document.querySelectorAll('.add-btn');
  const cartBadge = document.querySelector('.badge');

  addBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Small pop effect on button
      btn.style.transform = 'scale(0.8)';
      setTimeout(() => {
        btn.style.transform = 'scale(1)';
      }, 150);

      // Find item details from card
      const card = btn.closest('.promo-card');
      if (card) {
        const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'สินค้าโปรโมชั่น';
        const priceText = card.querySelector('.current-price') ? card.querySelector('.current-price').textContent.replace(/[^0-9]/g, '') : '129';
        const price = parseInt(priceText) || 129;
        const img = card.querySelector('img') ? card.querySelector('img').getAttribute('src') : 'LINE_ALBUM_1952026_260519_3.jpg';

        const cart = getCart();
        const existing = cart.find(item => item.name === title);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            id: 'promo-' + Date.now(),
            name: title,
            price: price,
            image: img,
            quantity: 1
          });
        }
        localStorage.setItem('mkCart', JSON.stringify(cart));
        updateBadge();
      }

      // Animate badge
      if (cartBadge) {
        cartBadge.style.transform = 'scale(1.3)';
        cartBadge.style.backgroundColor = '#A51A20';
        setTimeout(() => {
          cartBadge.style.transform = 'scale(1)';
          cartBadge.style.backgroundColor = 'var(--mk-red)';
        }, 200);
      }
    });
  });
  
  // Bottom Nav interactions
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // If it's a real link, let browser navigate
      if (item.getAttribute('href') && item.getAttribute('href') !== '#') {
        return;
      }
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      const icon = item.querySelector('i');
      if (icon) {
        icon.style.transform = 'translateY(-3px)';
        setTimeout(() => {
          icon.style.transform = 'translateY(0)';
        }, 200);
      }
    });
  });
});
