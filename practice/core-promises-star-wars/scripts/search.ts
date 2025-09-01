// Методы, которые могут пригодиться:
// starWars.searchCharacters(query), 
// starWars.searchPlanets(query), 
// starWars.searchSpecies(query).
// starWars.getCharactersById(id), 
// starWars.getPlanetsById(id), 
// starWars.getSpeciesById(id)

type Resource = 'characters' | 'planets' | 'species';
type Mode = 'query' | 'id';
type SWEntity = Character | Planet | Species;

// --- DOM элементы ---
const resultWrap = document.getElementById('result-container') as HTMLElement;
const content = document.getElementById('content') as HTMLElement;
const spinner = document.getElementById('spinner') as HTMLElement;

const modeSel = document.getElementById('searchMode') as HTMLSelectElement;
const resSel = document.getElementById('resourceSelect') as HTMLSelectElement;
const input = document.getElementById('searchInput') as HTMLInputElement;
const goBtn = document.getElementById('searchBtn') as HTMLButtonElement;

// --- Вспомогательные ---
const safe = (v: unknown): string => {
  const d = document.createElement('div');
  d.textContent = String(v ?? '');
  return d.innerHTML;
};

const isLikelyUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^https?:\/\//i.test(v);

const linkify = (v: unknown): string =>
  isLikelyUrl(v)
    ? `<a href="${safe(v)}" target="_blank" rel="noopener noreferrer">${safe(
        v
      )}</a>`
    : safe(v);

// --- Ограничение списков ---
const MAX_LIST = 3;

const formatArrayLimited = (arr: unknown[]): string => {
  if (arr.length === 0) return '[]';

  const head = arr.slice(0, MAX_LIST);
  const tail = arr.slice(MAX_LIST);

  const li = (item: unknown): string =>
    `<li>${
      typeof item === 'object'
        ? `<pre style="white-space:pre-wrap">${safe(
            JSON.stringify(item, null, 2)
          )}</pre>`
        : linkify(item)
    }</li>`;

  if (tail.length === 0)
    return `<ul style="margin:0 0 0 1rem">${head.map(li).join('')}</ul>`;

  return `
    <ul style="margin:0 0 0 1rem">${head.map(li).join('')}</ul>
    <details style="margin-left:1rem;margin-top:6px">
      <summary>Show more (${tail.length})</summary>
      <ul style="margin:6px 0 0 1rem">${tail.map(li).join('')}</ul>
    </details>
  `;
};

const formatValue = (val: unknown): string => {
  if (Array.isArray(val)) return formatArrayLimited(val);
  if (val && typeof val === 'object') {
    return `<pre style="white-space:pre-wrap">${safe(
      JSON.stringify(val, null, 2)
    )}</pre>`;
  }
  return linkify(val);
};

// --- Рендер карточки ---
const renderCard = (obj: SWEntity): string => {
  const rows = Object.entries(obj as object)
    .filter(([k]) => k !== 'name')
    .map(
      ([key, value]) => `
      <div class="mb-2">
        <span style="font-weight:600">${safe(key)}:</span>
        <div>${formatValue(value)}</div>
      </div>
    `
    )
    .join('');

  const raw = safe(JSON.stringify(obj, null, 2));
  return `
    <section class="box" style="margin-bottom:12px">
      <h3 class="title is-5" style="margin-bottom:8px">${safe(
        obj.name ?? '(no name)'
      )}</h3>
      ${rows}
      <details style="margin-top:8px">
        <summary>Raw JSON</summary>
        <pre class="is-size-6" style="white-space:pre-wrap; margin-top:6px">${raw}</pre>
      </details>
    </section>
  `;
};

// --- Панель / спиннер ---
const showResultWrap = () => {
  resultWrap.classList.add('is-visible');
};
const hideResultWrap = () => {
  resultWrap.classList.remove('is-visible');
};
const showSpinner = () => {
  spinner.classList.add('is-visible');
};
const hideSpinner = () => {
  spinner.classList.remove('is-visible');
};
const render = (html: string) => {
  content.innerHTML = html;
  showResultWrap();
};

// --- Закрытие панели ---
const deleteBtn = resultWrap.querySelector('.delete') as HTMLElement | null;
if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    hideSpinner();
    hideResultWrap();
    content.innerHTML = '';
  });
}

// --- ID из URL ---
const extractIdFromUrl = (url: string | undefined | null): string | null => {
  const match = String(url ?? '').match(/\/(\d+)\/?$/);
  return match ? match[1] : null;
};

// ===============================
//  Замена URL -> имена (дженерики без Record)
// ===============================
async function replaceUrlFieldWithName<T, K extends keyof T>(
  obj: T,
  key: K,
  fetchById: (id: number) => Promise<BaseEntity | Film>
): Promise<T> {
  const id = extractIdFromUrl(String((obj as any)?.[key]));
  if (!id) return obj;
  try {
    const data = await fetchById(Number(id));
    (obj as any)[key] = (data as any).name ?? (data as any).title ?? 'unknown';
  } catch {
    (obj as any)[key] = 'unknown';
  }
  return obj;
}

async function replaceUrlArrayWithNames<T, K extends keyof T>(
  obj: T,
  key: K,
  fetchById: (id: number) => Promise<BaseEntity | Film>
): Promise<T> {
  const urls = Array.isArray((obj as any)?.[key])
    ? ((obj as any)[key] as string[])
    : [];
  if (!urls.length) return obj;

  try {
    const ids = urls.map(extractIdFromUrl).filter(Boolean) as string[];
    const rows = await Promise.all(ids.map((id) => fetchById(Number(id))));
    (obj as any)[key] = rows.map(
      (x) => (x as any).name ?? (x as any).title ?? 'unknown'
    );
  } catch {
    (obj as any)[key] = [];
  }
  return obj;
}

// --- Обогащение результатов ---
async function enrichCharacter(p: Character): Promise<Character> {
  await replaceUrlFieldWithName(p, 'homeworld', (id) => starWars.getPlanetsById(id));
  await replaceUrlArrayWithNames(p, 'species', (id) => starWars.getSpeciesById(id));
  await replaceUrlArrayWithNames(p, 'films', (id) => starWars.getFilmsById(id));
  await replaceUrlArrayWithNames(p, 'vehicles', (id) => starWars.getVehiclesById(id));
  await replaceUrlArrayWithNames(p, 'starships', (id) => starWars.getStarshipsById(id));
  return p;
}

async function enrichPlanet(pl: Planet): Promise<Planet> {
  await replaceUrlArrayWithNames(pl, 'residents', (id) => starWars.getCharactersById(id));
  return pl;
}

async function enrichSpecies(sp: Species): Promise<Species> {
  await replaceUrlFieldWithName(sp, 'homeworld', (id) => starWars.getPlanetsById(id));
  await replaceUrlArrayWithNames(sp, 'people', (id) => starWars.getCharactersById(id));
  return sp;
}

// --- Поиск по строке ---
async function searchByQuery(q: string, resource: Resource): Promise<void> {
  let data: ApiResponse<Character | Planet | Species>;
  if (resource === 'characters') data = await starWars.searchCharacters(q);
  else if (resource === 'planets') data = await starWars.searchPlanets(q);
  else data = await starWars.searchSpecies(q);

  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length === 0) {
    render('<p class="is-size-5">Nothing found.</p>');
    return;
  }

  if (resource === 'characters') await Promise.all((results as Character[]).map(enrichCharacter));
  else if (resource === 'planets') await Promise.all((results as Planet[]).map(enrichPlanet));
  else await Promise.all((results as Species[]).map(enrichSpecies));

  const titleMap: Record<Resource, string> = {
    characters: 'Results (people)',
    planets: 'Results (planets)',
    species: 'Results (species)',
  };

  const cards = (results as SWEntity[]).map((r) => renderCard(r)).join('');
  render(`<h2 class="title is-4">${titleMap[resource] ?? 'Results'}</h2>${cards}`);
}

// --- Поиск по ID ---
async function getById(id: number, resource: Resource): Promise<void> {
  let item: SWEntity;
  if (resource === 'characters') item = await starWars.getCharactersById(id);
  else if (resource === 'planets') item = await starWars.getPlanetsById(id);
  else item = await starWars.getSpeciesById(id);

  if (!item || Object.keys(item).length === 0) {
    render('<p class="is-size-5">Not found.</p>');
    return;
  }

  if (resource === 'characters') await enrichCharacter(item as Character);
  else if (resource === 'planets') await enrichPlanet(item as Planet);
  else await enrichSpecies(item as Species);

  const titleMap: Record<Resource, string> = {
    characters: 'Item (person)',
    planets: 'Item (planet)',
    species: 'Item (species)',
  };

  render(`<h2 class="title is-4">${titleMap[resource] ?? 'Item'}</h2>${renderCard(item)}`);
}

// --- Управление инпутом ---
const applyInputType = (): void => {
  if ((modeSel.value as Mode) === 'id') {
    input.type = 'number';
    input.placeholder = 'ID…';
    input.min = '1';
  } else {
    input.type = 'text';
    input.placeholder = 'Search…';
    input.removeAttribute('min');
  }
  input.value = '';
};
modeSel.addEventListener('change', applyInputType);
applyInputType();

// --- Запуск поиска ---
async function onGo() {
  const mode = modeSel.value as Mode;
  const resource = resSel.value as Resource;

  showResultWrap();
  render(`<p class="is-size-5">${mode === 'id' ? 'Loading by ID…' : 'Search…'}</p>`);
  showSpinner();

  try {
    if (mode === 'id') {
      const id = Number(input.value);
      if (!Number.isInteger(id) || id <= 0) {
        render('<p class="is-size-5">Введите корректный ID (целое число &gt;= 1).</p>');
        return;
      }
      await getById(id, resource);
    } else {
      const q = input.value.trim();
      if (!q) {
        render('<p class="is-size-5">Write Name.</p>');
        return;
      }
      await searchByQuery(q, resource);
    }
  } catch (err) {
    console.error('[Search] error:', err);
    render('<p class="is-size-5">Error. Try again.</p>');
  } finally {
    hideSpinner();
  }
}

goBtn.addEventListener('click', onGo);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onGo();
});

// --- Старт ---
hideSpinner();
hideResultWrap();