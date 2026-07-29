/* ---------------------------------------------------------------
   Steady — application logic
   ---------------------------------------------------------------
   The code is grouped into five parts, in this order:
     1. Data        — constants and the shape of what we store
     2. Storage     — reading and writing localStorage
     3. Helpers     — small date and maths functions
     4. Rendering   — functions that put data on the screen
     5. Events      — wiring buttons and inputs to the functions above

   Nothing here talks to a server. Every check-in stays in the
   browser's localStorage on the user's own device, which is a
   deliberate privacy decision for this subject matter.
   --------------------------------------------------------------- */


/* ============ 1. DATA ============ */

// localStorage keys. Prefixed so they don't collide with anything else.
const STORAGE_START_DATE = "steady.startDate";
const STORAGE_CHECKINS = "steady.checkins";

// A craving at or above this number triggers a coping strategy.
const HIGH_CRAVING_THRESHOLD = 6;

// Milestones worth calling out, in days.
const MILESTONES = [1, 7, 30, 60, 90, 180, 365, 730];

// Coping strategies. Kept as plain data so the list can grow
// without touching any of the logic below.
const COPING_STRATEGIES = [
  "Name five things you can see, four you can hear, and three you can touch. Grounding pulls you out of the spiral.",
  "Set a timer for ten minutes. Cravings peak and fade — you only have to outlast this one.",
  "Drink a full glass of cold water, slowly. Give your body something else to do.",
  "Text or call one person from your support list. You do not have to explain yourself, just make contact.",
  "Go outside and walk to the end of the block and back, even if it's brief.",
  "Breathe in for four counts, hold for four, out for six. Repeat ten times.",
  "Write down what you were doing in the hour before this started. Naming the trigger takes some of its power away.",
  "Do one small physical task — dishes, a bed, a countertop. Motion interrupts rumination.",
  "Remind yourself why you started. Say the reason out loud, not just in your head.",
  "Eat something. Hunger and low blood sugar make cravings harder to ride out."
];


/* ============ 2. STORAGE ============ */

/** Returns the saved recovery start date as a string, or null if not set yet. */
function loadStartDate() {
  return localStorage.getItem(STORAGE_START_DATE);
}

/** Saves the recovery start date. */
function saveStartDate(dateString) {
  localStorage.setItem(STORAGE_START_DATE, dateString);
}

/**
 * Returns all saved check-ins as an array.
 * Falls back to an empty array if nothing is stored or the data is corrupt,
 * so a bad value can never crash the app on load.
 */
function loadCheckins() {
  try {
    const raw = localStorage.getItem(STORAGE_CHECKINS);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    // Checking the shape of each entry, not just the type of the container.
    // Valid JSON can still hold the wrong objects, and a missing trigger or
    // craving would throw further down in renderInsights.
    return parsed.filter(entry =>
      entry
      && typeof entry.date === "string"
      && Number.isFinite(entry.craving)
      && typeof entry.trigger === "string"
    );
  } catch (error) {
    console.warn("Stored check-ins were unreadable, starting fresh.", error);
    return [];
  }
}

/** Writes the full check-in array back to localStorage. */
function saveCheckins(checkins) {
  localStorage.setItem(STORAGE_CHECKINS, JSON.stringify(checkins));
}


/* ============ 3. HELPERS ============ */

/** Today's date as YYYY-MM-DD, used as the unique key for a day. */
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Whole days between a YYYY-MM-DD string and today.
 * Both dates are normalised to midday before comparing so that daylight
 * saving shifts can't push the result off by one.
 */
function daysSince(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, day, 12, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((today - start) / msPerDay);
}

/** The next milestone above the current day count, or null if all are passed. */
function nextMilestone(dayCount) {
  return MILESTONES.find(milestone => milestone > dayCount) || null;
}

/** Picks a random coping strategy. */
function randomStrategy() {
  const index = Math.floor(Math.random() * COPING_STRATEGIES.length);
  return COPING_STRATEGIES[index];
}

/** Formats YYYY-MM-DD as a short readable date, e.g. "Jul 29". */
function formatShortDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}


/* ============ 4. RENDERING ============ */

/** Shows either the setup card or the three main cards, depending on state. */
function renderPanels() {
  const hasStartDate = Boolean(loadStartDate());
  document.getElementById("setup-panel").hidden = hasStartDate;
  document.getElementById("progress-panel").hidden = !hasStartDate;
  document.getElementById("checkin-panel").hidden = !hasStartDate;
  document.getElementById("history-panel").hidden = !hasStartDate;
}

/** Updates the day counter and the milestone line beneath it. */
function renderProgress() {
  const startDate = loadStartDate();
  if (!startDate) return;

  const dayCount = daysSince(startDate);
  document.getElementById("day-number").textContent = dayCount;

  const upcoming = nextMilestone(dayCount);
  const note = document.getElementById("milestone-note");

  if (MILESTONES.includes(dayCount)) {
    note.textContent = `Day ${dayCount} is a milestone. That is worth marking.`;
  } else if (upcoming) {
    const remaining = upcoming - dayCount;
    note.textContent = `${remaining} day${remaining === 1 ? "" : "s"} until day ${upcoming}.`;
  } else {
    note.textContent = "You are past every milestone on this list. Keep going.";
  }
}

/** Displays a coping strategy card with the given text. */
function showCoping(text) {
  document.getElementById("coping-text").textContent = text;
  document.getElementById("coping-panel").hidden = false;
}

/**
 * Renders the summary tiles above the history list:
 * a 7-day average craving and the most frequently named trigger.
 */
function renderInsights(checkins) {
  const container = document.getElementById("insights");

  if (checkins.length === 0) {
    container.innerHTML = "";
    return;
  }

  // Average craving across the seven most recent check-ins.
  const recent = checkins.slice(0, 7);
  const cravingTotal = recent.reduce((sum, entry) => sum + entry.craving, 0);
  const averageCraving = (cravingTotal / recent.length).toFixed(1);

  // Count how often each trigger appears, then take the highest.
  const triggerCounts = {};
  checkins.forEach(entry => {
    const trigger = entry.trigger.trim().toLowerCase();
    if (trigger) {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    }
  });

  const topTrigger = Object.keys(triggerCounts)
    .sort((a, b) => triggerCounts[b] - triggerCounts[a])[0];

  // Built with createElement rather than innerHTML. The most-named trigger is
  // derived from the free-text field, so it is user input and must be set with
  // textContent for the same reason the history list is.
  container.innerHTML = "";

  const tiles = [
    [averageCraving, "Avg craving, last 7"],
    [String(checkins.length), "Check-ins logged"],
    [topTrigger || "—", "Most named trigger"]
  ];

  tiles.forEach(([value, label]) => {
    const tile = document.createElement("div");
    tile.className = "insight";

    const valueEl = document.createElement("span");
    valueEl.className = "insight-value";
    valueEl.textContent = value;

    const labelEl = document.createElement("span");
    labelEl.className = "insight-label";
    labelEl.textContent = label;

    tile.append(valueEl, labelEl);
    container.appendChild(tile);
  });
}

/** Renders the list of past check-ins, newest first. */
function renderHistory() {
  const checkins = loadCheckins();
  const list = document.getElementById("history-list");

  renderInsights(checkins);

  if (checkins.length === 0) {
    list.innerHTML = `<li class="empty-note">No check-ins yet. Your first one will appear here.</li>`;
    return;
  }

  const moodFaces = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

  // textContent is used for the trigger so that anything the user typed
  // is treated as text, never as markup.
  list.innerHTML = "";
  checkins.forEach(entry => {
    const item = document.createElement("li");

    const date = document.createElement("span");
    date.className = "history-date";
    date.textContent = formatShortDate(entry.date);

    const mood = document.createElement("span");
    mood.textContent = moodFaces[entry.mood] || "";

    const trigger = document.createElement("span");
    trigger.className = "history-trigger";
    trigger.textContent = entry.trigger || "";

    const craving = document.createElement("span");
    craving.className = "history-craving";
    craving.textContent = `craving ${entry.craving}/10`;

    item.append(date, mood, trigger, craving);
    list.appendChild(item);
  });
}


/* ============ 5. EVENTS ============ */

// Tracks which mood button is currently selected. Null means none chosen yet.
let selectedMood = null;

/** Saves the recovery start date entered on the setup card. */
function handleSaveStartDate() {
  const input = document.getElementById("start-date-input");
  if (!input.value) {
    alert("Please choose a date first.");
    return;
  }
  saveStartDate(input.value);
  renderPanels();
  renderProgress();
  renderHistory();
}

/** Highlights the chosen mood button and remembers the value. */
function handleMoodClick(event) {
  const button = event.target.closest(".mood-btn");
  if (!button) return;

  document.querySelectorAll(".mood-btn")
    .forEach(other => other.classList.remove("selected"));

  button.classList.add("selected");
  selectedMood = Number(button.dataset.mood);
}

/** Keeps the number beside the slider in step with the slider itself. */
function handleCravingInput(event) {
  document.getElementById("craving-value").textContent = event.target.value;
}

/**
 * Saves today's check-in.
 * If a check-in already exists for today it is replaced rather than
 * duplicated, so the history holds one entry per day.
 */
function handleSaveCheckin() {
  if (selectedMood === null) {
    document.getElementById("checkin-status").textContent = "Choose a mood first.";
    return;
  }

  const craving = Number(document.getElementById("craving-slider").value);
  const trigger = document.getElementById("trigger-input").value.trim();

  const entry = {
    date: todayKey(),
    mood: selectedMood,
    craving: craving,
    trigger: trigger
  };

  const checkins = loadCheckins().filter(existing => existing.date !== entry.date);
  checkins.unshift(entry);
  saveCheckins(checkins);

  document.getElementById("checkin-status").textContent = "Saved. Come back tomorrow.";
  renderHistory();

  // A high craving is the moment a coping strategy is most useful,
  // so the card is opened automatically rather than waiting to be asked for.
  if (craving >= HIGH_CRAVING_THRESHOLD) {
    showCoping(randomStrategy());
    document.getElementById("coping-panel").scrollIntoView({ behavior: "smooth" });
  }
}

/** Clears everything after an explicit confirmation. */
function handleResetData() {
  const confirmed = confirm(
    "This erases your start date and every check-in on this device. This cannot be undone. Continue?"
  );
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_START_DATE);
  localStorage.removeItem(STORAGE_CHECKINS);
  location.reload();
}

/** Attaches every event listener and draws the initial screen. */
function init() {
  document.getElementById("save-start-date").addEventListener("click", handleSaveStartDate);
  document.getElementById("mood-row").addEventListener("click", handleMoodClick);
  document.getElementById("craving-slider").addEventListener("input", handleCravingInput);
  document.getElementById("save-checkin").addEventListener("click", handleSaveCheckin);
  document.getElementById("another-strategy").addEventListener("click", () => showCoping(randomStrategy()));
  document.getElementById("reset-data").addEventListener("click", handleResetData);

  renderPanels();
  renderProgress();
  renderHistory();
}

init();
