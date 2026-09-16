(function () {
  'use strict';
  const main = document.getElementById('resources-main');
  const search = document.getElementById('resource-search');
  const sort = document.getElementById('resource-sort');
  if (!main || !search || !sort) return;

  const topics = [
    ['home-safety', 'Home and safety', /home-safety|emergency|scam|fire-hazard|safety/],
    ['money', 'Money and shopping', /money|budget|bill|payment|deposit|price|coupon|cash|receipt|bank|pharmacy|backpack|print-job|grocery|shopping/],
    ['personal', 'Personal care and routines', /personal-care|hygiene|laundry|routine|glasses|haircut|charging|chore/],
    ['food', 'Food and cooking', /healthy-eating|food|meal|nutrition|fridge|pantry|leftover|microwave/],
    ['community', 'Community and travel', /community|bus|transit|travel|boarding|rideshare|library|entrance|queue|coat-check|lost-item/],
    ['work', 'Work and everyday reading', /job|workplace|work-shift|reading-language\/functional|text-message|email|voicemail|delivery|data-warning|return-policy/],
    ['math', 'Numbers and arithmetic', /math-numbers/],
    ['social', 'Communication and feelings', /social-emotional/],
    ['reading', 'Letters and word puzzles', /reading-language/],
    ['coloring', 'Coloring', /coloring-pages/],
  ];
  const seen = new Set();
  const entries = Array.from(main.querySelectorAll('.resource-card')).filter(card => {
    const key = card.getAttribute('href');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((card, index) => {
    const path = (card.dataset.pdf || card.getAttribute('href') || '').toLowerCase();
    const title = card.querySelector('.res-title')?.textContent.trim() || '';
    const matches = topics.filter(topic => topic[2].test(path));
    const topicIds = matches.map(topic => topic[0]);
    const text = [title, ...Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent), ...matches.map(topic => topic[1])].join(' ').toLowerCase();
    const image = card.querySelector('img');
    if (image) image.loading = 'lazy';
    const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent).join(' ');
    const level = /level[ -]?3|advanced/i.test(title + ' ' + tags) ? 'advanced' : /level[ -]?2|intermediate|developing|moderate/i.test(title + ' ' + tags) ? 'developing' : /level[ -]?1|beginner|foundational/i.test(title + ' ' + tags) ? 'foundational' : 'unspecified';
    return { card, title, text, topicIds, level, index, date: card.dataset.added || '' };
  });

  const toolbar = document.createElement('div');
  toolbar.className = 'library-toolbar';
  toolbar.innerHTML = '<label for="library-topic">Find a topic<select id="library-topic"><option value="all">All topics</option></select></label><button type="button" class="filter-chip" id="library-reset">Clear filters</button><p id="library-count" role="status" aria-live="polite"></p>';
  const topicSelect = toolbar.querySelector('select');
  const difficultyLabel = document.createElement('label');
  difficultyLabel.htmlFor = 'library-level';
  difficultyLabel.innerHTML = 'Difficulty<select id="library-level"><option value="all">All levels</option><option value="foundational">Foundational / Level 1</option><option value="developing">Developing / Level 2</option><option value="advanced">Advanced / Level 3</option><option value="unspecified">Not specified</option></select>';
  toolbar.insertBefore(difficultyLabel, toolbar.querySelector('button'));
  const difficulty = difficultyLabel.querySelector('select');
  topics.forEach(([value, label]) => {
    const count = entries.filter(entry => entry.topicIds.includes(value)).length;
    if (count) topicSelect.add(new Option(label + ' (' + count + ')', value));
  });
  const grid = document.createElement('div');
  grid.className = 'resource-grid library-results';
  grid.id = 'library-results';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'library-more';
  more.setAttribute('aria-controls', grid.id);
  const hint = document.createElement('p');
  hint.className = 'library-hint';
  hint.textContent = 'Choose a category or topic, or search for a skill such as bus, laundry, or counting. Open a worksheet to preview and download it.';
  // Keep the original HTML as the no-JavaScript catalog; move its cards into one searchable grid.
  main.replaceChildren(hint, toolbar, grid, more);
  const empty = document.getElementById('no-results-msg');
  main.insertBefore(empty, more);
  search.setAttribute('aria-label', 'Search worksheets by title or skill');
  search.placeholder = 'Search a skill, topic, or worksheet...';
  search.setAttribute('aria-controls', grid.id);
  let limit = 24;

  function render(reset) {
    if (reset) limit = 24;
    const words = (window.currentSearch || '').toLowerCase().split(/\s+/).filter(Boolean);
    const category = window.currentFilter || 'all';
    const filtered = entries.filter(entry => {
      const categories = (entry.card.dataset.filter || '').split(' ');
      return (category === 'all' || (category === 'guides' ? entry.card.dataset.type === 'guide' : categories.includes(category))) &&
        (topicSelect.value === 'all' || entry.topicIds.includes(topicSelect.value)) &&
        (difficulty.value === 'all' || entry.level === difficulty.value) &&
        words.every(word => entry.text.includes(word));
    });
    filtered.sort((a, b) => {
      if (sort.value === 'title') return a.title.localeCompare(b.title);
      // Unknown dates stay at the end in either direction; never invent historical dates.
      if (!a.date || !b.date) return Number(!a.date) - Number(!b.date) || a.index - b.index;
      return (sort.value === 'oldest' ? 1 : -1) * a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
    });
    grid.replaceChildren(...filtered.slice(0, limit).map(entry => {
      entry.card.style.display = '';
      return entry.card;
    }));
    const shown = Math.min(limit, filtered.length);
    toolbar.querySelector('#library-count').textContent = filtered.length ? 'Showing ' + shown + ' of ' + filtered.length + ' resources' : 'No matching resources';
    empty.style.display = filtered.length ? 'none' : 'block';
    more.hidden = shown >= filtered.length;
    more.textContent = 'Show more worksheets (' + (filtered.length - shown) + ' remaining)';
    document.querySelectorAll('#page-resources .filter-chip[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    if (!restoring && document.getElementById('page-resources').classList.contains('active')) saveState();
  }
  let restoring = false;
  function saveState() {
    const params = new URLSearchParams({page:'resources', category:window.currentFilter || 'all', topic:topicSelect.value, level:difficulty.value, sort:sort.value, q:search.value, limit:String(limit)});
    history.replaceState(null, '', '#' + params.toString());
  }
  const originalShowPage = window.showPage;
  window.showPage = function(id) {
    if (id === 'contact' || id === 'about') { location.href = id + '.html'; return false; }
    const result = originalShowPage(id);
    if (!restoring) {
      if (id === 'resources') saveState();
      else history.pushState(null, '', '#page=' + id);
    }
    return result;
  };
  window.setFilter = function(el, category) {
    window.currentFilter = category;
    topicSelect.value = 'all';
    difficulty.value = 'all';
    document.querySelectorAll('.filter-chip[data-filter]').forEach(button => button.classList.toggle('active', button === el));
    render(true);
  };
  window.applyFilters = function () { render(true); };
  window.sortResources = function (value) { sort.value = value; render(true); };
  topicSelect.addEventListener('change', () => render(true));
  difficulty.addEventListener('change', () => render(true));
  more.addEventListener('click', () => {
    const previous = limit;
    limit += 24;
    render(false);
    grid.children[previous]?.focus();
  });
  toolbar.querySelector('#library-reset').addEventListener('click', () => {
    topicSelect.value = 'all';
    window.currentSearch = '';
    search.value = '';
    document.getElementById('search-clear').style.display = 'none';
    window.setFilter(document.querySelector('.filter-chip[data-filter="all"]'), 'all');
    search.focus();
  });
  const homeSearch = document.querySelector('.search-bar input');
  homeSearch.setAttribute('aria-label', 'Search all worksheets');
  const form = document.createElement('form');
  homeSearch.parentElement.replaceWith(form);
  form.className = 'search-bar';
  form.appendChild(homeSearch);
  const submit = document.createElement('button');
  submit.type = 'submit'; submit.textContent = 'Search'; submit.className = 'filter-chip';
  form.appendChild(submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    window.currentFilter = 'all'; topicSelect.value = 'all'; difficulty.value = 'all';
    search.value = homeSearch.value;
    window.searchResources(search.value);
    window.showPage('resources');
    render(true); search.focus();
  });
  document.querySelectorAll('#page-home .cat-card').forEach((card, index) => {
    const category = ['life-skills','math','reading','social-emotional','guides',null,'coloring'][index];
    if (!category) { card.removeAttribute('onclick'); return; }
    const button = document.createElement('button');
    button.type = 'button'; button.className = card.className; button.innerHTML = card.innerHTML;
    const count = entries.filter(entry => category === 'guides' ? entry.card.dataset.type === 'guide' : (entry.card.dataset.filter || '').split(' ').includes(category)).length;
    button.querySelector('.cat-count').textContent = count + ' resources';
    button.addEventListener('click', () => {
      search.value = ''; window.currentSearch = ''; window.clearSearch();
      window.setFilter(document.querySelector('.filter-chip[data-filter="' + category + '"]'), category);
      window.showPage('resources');
    });
    card.replaceWith(button);
  });
  document.querySelectorAll('[onclick*="showPage"]').forEach(link => {
    if (link.tagName === 'A') link.addEventListener('click', event => event.preventDefault());
  });
  function restore() {
    const params = new URLSearchParams(location.hash.slice(1));
    restoring = true;
    const category = params.get('category') || 'all';
    const chip = document.querySelector('.filter-chip[data-filter="' + (['all','life-skills','math','reading','social-emotional','guides','coloring'].includes(category) ? category : 'all') + '"]');
    window.setFilter(chip, chip.dataset.filter);
    for (const [select, key, fallback] of [[topicSelect,'topic','all'],[difficulty,'level','all'],[sort,'sort','newest']]) {
      select.value = params.get(key) || fallback;
      if (!select.value) select.value = fallback;
    }
    search.value = params.get('q') || ''; window.currentSearch = search.value.toLowerCase().trim();
    document.getElementById('search-clear').style.display = search.value ? 'flex' : 'none';
    limit = Math.max(24, Math.min(entries.length, Number(params.get('limit')) || 24));
    const page = params.get('page') || 'home';
    originalShowPage(['home','resources','support'].includes(page) ? page : 'home');
    render(false); restoring = false;
  }
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  restore();
})();
