/* ================================================================
   VIVID PIXEL — SITE BEHAVIOR
   ================================================================
   This file handles everything on the site that's interactive
   rather than just visual. There are four separate features in
   here, each independent of the others:

     1. Mobile menu toggle       (the ☰ button opening/closing the nav)
     2. Hero image rotation      (cycling through the preview photos)
     3. Lightbox popup           (click a photo to view it enlarged)
     4. Quote form submission    (sending the form to Web3Forms)

   Everything is wrapped in one big
   `document.addEventListener('DOMContentLoaded', () => { ... })`
   block. That just means "wait until the whole page has loaded
   before running any of this" — otherwise the code might try to
   grab an element (like the form) before the browser has actually
   created it yet, and fail.
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. MOBILE MENU TOGGLE
     When the ☰ button is tapped, this adds/removes the "open"
     class on the nav menu. style.css does the actual showing/
     hiding based on whether that class is present (see the
     @media (max-width: 860px) block in style.css).
     ============================================================ */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      // Keeps screen readers informed of whether the menu is open —
      // doesn't affect how it looks, just accessibility.
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
  }

  /* ============================================================
     2. HERO IMAGE ROTATION
     Finds every .slide in the hero's mock screen (currently 3 —
     see index.html) and automatically switches which one has the
     "active" class every 4 seconds, on a continuous loop. This
     works no matter how many slides exist — if you add a 4th photo
     in the HTML, this code doesn't need any changes at all.
     ============================================================ */
  const slides = document.querySelectorAll('.slide');

  // Leftover from an earlier version of the hero that had a visible
  // progress bar underneath the screen, showing time-until-next-slide.
  // That bar was removed from the HTML when the hero switched to
  // showing real photos, so this always finds nothing (null) now.
  // It's harmless to leave — the `if (progressBar)` check below just
  // means that whole block quietly does nothing. Safe to ignore
  // unless you want to add a progress bar back in someday.
  const progressBar = document.querySelector('.screen-progress-bar');

  // Used by the lightbox further down: when someone has a photo open
  // enlarged, we don't want the hero silently switching photos behind
  // it. Both features share this one variable.
  let rotationPaused = false;

  if (slides.length) {
    let current = 0; // index of whichever slide is currently showing

    // Marks ONE slide as "active" (the one at index i) and un-marks
    // all the others, all in a single pass.
    const showSlide = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      if (progressBar) {
        // (currently unused — see the note above)
        progressBar.classList.remove('animate');
        void progressBar.offsetWidth; // forces the browser to acknowledge the removal before re-adding it, so the animation actually restarts instead of being ignored
        progressBar.classList.add('animate');
      }
    };

    showSlide(current); // show the first slide immediately on page load

    // Every 4000 milliseconds (4 seconds), advance to the next slide.
    // The "% slides.length" wraps back around to 0 after the last one,
    // so it loops forever: 0 → 1 → 2 → 0 → 1 → 2 → ...
    setInterval(() => {
      if (rotationPaused) return; // skip this tick if the lightbox is currently open
      current = (current + 1) % slides.length;
      showSlide(current);
    }, 4000);
  }

  /* ============================================================
     3. LIGHTBOX POPUP
     Handles clicking a preview photo to see it enlarged, without
     leaving the page. The lightbox itself (the dark overlay +
     enlarged image + ✕ button) already exists in the page's HTML
     at all times — it's just invisible until we add the "open"
     class to it. This code only ever needs to swap WHICH image is
     showing inside that one shared overlay.
     ============================================================ */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    // Opens the lightbox showing a specific image (src = file path,
    // alt = its description text for screen readers).
    const openLightbox = (src, alt) => {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      rotationPaused = true; // stop the hero from changing slides while this is open
      document.body.style.overflow = 'hidden'; // prevents the page behind it from scrolling
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      rotationPaused = false; // let the hero resume rotating
      document.body.style.overflow = ''; // give page scrolling back
    };

    // Attach a click listener to EVERY image marked with
    // class="lightbox-trigger" in the HTML (currently the 3 hero
    // photos). If you add more clickable images anywhere on the site
    // later, just add that same class to them and they'll
    // automatically work with this same code — no JS changes needed.
    document.querySelectorAll('img.lightbox-trigger').forEach((img) => {
      img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });

    closeBtn.addEventListener('click', closeLightbox);

    // Clicking the dark backdrop itself (but NOT the enlarged image
    // sitting on top of it) also closes it. This checks that what was
    // actually clicked is the outer overlay element, not something
    // inside it — otherwise clicking the photo would close itself.
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Pressing the Escape key closes it too, but only if it's
    // currently open (so Escape doesn't do anything weird elsewhere
    // on the page).
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  /* ============================================================
     4. QUOTE FORM SUBMISSION
     Handles the "Get a Free Quote" form on about.html. Rather than
     letting the browser do a normal form submission (which would
     reload the page), this intercepts the submit, sends the data
     to Web3Forms in the background using fetch(), and shows a
     success or error message right on the page.

     Background on WHY it's built this way — this is a fully static
     website with no server of its own, so there's nothing here that
     could normally "receive" a form submission and email it to
     Nate. Web3Forms is a free third-party service that plays that
     role: the form's action="https://api.web3forms.com/submit" in
     about.html is their address, and the hidden access_key field in
     that same form tells them which inbox to deliver to.
     ============================================================ */
  const form = document.querySelector('.quote-form');
  if (form) {
    const statusEl = document.getElementById('formStatus'); // where success/error text gets written
    const submitBtn = form.querySelector('button[type="submit"]');

    // ---- Fallback path ----
    // Everything below normally runs via JavaScript intercepting the
    // submit (see the addEventListener block further down). But if a
    // visitor's browser somehow couldn't run that JavaScript, the
    // plain HTML form still works on its own — it would submit
    // normally, Web3Forms would process it, and then (because of the
    // hidden "redirect" field in the form) send the visitor back to
    // this exact page with "?submitted=true" added to the URL. This
    // check looks for that, and if found, shows the same success
    // message as the normal path would — so the visitor still gets
    // clear confirmation either way.
    if (new URLSearchParams(window.location.search).get('submitted') === 'true') {
      if (statusEl) {
        statusEl.textContent = "Thanks! Your request is in — we'll be in touch shortly.";
        statusEl.classList.add('success');
      }
      // Removes "?submitted=true" from the address bar afterward, so
      // it doesn't stick around if the visitor refreshes the page or
      // shares the link.
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    // ---- Normal path: JavaScript intercepts the submit ----
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // stops the browser's normal full-page-reload submission

      // Clear out any leftover message/styling from a previous attempt
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.remove('success', 'error');
      }
      // Disable the button and change its label while sending, so
      // someone can't accidentally click it twice
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        // Gather everything typed into the form (name, business,
        // email, message) plus all the hidden Web3Forms config
        // fields, and convert it into a plain JavaScript object.
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData);

        // Send it to Web3Forms in the background. form.action is
        // whatever URL is set in the <form action="..."> attribute
        // in about.html — so if that URL ever needs to change, you'd
        // only need to edit the HTML, not this file.
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json(); // Web3Forms replies with a small JSON message telling us if it worked

        // If the network request itself failed, OR Web3Forms says it
        // wasn't successful (wrong access key, etc.), treat it as an
        // error and jump down to the catch block below.
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Submission failed');
        }

        // ---- Success ----
        form.reset(); // clears all the fields back to blank
        if (statusEl) {
          statusEl.textContent = "Thanks! Your request is in — we'll be in touch shortly.";
          statusEl.classList.add('success');
        }
      } catch (err) {
        // ---- Something went wrong ----
        // Deliberately does NOT clear the form fields here, so the
        // visitor doesn't lose everything they typed if this happens.
        if (statusEl) {
          statusEl.innerHTML = `Something went wrong sending that. You can also email us directly at <a href="mailto:Nate.Berg@vividpixel.biz">Nate.Berg@vividpixel.biz</a>.`;
          statusEl.classList.add('error');
        }
      } finally {
        // Runs whether it succeeded or failed — always give the
        // button back its normal clickable state and label.
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Quote Request';
      }
    });
  }
});
