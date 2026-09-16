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
    ['work', 'Work and everyday reading', /job|work|reading-language\/functional|text-message|email|voicemail|delivery|data-warning|return-policy/],
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
    return { card, title, text, topicIds, index, date: card.dataset.added || '' };
  });

  const toolbar = document.createElement('div');
  toolbar.className = 'library-toolbar';
  toolbar.innerHTML = '<label for="library-topic">Find a topic<select id="library-topic"><option value="all">All topics</option></select></label><button type="button" class="filter-chip" id="library-reset">Clear filters</button><p id="library-count" role="status" aria-live="polite"></p>';
  const topicSelect = toolbar.querySelector('select');
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
  }
  window.applyFilters = function () { render(true); };
  window.sortResources = function (value) { sort.value = value; render(true); };
  topicSelect.addEventListener('change', () => render(true));
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
  render(true);
})();
