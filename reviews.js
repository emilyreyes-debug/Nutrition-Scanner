(() => {
  const STORAGE_KEY = 'nutrition_scanner_reviews_v1';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const starsWrap = $('#stars');
  const ratingInput = $('#review-rating');
  const reviewForm = $('#review-form');

  const reviewsList = $('#reviews-list');
  const avgStars = $('#avg-stars');
  const avgValue = $('#avg-value');
  const reviewsCount = $('#reviews-count');

  function loadReviews() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((r) => r && typeof r.rating === 'number');
    } catch {
      return [];
    }
  }

  function saveReviews(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function renderStars(target, value, opts = {}) {
    const { size = '20px', filledColor = '#f2a93b', emptyColor = 'rgba(255,255,255,.28)' } = opts;

    const full = Math.floor(value);
    const frac = value - full;
    const n = 5;

    target.innerHTML = '';
    for (let i = 1; i <= n; i++) {
      const star = document.createElement('span');
     star.textContent = '★';
      star.style.fontSize = size;
      star.style.display = 'inline-block';
      star.style.lineHeight = 1;
      star.style.marginRight = '2px';

      const isFilled = i <= full;
      star.style.color = isFilled ? filledColor : emptyColor;
      target.appendChild(star);
    }
  }

  function updateSummary(items) {
    const count = items.length;
    if (count === 0) {
      avgValue.textContent = '—';
      reviewsCount.textContent = '0 reviews';
      avgStars.innerHTML = '';
      return;
    }

    const avg = items.reduce((acc, r) => acc + r.rating, 0) / count;
    avgValue.textContent = avg.toFixed(1) + '/5';
    reviewsCount.textContent = `${count} review${count === 1 ? '' : 's'}`;

    renderStars(avgStars, avg, { size: '18px' });
  }

  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return '';
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function renderReviews(items) {
    reviewsList.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-reviews';
      empty.textContent = 'Be the first to leave a review.';
      reviewsList.appendChild(empty);
      updateSummary(items);
      return;
    }

    // newest first
    const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    for (const r of sorted) {
      const card = document.createElement('div');
      card.className = 'single-review';

      const stars = document.createElement('div');
      stars.className = 'single-stars';
      renderStars(stars, r.rating, { size: '16px' });

      const name = document.createElement('div');
      name.className = 'review-name';
      name.textContent = r.name;

      const date = document.createElement('div');
      date.className = 'review-date';
      date.textContent = formatDate(r.createdAt);

      const text = document.createElement('p');
      text.className = 'review-text';
      text.innerHTML = escapeHtml(r.text).replaceAll('\n', '<br/>');

      card.appendChild(stars);
      card.appendChild(name);
      card.appendChild(date);
      card.appendChild(text);

      reviewsList.appendChild(card);
    }

    updateSummary(sorted);
  }

  function setSelectedRating(value) {
    ratingInput.value = String(value);

    const buttons = $$('.star');
    buttons.forEach((btn) => {
      const v = Number(btn.dataset.value);
      const active = v <= value;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
      btn.style.color = active ? '#f2a93b' : 'rgba(255,255,255,.28)';
    });
  }

  function initStars() {
    if (!starsWrap || !ratingInput) return;

    // default state
    setSelectedRating(0);

    starsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.star');
      if (!btn) return;
      setSelectedRating(Number(btn.dataset.value));
    });

    // hover preview
    starsWrap.addEventListener('mousemove', (e) => {
      const btn = e.target.closest('.star');
      if (!btn) return;
      const value = Number(btn.dataset.value);
      const buttons = $$('.star');
      buttons.forEach((b) => {
        const v = Number(b.dataset.value);
        const active = v <= value;
        b.classList.toggle('hovering', active);
      });
    });

    starsWrap.addEventListener('mouseleave', () => {
      const current = Number(ratingInput.value || 0);
      const buttons = $$('.star');
      buttons.forEach((btn) => {
        const v = Number(btn.dataset.value);
        const active = v <= current;
        btn.classList.toggle('hovering', false);
        btn.classList.toggle('active', active);
        btn.style.color = active ? '#f2a93b' : 'rgba(255,255,255,.28)';
        btn.setAttribute('aria-checked', active ? 'true' : 'false');
      });
    });
  }

  function initReviewForm() {
    if (!reviewForm) return;

    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = $('#review-name').value.trim();
      const text = $('#review-text').value.trim();
      const rating = Number(ratingInput.value);

      if (!name || !text || !(rating >= 1 && rating <= 5)) return;

      const reviews = loadReviews();
      reviews.push({
        name,
        rating,
        text,
        createdAt: Date.now(),
      });

      saveReviews(reviews);

      // reset
      $('#review-name').value = '';
      $('#review-text').value = '';
      setSelectedRating(0);

      renderReviews(reviews);

      // subtle success scroll
      reviewsList?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // Initial boot
  const existing = loadReviews();
  renderReviews(existing);
  initStars();
  initReviewForm();
})();

