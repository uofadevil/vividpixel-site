// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }

  // Hero screen mockup rotation
  const slides = document.querySelectorAll('.slide');
  const progressBar = document.querySelector('.screen-progress-bar');
  if (slides.length) {
    let current = 0;
    const showSlide = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      if (progressBar) {
        progressBar.classList.remove('animate');
        void progressBar.offsetWidth; // restart animation
        progressBar.classList.add('animate');
      }
    };
    showSlide(current);
    setInterval(() => {
      current = (current + 1) % slides.length;
      showSlide(current);
    }, 4000);
  }

  // Contact form -> mailto fallback (static site, no backend)
  const form = document.querySelector('.quote-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name').value.trim();
      const business = form.querySelector('#business').value.trim();
      const email = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();

      const subject = encodeURIComponent(`Quote request — ${business || name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nBusiness: ${business}\nEmail: ${email}\n\n${message}`
      );
      window.location.href = `mailto:Nate.Berg@vividpixel.biz?subject=${subject}&body=${body}`;
    });
  }
});
