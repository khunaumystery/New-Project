document.addEventListener('DOMContentLoaded', () => {
  const catBtns = document.querySelectorAll('.cat-btn');
  const cards = document.querySelectorAll('.promo-card');
  
  // Category switching logic
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      catBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Simulate loading/filtering animation
      cards.forEach(card => {
        card.style.animation = 'none'; // reset animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        
        // Trigger reflow
        void card.offsetWidth;
        
        // Re-apply animation
        card.style.animation = 'fadeIn 0.5s ease-out forwards';
      });
    });
  });

  // Add to cart animation
  const addBtns = document.querySelectorAll('.add-btn');
  const cartBadge = document.querySelector('.badge');
  let cartCount = parseInt(cartBadge.textContent) || 0;

  addBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default if inside a link
      
      // Small pop effect on button
      btn.style.transform = 'scale(0.8)';
      setTimeout(() => {
        btn.style.transform = 'scale(1)';
      }, 150);

      // Increment cart
      cartCount++;
      cartBadge.textContent = cartCount;
      
      // Animate badge
      cartBadge.style.transform = 'scale(1.3)';
      cartBadge.style.backgroundColor = '#A51A20'; // darker red briefly
      setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
        cartBadge.style.backgroundColor = 'var(--mk-red)';
      }, 200);
    });
  });
  
  // Bottom Nav interactions
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
      item.addEventListener('click', (e) => {
          e.preventDefault();
          navItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
          
          // Small bounce effect on icon
          const icon = item.querySelector('i');
          icon.style.transform = 'translateY(-3px)';
          setTimeout(() => {
              icon.style.transform = 'translateY(0)';
          }, 200);
      });
  });
});
