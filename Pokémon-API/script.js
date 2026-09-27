const API_BASE = "https://pokeapi.co/api/v2/pokemon/";

const TYPE_THEMES = {
  normal:   { strong: "#f0ee8c", soft: "#ece2cf" },
  fire:     { strong: "#c1502e", soft: "#f6ddce" },
  water:    { strong: "#2f6fa8", soft: "#d9e8f5" },
  electric: { strong: "#e3e709", soft: "#f5eac4" },
  grass:    { strong: "#3f7d43", soft: "#dcedd9" },
  ice:      { strong: "#3597a1", soft: "#d9f0f2" },
  fighting: { strong: "#a3402f", soft: "#f2dcd6" },
  poison:   { strong: "#7c4a9e", soft: "#e6dbf0" },
  ground:   { strong: "#8a6335", soft: "#ecdfc9" },
  flying:   { strong: "#5c7fa8", soft: "#dde7f2" },
  psychic:  { strong: "#b0447f", soft: "#f5dce9" },
  bug:      { strong: "#748c26", soft: "#e6edcf" },
  rock:     { strong: "#7c6e42", soft: "#e9e2cd" },
  ghost:    { strong: "#63548f", soft: "#e2ddef" },
  dragon:   { strong: "#4952a3", soft: "#dcdef0" },
  dark:     { strong: "#4b4136", soft: "#ded7ca" },
  steel:    { strong: "#5f6b73", soft: "#dbe1e4" },
  fairy:    { strong: "#c1638c", soft: "#f6dde9" },
};

/* DOM references, grabbed once */
const form = document.getElementById("search-form");
const input = document.getElementById("pokemon-input");
const searchBtn = document.getElementById("search-btn");
const statusArea = document.getElementById("status-area");
const recordSection = document.getElementById("record-section");

const elId = document.getElementById("pokemon-id");
const elTypeBadges = document.getElementById("type-badges");
const elArtwork = document.getElementById("pokemon-artwork");
const elName = document.getElementById("pokemon-name");
const elHeight = document.getElementById("pokemon-height");
const elWeight = document.getElementById("pokemon-weight");
const elAbilities = document.getElementById("abilities-list");
const elFieldNote = document.getElementById("field-note");
const elStats = document.getElementById("stats-list");
const elStamp = document.getElementById("record-stamp");

const STAT_LABELS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Attack",
  "special-defense": "Sp. Defense",
  speed: "Speed",
};

let isLoading = false;


function init() {
  resetUI(); // polished empty state on first load

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSearch(input.value);
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const name = chip.dataset.name;
      input.value = name;
      handleSearch(name);
    });
  });
}

/* SEARCH ORCHESTRATION */

async function handleSearch(rawValue) {
  if (isLoading) return; // guard against duplicate requests

  const name = normalizeName(rawValue);

  if (!name) {
    showError("Empty search", "Type a Pokémon name (e.g. \"pikachu\") before searching the journal.");
    return;
  }

  setLoadingState(true, name);

  try {
    const data = await fetchPokemon(name);
    renderPokemon(data);
  } catch (err) {
    showError(
      "We couldn't find that specimen",
      err.message === "not-found"
        ? `No Pokémon named "${name}" was found. Check the spelling and try again.`
        : "Something went wrong reaching the PokéAPI. Check your connection and try again."
    );
  } finally {
    setLoadingState(false);
  }
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

/* API CALL */

async function fetchPokemon(name) {
  let response;
  try {
    response = await fetch(`${API_BASE}${encodeURIComponent(name)}`);
  } catch (networkErr) {
    throw new Error("network");
  }

  if (!response.ok) {
    // PokeAPI returns 404 for unknown names
    throw new Error(response.status === 404 ? "not-found" : "network");
  }

  const data = await response.json();
  return data;
}

function setLoadingState(loading, name) {
  isLoading = loading;
  searchBtn.disabled = loading;

  if (loading) {
    recordSection.classList.add("hidden"); // hide stale results while fetching
    statusArea.innerHTML = `
      <div class="status-card loading" role="status">
        <div class="scanner" aria-hidden="true"></div>
        <div style="flex:1;">
          <p class="status-title">Scanning field database…</p>
          <p>Looking up "${escapeHTML(name)}" in the PokéAPI.</p>
          <div class="loading-track" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }
}

function showError(title, message) {
  recordSection.classList.add("hidden"); // don't leave stale data visible on failure
  statusArea.innerHTML = `
    <div class="status-card error" role="alert">
      <p class="status-title"><span aria-hidden="true">⚠</span> ${escapeHTML(title)}</p>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function resetUI() {
  recordSection.classList.add("hidden");
  statusArea.innerHTML = `
    <div class="status-card empty">
      <p class="status-title">Select a Pokémon to begin your field study.</p>
      <p>Try one of the quick-search buttons above, or type a name and press Enter.</p>
    </div>
  `;
}

/* RENDERING */

function renderPokemon(data) {
  statusArea.innerHTML = ""; // clear loading/empty/error messaging
  recordSection.classList.remove("hidden");

  elId.textContent = `#${String(data.id).padStart(3, "0")}`;
  elName.textContent = data.name;

  renderTypes(data.types);
  renderArtwork(data);
  renderPhysical(data);
  renderAbilities(data.abilities);
  renderStats(data.stats);
  renderFieldNote(data);
  renderStamp(data.types);

  updateTheme(data.types);
}

function renderTypes(types) {
  elTypeBadges.innerHTML = "";
  if (!Array.isArray(types) || types.length === 0) {
    elTypeBadges.innerHTML = `<span class="type-badge">Unknown</span>`;
    return;
  }
  types.forEach((t) => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = t?.type?.name || "Unknown";
    elTypeBadges.appendChild(badge);
  });
}

function renderArtwork(data) {
  const artwork =
    data?.sprites?.other?.["official-artwork"]?.front_default ||
    data?.sprites?.front_default ||
    null;

  if (artwork) {
    elArtwork.src = artwork;
    elArtwork.alt = `Official artwork of ${data.name}`;
    elArtwork.style.display = "block";
  } else {
    elArtwork.removeAttribute("src");
    elArtwork.alt = `No artwork available for ${data.name}`;
    elArtwork.style.display = "none";
  }
}

function renderPhysical(data) {
  // API gives height in decimetres and weight in hectograms
  const heightM = typeof data.height === "number" ? (data.height / 10).toFixed(1) : null;
  const weightKg = typeof data.weight === "number" ? (data.weight / 10).toFixed(1) : null;

  elHeight.textContent = heightM ? `${heightM} m` : "Unknown";
  elWeight.textContent = weightKg ? `${weightKg} kg` : "Unknown";
}

function renderAbilities(abilities) {
  elAbilities.innerHTML = "";

  if (!Array.isArray(abilities) || abilities.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No recorded abilities";
    elAbilities.appendChild(li);
    return;
  }

  abilities.forEach((a) => {
    const li = document.createElement("li");
    const abilityName = a?.ability?.name || "unknown";
    li.textContent = a?.is_hidden ? `${abilityName} (hidden)` : abilityName;
    elAbilities.appendChild(li);
  });
}

function renderStats(stats) {
  elStats.innerHTML = "";

  if (!Array.isArray(stats) || stats.length === 0) {
    elStats.innerHTML = "<p>No stat data available.</p>";
    return;
  }

  stats.forEach((s) => {
    const key = s?.stat?.name || "unknown";
    const label = STAT_LABELS[key] || key;
    const value = typeof s.base_stat === "number" ? s.base_stat : 0;
    const pct = Math.max(2, Math.min(100, Math.round((value / 255) * 100)));

    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <dt>${escapeHTML(label)}</dt>
      <dd>
        <div class="stat-track">
          <div class="stat-fill" style="width:0%" data-target="${pct}"></div>
        </div>
      </dd>
      <span class="stat-num">${value}</span>
    `;
    elStats.appendChild(row);
  });

  // Animate bars in on next frame so the width transition actually plays
  requestAnimationFrame(() => {
    document.querySelectorAll(".stat-fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.target}%`;
    });
  });
}

function renderFieldNote(data) {
  const primaryType = data?.types?.[0]?.type?.name || "unknown";
  elFieldNote.textContent = `Recorded specimen #${String(data.id).padStart(3, "0")} · primary typing: ${primaryType}. Entry generated from live PokéAPI response.`;
}

function renderStamp(types) {
  const primary = types?.[0]?.type?.name;
  elStamp.innerHTML = primary
    ? `${primary.toUpperCase()}<br>VERIFIED`
    : `VERIFIED<br>ENTRY`;
}

/* DYNAMIC TYPE THEME */

function updateTheme(types) {
  const primary = types?.[0]?.type?.name;
  const theme = TYPE_THEMES[primary] || TYPE_THEMES.normal;

  const root = document.documentElement.style;
  root.setProperty("--accent-strong", theme.strong);
  root.setProperty("--accent-soft", theme.soft);
  root.setProperty("--accent", theme.strong);
}

/* UTIL */

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", init);
