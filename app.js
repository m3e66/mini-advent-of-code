const daysIndex = Puzzles.definitions;
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const frame = document.getElementById('dayFrame');
const daySelect = document.getElementById('daySelect');
const searchInput = document.getElementById('searchInput');
const searchFilter = document.getElementById('searchFilter');
let frameObserver;

function renderDays(container, days) {
  container.replaceChildren(...days.map(day => {
    const link = document.createElement('a');
    link.className = 'puzzle-row';
    link.href = `#day/${day.day}`;
    const number = document.createElement('span');
    number.className = 'puzzle-day';
    number.textContent = `Day ${day.day}`;
    const description = document.createElement('span');
    const title = document.createElement('span');
    title.className = 'puzzle-title';
    title.textContent = day.title;
    const author = document.createElement('span');
    author.className = 'puzzle-author';
    author.textContent = day.author ? `by ${day.author}` : '';
    description.append(title);
    if (day.author) description.append(author);
    const kind = document.createElement('span');
    kind.className = 'puzzle-kind available';
    const solved = Progress.read(storage, day.day)?.solved;
    kind.textContent = solved ? '[* solved]' : '[open]';
    if (solved) kind.className = 'puzzle-kind gold';
    link.append(number, description, kind);
    return link;
  }));
}

function runSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = searchFilter.value;
  const matches = daysIndex.filter(day => {
    const fields = filter === 'all' ? [`day ${day.day}`, day.title, day.author] : [filter === 'day' ? `day ${day.day}` : day[filter]];
    return fields.some(value => value.toLowerCase().includes(query));
  });
  renderDays(document.getElementById('searchResults'), matches);
  document.getElementById('searchCount').textContent = `${matches.length} ${matches.length === 1 ? 'puzzle' : 'puzzles'}${query ? ' found' : ' in the archive'}`;
  document.getElementById('emptySearch').hidden = matches.length !== 0;
}

function showRoute(moveFocus = false) {
  const route = location.hash.slice(1) === 'main' ? 'home' : location.hash.slice(1) || 'home';
  const day = route.startsWith('day/') ? daysIndex.find(item => item.day === route.slice(4)) : null;
  const page = day ? 'puzzle' : ['home', 'days', 'search', 'about'].includes(route) ? route : 'notfound';
  document.querySelectorAll('.page').forEach(section => { section.hidden = section.id !== page; });
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === (day ? 'days' : page)) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (day) {
    daySelect.value = day.day;
    frame.title = `${day.title} — Day ${day.day}`;

    const source = `days/day${day.day}.html`;
    if (frame.getAttribute('src') !== source) {
      frameObserver?.disconnect();
      frame.style.height = '400px';
      const status = document.getElementById('readerStatus');
      status.textContent = 'Loading puzzle…';
      status.hidden = false;
      frame.src = source;
    } else resizeFrame();
  }
  document.title = `${day ? day.title : { home: 'Home', days: 'Puzzle archive', search: 'Search', about: 'About us', notfound: 'Page not found' }[page]} | Mini Advent of Code`;
  if (moveFocus) {
    document.getElementById('main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function resizeFrame() {
  if (document.getElementById('puzzle').hidden || !frame.contentDocument?.body) return;
  // Measure content instead of the viewport so shorter pages can shrink too.
  const height = Math.ceil(frame.contentDocument.body.getBoundingClientRect().height) + 12;
  frame.style.height = `${Math.max(height, 250)}px`;
}

frame.addEventListener('load', () => {
  frameObserver?.disconnect();
  if (!frame.contentDocument?.body) return;
  const status = document.getElementById('readerStatus');
  const loaded = frame.contentDocument.querySelector('#puzzleControls');
  status.hidden = Boolean(loaded);
  if (!loaded) status.textContent = 'This puzzle could not load. Reload the page or return to the archive.';
  frameObserver = new ResizeObserver(resizeFrame);
  frameObserver.observe(frame.contentDocument.body);
  resizeFrame();
});
window.addEventListener('resize', resizeFrame);
window.addEventListener('hashchange', () => showRoute(true));
daySelect.addEventListener('change', () => { location.hash = `day/${daySelect.value}`; });
searchInput.addEventListener('input', runSearch);
searchFilter.addEventListener('change', runSearch);
document.getElementById('clearSearch').addEventListener('click', () => {
  searchInput.value = '';
  searchFilter.value = 'all';
  runSearch();
  searchInput.focus();
});
daysIndex.forEach(day => daySelect.add(new Option(`Day ${day.day} — ${day.title}`, day.day)));
function refreshProgress() {
  document.querySelectorAll('[data-count="community"]').forEach(element => { element.textContent = String(daysIndex.length).padStart(2, '0'); });
  renderDays(document.getElementById('featuredDays'), daysIndex);
  renderDays(document.getElementById('communityDays'), daysIndex);
  runSearch();
  const stars = daysIndex.filter(day => Progress.read(storage, day.day)?.solved).length;
  document.getElementById('starCount').textContent = `${stars} / ${daysIndex.length}`;
}
window.addEventListener('storage', refreshProgress);
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'mini-advent-progress') refreshProgress();
});
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('main').focus();
});
refreshProgress();
showRoute();
