/**
 * main.js
 * Handles dynamic card rendering, filtering, sorting, and reset.
 * Depends on usedCars array loaded from usedCars.js via index.html script tags.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     DOM REFERENCES
  ---------------------------------------------------------- */
  const carGrid     = document.getElementById('car-grid');
  const resultCount = document.getElementById('result-count');
  const totalCount  = document.getElementById('total-count');
  const headerCount = document.getElementById('header-count');
  const btnApply    = document.getElementById('btn-apply');
  const btnReset    = document.getElementById('btn-reset');
  const sortSelect  = document.getElementById('sort-select');

  const minYear    = document.getElementById('min-year');
  const maxYear    = document.getElementById('max-year');
  const maxMileage = document.getElementById('max-mileage');
  const minPrice   = document.getElementById('min-price');
  const maxPrice   = document.getElementById('max-price');

  /* ----------------------------------------------------------
     COLOR MAP — name to CSS class and hex for dot display
  ---------------------------------------------------------- */
  const colorClassMap = {
    White: 'color-white',
    Black: 'color-black',
  };

  /* ----------------------------------------------------------
     IMAGE MAP — make + model key to photo path
  ---------------------------------------------------------- */
  const carImageMap = {
    'Mercedes-Benz GLE 63 AMG': 'images/benz.jpg',
    'Dodge Challenger':          'images/challenger.jpg',
    'Pagani Zonda':              'images/pagani.jpg',
  };

  /* ----------------------------------------------------------
     INIT: Build make & color filter chips from dataset
  ---------------------------------------------------------- */
  function getUnique(key) {
    return [...new Set(usedCars.map(c => c[key]))].sort();
  }

  function buildChips(containerId, items, name, withDot = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
      const label = document.createElement('label');
      label.className = 'chip-label';

      const input = document.createElement('input');
      input.type  = 'checkbox';
      input.name  = name;
      input.value = item;

      const span = document.createElement('span');
      span.className = 'chip';

      if (withDot) {
        const dot = document.createElement('span');
        dot.className = `color-dot ${colorClassMap[item] || ''}`;
        span.appendChild(dot);
      }

      span.appendChild(document.createTextNode(item));
      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });
  }

  buildChips('make-chips',  getUnique('make'),  'make');
  buildChips('color-chips', getUnique('color'), 'color', true);

  /* ----------------------------------------------------------
     HELPERS
  ---------------------------------------------------------- */
  /** Format number with commas: 2800000 -> "2,800,000" */
  function fmt(n) { return n.toLocaleString(); }

  /** Get CSS dot class for a color */
  function dotClass(color) { return colorClassMap[color] || ''; }

  /** Get checked values from a named checkbox group */
  function getChecked(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
      .map(el => el.value);
  }

  /* ----------------------------------------------------------
     CARD CREATION — one <article> per car
  ---------------------------------------------------------- */
  function createCard(car) {
    const imgSrc  = carImageMap[`${car.make} ${car.model}`];
    const article = document.createElement('article');
    article.className = 'car-card';

    article.innerHTML = `
      <div class="car-card__img" aria-label="${car.year} ${car.make} ${car.model}">
        <img src="${imgSrc}" alt="${car.year} ${car.make} ${car.model}" loading="lazy" />
        <span class="car-card__year-badge">${car.year}</span>
      </div>

      <div class="car-card__body">
        <p class="car-card__make">${car.make}</p>
        <h2 class="car-card__model">${car.model}</h2>

        <div class="car-card__stats">
          <div class="stat">
            <div class="stat__label">Mileage</div>
            <div class="stat__value">${fmt(car.mileage)} mi</div>
          </div>
          <div class="stat">
            <div class="stat__label">Color</div>
            <div class="stat__value">
              <span class="stat__color-dot ${dotClass(car.color)}"></span>${car.color}
            </div>
          </div>
        </div>

        <p class="car-card__gas">⛽ ${car.gasMileage}</p>

        <div class="car-card__footer">
          <span class="car-card__price">$${fmt(car.price)}</span>
          <button class="btn-details" aria-label="Details for ${car.year} ${car.make} ${car.model}">
            Details
          </button>
        </div>
      </div>
    `;

    return article;
  }

  /* ----------------------------------------------------------
     RENDER — inject cards into grid and update counts
  ---------------------------------------------------------- */
  function renderCars(cars) {
    carGrid.innerHTML = '';

    if (cars.length === 0) {
      carGrid.innerHTML = `
        <div class="empty-state" role="status">
          <div class="empty-icon">🔍</div>
          <h3>No Cars Found</h3>
          <p>No vehicles match your filters. Please try different criteria.</p>
        </div>
      `;
    } else {
      const frag = document.createDocumentFragment();
      cars.forEach(car => frag.appendChild(createCard(car)));
      carGrid.appendChild(frag);
    }

    resultCount.textContent = cars.length;
    totalCount.textContent  = usedCars.length;
    headerCount.textContent = cars.length;
  }

  /* ----------------------------------------------------------
     FILTER — read inputs, filter array, re-render
  ---------------------------------------------------------- */
  function applyFilters() {
    const f = {
      minYear:    parseInt(minYear.value)    || null,
      maxYear:    parseInt(maxYear.value)    || null,
      maxMileage: parseInt(maxMileage.value) || null,
      minPrice:   parseInt(minPrice.value)   || null,
      maxPrice:   parseInt(maxPrice.value)   || null,
      makes:      getChecked('make'),
      colors:     getChecked('color'),
    };

    let results = usedCars.filter(car => {
      if (f.minYear    && car.year    < f.minYear)    return false;
      if (f.maxYear    && car.year    > f.maxYear)    return false;
      if (f.maxMileage && car.mileage > f.maxMileage) return false;
      if (f.minPrice   && car.price   < f.minPrice)   return false;
      if (f.maxPrice   && car.price   > f.maxPrice)   return false;
      if (f.makes.length  && !f.makes.includes(car.make))   return false;
      if (f.colors.length && !f.colors.includes(car.color)) return false;
      return true;
    });

    renderCars(sortCars(results, sortSelect.value));
  }

  /* ----------------------------------------------------------
     SORT
  ---------------------------------------------------------- */
  function sortCars(cars, criterion) {
    const s = [...cars];
    switch (criterion) {
      case 'price-asc':   return s.sort((a, b) => a.price   - b.price);
      case 'price-desc':  return s.sort((a, b) => b.price   - a.price);
      case 'year-desc':   return s.sort((a, b) => b.year    - a.year);
      case 'year-asc':    return s.sort((a, b) => a.year    - b.year);
      case 'mileage-asc': return s.sort((a, b) => a.mileage - b.mileage);
      default: return s;
    }
  }

  /* ----------------------------------------------------------
     RESET
  ---------------------------------------------------------- */
  function resetFilters() {
    minYear.value    = '';
    maxYear.value    = '';
    minPrice.value   = '';
    maxPrice.value   = '';
    maxMileage.value = '';
    sortSelect.value = 'default';
    document.querySelectorAll('input[name="make"], input[name="color"]')
      .forEach(el => el.checked = false);
    renderCars(usedCars);
  }

  /* ----------------------------------------------------------
     EVENTS
  ---------------------------------------------------------- */
  btnApply.addEventListener('click', applyFilters);
  btnReset.addEventListener('click', resetFilters);
  sortSelect.addEventListener('change', applyFilters);
  [minYear, maxYear, minPrice, maxPrice].forEach(el =>
    el.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilters(); })
  );

  /* ----------------------------------------------------------
     INITIAL RENDER
  ---------------------------------------------------------- */
  renderCars(usedCars);

});