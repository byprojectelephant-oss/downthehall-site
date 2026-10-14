(() => {
  'use strict';
  const key = 'dthr_companion_hidden';
  let dismissed = false;
  try { dismissed = localStorage.getItem(key) === 'true'; } catch {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const companion = document.createElement('aside');
  companion.className = 'site-companion';
  companion.setAttribute('aria-label', 'Site helper');
  companion.innerHTML = `<div class="companion-panel" id="companion-panel" hidden>
    <h2>A little help down the hall</h2><p>Where would you like to go?</p>
    <a href="#page=resources">Find a worksheet</a>
    <a href="resources/life-skills-worksheets-for-adults-with-developmental-disabilities.html">Explore life skills</a>
    <a href="resources/worksheet-packs.html">Browse worksheet packs</a>
    <div class="companion-actions"><button type="button" data-close>Close</button><button type="button" data-hide>Hide helper</button></div>
    </div><button type="button" class="companion-launch" aria-expanded="false" aria-controls="companion-panel" aria-label="Open site helper">
    <img src="mascot-door.png" alt="" width="88" height="100"><span>Need a hand?</span></button>`;
  const restore = document.createElement('button');
  restore.type = 'button';
  restore.className = 'companion-restore';
  restore.textContent = 'Show site helper';
  const footer = document.querySelector('.site-footer');
  footer.before(companion, restore);
  const launch = companion.querySelector('.companion-launch');
  const panel = companion.querySelector('.companion-panel');
  let greetingTimer;
  function animate(className) {
    if (reduced.matches || document.hidden || companion.hidden) return;
    companion.classList.remove('companion-greet', 'companion-react');
    // Restart the short animation when the visitor deliberately interacts.
    void launch.offsetWidth;
    companion.classList.add(className);
  }
  function close(focus = false) {
    panel.hidden = true;
    launch.setAttribute('aria-expanded', 'false');
    if (focus) launch.focus();
  }
  function sync() {
    const wasHidden = companion.hidden;
    const eligible = ['page-home', 'page-resources'].some(id => document.getElementById(id)?.classList.contains('active'));
    const banner = document.getElementById('cookie-consent-banner');
    const consentOpen = banner && getComputedStyle(banner).display !== 'none';
    companion.hidden = dismissed || !eligible || consentOpen;
    restore.hidden = !dismissed || !eligible || consentOpen;
    document.body.classList.toggle('companion-visible', !companion.hidden);
    if (companion.hidden) {
      close();
      clearTimeout(greetingTimer);
      companion.classList.remove('companion-greet', 'companion-react');
    } else if (wasHidden) {
      clearTimeout(greetingTimer);
      greetingTimer = setTimeout(greet, 900);
    }
  }
  launch.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    launch.setAttribute('aria-expanded', 'true');
    animate('companion-react');
    panel.querySelector('a').focus();
  });
  companion.querySelector('[data-close]').addEventListener('click', () => close(true));
  companion.querySelector('[data-hide]').addEventListener('click', () => {
    dismissed = true;
    try { localStorage.setItem(key, 'true'); } catch {}
    sync(); restore.focus();
  });
  restore.addEventListener('click', () => {
    dismissed = false;
    try { localStorage.removeItem(key); } catch {}
    sync(); launch.focus();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) close(true); });
  document.addEventListener('click', event => { if (!companion.contains(event.target)) close(); });
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
  const observer = new MutationObserver(sync);
  document.querySelectorAll('.page').forEach(page => observer.observe(page, {attributes:true, attributeFilter:['class']}));
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) observer.observe(banner, {attributes:true, attributeFilter:['style']});
  function greet() {
    if (reduced.matches || document.hidden || companion.hidden || !panel.hidden || companion.matches(':hover') || companion.contains(document.activeElement)) return;
    const bounds = launch.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    animate('companion-greet');
  }
  launch.addEventListener('pointerenter', () => { if (panel.hidden) animate('companion-react'); });
  launch.addEventListener('focus', () => { if (panel.hidden) animate('companion-react'); });
  companion.addEventListener('animationend', () => companion.classList.remove('companion-greet', 'companion-react'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) companion.classList.remove('companion-greet', 'companion-react');
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) companion.classList.remove('companion-greet', 'companion-react');
  });
  greetingTimer = setTimeout(greet, 1200);
  setInterval(greet, 45000);
  sync();
})();
