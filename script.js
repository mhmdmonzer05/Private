(() => {
  "use strict";

  const introScreen = document.querySelector("#introScreen");
  const storyScreen = document.querySelector("#storyScreen");
  const introQuestion = document.querySelector("#introQuestion");
  const introName = document.querySelector("#introName");
  const introCopy = document.querySelector("#introCopy");
  const introDivider = document.querySelector("#introDivider");
  const introHint = document.querySelector("#introHint");
  const heartButton = document.querySelector("#heartButton");
  const heartCaption = document.querySelector("#heartCaption");
  const readingProgressBar = document.querySelector("#readingProgressBar");
  const wishButton = document.querySelector("#wishButton");
  const wishHint = document.querySelector("#wishHint");
  const finalReveal = document.querySelector("#finalReveal");
  const confettiLayer = document.querySelector("#confettiLayer");
  const toast = document.querySelector("#toast");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let introStep = 0;
  let toastTimer;
  let wishOpened = false;

  // Tiny opening sequence: HI → question → Yasmin → the heart.
  const schedule = (fn, delay) => window.setTimeout(fn, reducedMotion ? 0 : delay);
  schedule(() => introName.classList.add("visible"), 450);
  schedule(() => introName.classList.remove("visible"), 1750);
  schedule(() => introQuestion.classList.add("question-emphasis"), 1850);
  schedule(() => {
    introName.textContent = "Yasmin";
    introName.classList.add("visible");
    introDivider.classList.add("visible");
  }, 2550);
  schedule(() => heartButton.classList.add("ready"), 2950);

  // First heart tap changes the prompt; the second opens the story.
  heartButton.addEventListener("click", () => {
    if (introStep === 0) {
      introStep = 1;
      introCopy.classList.add("fade-away");
      heartButton.setAttribute("aria-label", "Continue to the birthday story");
      schedule(() => {
        introQuestion.innerHTML = 'Do you remember <span class="dots" aria-label="…"><span>.</span><span>.</span><span>.</span></span>';
        introName.textContent = "";
        introName.classList.remove("visible");
        introQuestion.classList.add("question-large");
        introCopy.classList.remove("fade-away");
        introHint.textContent = "There's a little story I want to show you. ♡";
        heartCaption.textContent = "one more tap";
      }, 320);
      return;
    }

    heartButton.disabled = true;
    introScreen.classList.add("leaving");
    schedule(() => {
      introScreen.hidden = true;
      storyScreen.hidden = false;
      document.body.classList.remove("intro-locked");
      requestAnimationFrame(() => storyScreen.classList.add("visible"));
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      revealObserver.observeAll?.();
      showToast("A little story, made just for you ♡");
    }, 650);
  });

  // Existing or newly added photos are picked up automatically. If a file is missing,
  // the matching illustrated placeholder is shown instead of a broken image icon.
  document.querySelectorAll("img.swap-image").forEach((img) => {
    const fallback = img.dataset.fallback;
    img.addEventListener("error", () => {
      if (fallback && img.src !== new URL(fallback, document.baseURI).href) {
        img.src = fallback;
      }
    }, { once: true });
    // A very fast local-file failure can happen before this deferred script runs.
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
  });

  // Smoothly jump to the next scrapbook chapter.
  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const destination = document.querySelector(button.dataset.next);
      destination?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  // Reveal cards as they enter the viewport; graceful fallback for older browsers.
  const revealObserver = {
    observer: null,
    observeAll() {
      document.querySelectorAll(".reveal").forEach((item) => {
        if (this.observer) this.observer.observe(item);
        else item.classList.add("in-view");
      });
    }
  };
  if ("IntersectionObserver" in window && !reducedMotion) {
    revealObserver.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -25px 0px" });
  }
  revealObserver.observeAll();

  // Let keyboard users skip straight to the scrapbook if they prefer.
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    introScreen.hidden = true;
    storyScreen.hidden = false;
    document.body.classList.remove("intro-locked");
    requestAnimationFrame(() => storyScreen.classList.add("visible"));
    revealObserver.observeAll();
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  // Expandable little love notes.
  document.querySelectorAll(".love-note").forEach((note) => {
    note.addEventListener("click", () => {
      const opening = note.getAttribute("aria-expanded") !== "true";
      note.setAttribute("aria-expanded", String(opening));
    });
  });

  // Reading progress line at the very top of the page.
  let scrollQueued = false;
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      readingProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      scrollQueued = false;
    });
  }, { passive: true });

  // A little celebration, no external libraries needed.
  function celebrate() {
    if (!confettiLayer) return;
    const colors = ["#f47d9e", "#f8bfd0", "#d95e85", "#ffd47d", "#e8a1ba", "#ffffff"];
    const symbols = ["♡", "♥", "✦", "✧"];
    const count = reducedMotion ? 12 : 58;
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement("span");
      const isHeart = Math.random() < 0.27;
      piece.className = `confetti-piece${isHeart ? " heart-confetti" : ""}`;
      if (isHeart) piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      else {
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      }
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--fall-time", `${2.5 + Math.random() * 2.4}s`);
      piece.style.setProperty("--drift", `${Math.round((Math.random() - 0.5) * 190)}px`);
      piece.style.animationDelay = `${Math.random() * 0.75}s`;
      confettiLayer.appendChild(piece);
      window.setTimeout(() => piece.remove(), 6500);
    }
  }

  wishButton.addEventListener("click", () => {
    if (!wishOpened) {
      wishOpened = true;
      finalReveal.hidden = false;
      wishButton.innerHTML = "<span>♡</span> Wish sent <span>♡</span>";
      wishButton.setAttribute("aria-label", "Your birthday wish has been sent");
      wishHint.textContent = "I hope something wonderful finds you this year. ♡";
      celebrate();
      schedule(() => finalReveal.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" }), 250);
    } else {
      celebrate();
      showToast("Sending you a little extra love ♡");
    }
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
  }

  // Local placeholder clips are included so both player cards work immediately.
})();
