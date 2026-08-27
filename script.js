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
  let rotationPaused = false;

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
      if (rotationPaused) return;
      current = (current + 1) % slides.length;
      showSlide(current);
    }, 4000);
  }

  // Lightbox: click any .lightbox-trigger image to view it enlarged in-page
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    const openLightbox = (src, alt) => {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      rotationPaused = true;
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      rotationPaused = false;
      document.body.style.overflow = '';
    };

    document.querySelectorAll('img.lightbox-trigger').forEach((img) => {
      img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });

    closeBtn.addEventListener('click', closeLightbox);

    // Click the dark backdrop (not the image itself) to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Escape key closes it too
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  // Quote form -> submits to Web3Forms via their JSON API, so the visitor
  // never leaves the page or has to deal with their own email client.
  const form = document.querySelector('.quote-form');
  if (form) {
    const statusEl = document.getElementById('formStatus');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Fallback path: if JS failed to intercept a prior submission, Web3Forms'
    // "redirect" field sent them back here with ?submitted=true — show the
    // same success state.
    if (new URLSearchParams(window.location.search).get('submitted') === 'true') {
      if (statusEl) {
        statusEl.textContent = "Thanks! Your request is in — we'll be in touch shortly.";
        statusEl.classList.add('success');
      }
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.remove('success', 'error');
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData);

        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Submission failed');
        }

        form.reset();
        if (statusEl) {
          statusEl.textContent = "Thanks! Your request is in — we'll be in touch shortly.";
          statusEl.classList.add('success');
        }
      } catch (err) {
        if (statusEl) {
          statusEl.innerHTML = `Something went wrong sending that. You can also email us directly at <a href="mailto:Nate.Berg@vividpixel.biz">Nate.Berg@vividpixel.biz</a>.`;
          statusEl.classList.add('error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Quote Request';
      }
    });
  }
});
