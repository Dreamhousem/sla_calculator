// ------------------------------
// DOM
// ------------------------------
const startInput = document.getElementById("startFull");
const endInput = document.getElementById("endFull");
const startAdjustDiv = document.getElementById("startAdjust");
const endAdjustDiv = document.getElementById("endAdjust");

const resultRu = document.getElementById("resultRu");
const resultEn = document.getElementById("resultEn");
const errorMsg = document.getElementById("errorMsg");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeLink = document.getElementById("theme-style");

const dateOrderSelect = document.getElementById("dateOrder");
const dateSepSelect = document.getElementById("dateSep");
const showSecondsCheckbox = document.getElementById("showSeconds");

// ------------------------------
// Helpers: localStorage settings
// ------------------------------
const SETTINGS_KEY = "date_format_settings";

function loadDateFormatSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { order: "DMY", sep: ".", seconds: false };
    const s = JSON.parse(raw);
    return {
      order: s.order === "YMD" ? "YMD" : "DMY",
      sep: s.sep === "-" ? "-" : ".",
      seconds: Boolean(s.seconds),
    };
  } catch {
    return { order: "DMY", sep: ".", seconds: false };
  }
}

function saveDateFormatSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getCurrentFormatSettings() {
  return {
    order: dateOrderSelect.value === "YMD" ? "YMD" : "DMY",
    sep: dateSepSelect.value === "-" ? "-" : ".",
    seconds: showSecondsCheckbox.checked,
  };
}

// Flatpickr format string from settings
function buildFlatpickrFormat({ order, sep, seconds }) {
  const datePart = order === "YMD" ? `Y${sep}m${sep}d` : `d${sep}m${sep}Y`;
  const timePart = seconds ? "H:i:S" : "H:i";
  return `${datePart} ${timePart}`;
}

// ------------------------------
// Flatpickr init
// ------------------------------
const now = new Date();

const startPicker = flatpickr(startInput, {
  enableTime: true,
  time_24hr: true,
  defaultDate: now,
  locale: "ru",
  disableMobile: true,
  allowInput: true,
  clickOpens: false,
  onChange: updateAll,
});

const endPicker = flatpickr(endInput, {
  enableTime: true,
  time_24hr: true,
  defaultDate: now,
  locale: "ru",
  disableMobile: true,
  allowInput: true,
  clickOpens: false,
  onChange: updateAll,
});

// open calendar only via buttons
document
  .getElementById("startCalendarBtn")
  .addEventListener("click", () => startPicker.open());

document
  .getElementById("endCalendarBtn")
  .addEventListener("click", () => endPicker.open());

// ------------------------------
// Adjust controls
// ------------------------------
const fields = [
  { label: "Day", min: 1, max: 31, getter: "getDate", setter: "setDate" },
  { label: "Month", min: 1, max: 12, getter: "getMonth", setter: "setMonth" },
  {
    label: "Year",
    min: 1970,
    max: 2100,
    getter: "getFullYear",
    setter: "setFullYear",
  },
  { label: "Hour", min: 0, max: 23, getter: "getHours", setter: "setHours" },
  {
    label: "Minute",
    min: 0,
    max: 59,
    getter: "getMinutes",
    setter: "setMinutes",
  },
  {
    label: "Second",
    min: 0,
    max: 59,
    getter: "getSeconds",
    setter: "setSeconds",
  },
];

function buildAdjustControls(container, picker, prefix) {
  fields.forEach((f) => {
    const block = document.createElement("div");
    block.className = "adjust-item";

    const btnUp = document.createElement("button");
    btnUp.textContent = "▲";
    btnUp.tabIndex = -1;

    const input = document.createElement("input");
    input.type = "number";
    input.id = `${prefix}_${f.label.toLowerCase()}`;
    input.min = f.min;
    input.max = f.max;
    input.tabIndex = 3;

    input.addEventListener("input", () => updateFromFields(picker, prefix));
    input.addEventListener("focus", function () {
      this.select();
    });

    const btnDown = document.createElement("button");
    btnDown.textContent = "▼";
    btnDown.tabIndex = -1;

    btnUp.addEventListener("click", () => adjustField(picker, f, 1, prefix));
    btnDown.addEventListener("click", () => adjustField(picker, f, -1, prefix));

    block.appendChild(btnUp);
    block.appendChild(input);
    block.appendChild(btnDown);
    container.appendChild(block);
  });
}

buildAdjustControls(startAdjustDiv, startPicker, "start");
buildAdjustControls(endAdjustDiv, endPicker, "end");

function adjustField(picker, field, delta, prefix) {
  const date = picker.selectedDates[0] || new Date();
  const newDate = new Date(date);
  newDate[field.setter](date[field.getter]() + delta);
  picker.setDate(newDate, true);
  updateDisplays(picker, prefix);
}

function updateFromFields(picker, prefix) {
  const d = parseInt(document.getElementById(prefix + "_day").value) || 1;
  const m =
    (parseInt(document.getElementById(prefix + "_month").value) || 1) - 1;
  const y = parseInt(document.getElementById(prefix + "_year").value) || 2025;
  const h = parseInt(document.getElementById(prefix + "_hour").value) || 0;
  const min = parseInt(document.getElementById(prefix + "_minute").value) || 0;
  const sec = parseInt(document.getElementById(prefix + "_second")?.value) || 0;

  const newDate = new Date(y, m, d, h, min, sec);
  picker.setDate(newDate, true);
}

function updateDisplays(picker, prefix) {
  const date = picker.selectedDates[0] || new Date();
  document.getElementById(prefix + "_day").value = String(
    date.getDate(),
  ).padStart(2, "0");
  document.getElementById(prefix + "_month").value = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  document.getElementById(prefix + "_year").value = date.getFullYear();
  document.getElementById(prefix + "_hour").value = String(
    date.getHours(),
  ).padStart(2, "0");
  document.getElementById(prefix + "_minute").value = String(
    date.getMinutes(),
  ).padStart(2, "0");
  const secEl = document.getElementById(prefix + "_second");
  if (secEl) {
    secEl.value = String(date.getSeconds()).padStart(2, "0");
  }
}

// ------------------------------
// Date parsing for paste/input
// ------------------------------
function parseDateString(raw) {
  if (!raw) return null;
  let s = String(raw).trim();

  s = s.replace("T", " ");
  s = s.replace(/\s+/g, " ");

  const match = s.match(
    /(\d{1,4})[.\-\/](\d{1,2})[.\-\/](\d{1,4})\s+(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?/,
  );
  if (!match) return null;

  const a = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  const c = parseInt(match[3], 10);
  const hh = parseInt(match[4], 10);
  const mm = parseInt(match[5], 10);
  const ss = match[6] ? parseInt(match[6], 10) : 0;

  let year, month, day;
  if (String(match[1]).length === 4) {
    year = a;
    month = b;
    day = c;
  } else if (String(match[3]).length === 4) {
    day = a;
    month = b;
    year = c;
  } else {
    if (a > 31) {
      year = a;
      month = b;
      day = c;
    } else {
      day = a;
      month = b;
      year = c;
    }
  }

  if (year < 1970 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  if (ss < 0 || ss > 59) return null;

  const dt = new Date(year, month - 1, day, hh, mm, ss);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day ||
    dt.getHours() !== hh ||
    dt.getMinutes() !== mm ||
    dt.getSeconds() !== ss
  ) {
    return null;
  }

  return dt;
}

function showError(text) {
  errorMsg.hidden = false;
  errorMsg.textContent = text;
}

function clearError() {
  errorMsg.hidden = true;
  errorMsg.textContent = "";
}

function attachSmartInputHandlers(inputEl, picker) {
  inputEl.addEventListener("paste", (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const dt = parseDateString(pasted);
    if (!dt) {
      showError("Не удалось распознать дату/время. Проверь формат.");
      return;
    }

    e.preventDefault();
    clearError();
    picker.setDate(dt, true);
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const dt = parseDateString(inputEl.value);
      if (!dt) {
        showError("Некорректная дата/время. Пример: 25.07.2025 13:03");
        return;
      }
      clearError();
      picker.setDate(dt, true);

      inputEl.blur();
    }
  });

  inputEl.addEventListener("blur", () => {
    const v = inputEl.value.trim();
    if (!v) return;
    const dt = parseDateString(v);
    if (!dt) {
      showError("Некорректная дата/время. Пример: 2026-02-03 16:30:00");
      return;
    }
    clearError();
    picker.setDate(dt, true);
  });
}

attachSmartInputHandlers(startInput, startPicker);
attachSmartInputHandlers(endInput, endPicker);

// ------------------------------
// Duration formatting RU/EN (SMART + optional seconds)
// ------------------------------
function formatDurationParts(diffMs, withSeconds) {
  if (withSeconds) {
    const totalSeconds = Math.floor(diffMs / 1000);
    const seconds = totalSeconds % 60;

    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;

    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;

    const days = Math.floor(totalHours / 24);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalHours,
      totalMinutes,
      totalSeconds,
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const minutes = totalMinutes % 60;

  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;

  const days = Math.floor(totalHours / 24);

  return {
    days,
    hours,
    minutes,
    seconds: 0,
    totalHours,
    totalMinutes,
    totalSeconds: totalMinutes * 60,
  };
}

function buildTimePartsRu({ days, hours, minutes, seconds }, withSeconds) {
  const parts = [];
  if (days > 0) parts.push(`${days} д`);
  if (hours > 0) parts.push(`${hours} ч`);
  if (minutes > 0) parts.push(`${minutes} мин`);
  if (withSeconds && seconds > 0) parts.push(`${seconds} сек`);
  return parts;
}

function buildTimePartsEn({ days, hours, minutes, seconds }, withSeconds) {
  const parts = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (withSeconds && seconds > 0) parts.push(`${seconds} sec`);
  return parts;
}

function formatRuSmart(parts, withSeconds) {
  // если вообще нули (редко, но пусть будет)
  const hasAny =
    parts.days ||
    parts.hours ||
    parts.minutes ||
    (withSeconds && parts.seconds);
  if (!hasAny) return "Длительность: 0 мин";

  // спец-кейс: меньше часа
  if (parts.days === 0 && parts.hours === 0) {
    const smallParts = [];
    if (parts.minutes > 0) smallParts.push(`${parts.minutes} мин`);
    if (withSeconds && parts.seconds > 0)
      smallParts.push(`${parts.seconds} сек`);
    // если вдруг 0 мин, но есть секунды
    if (smallParts.length === 0 && withSeconds)
      smallParts.push(`${parts.seconds} сек`);
    return "Длительность: " + smallParts.join(" ");
  }

  // меньше дня
  if (parts.days === 0) {
    const smallParts = [];
    if (parts.hours > 0) smallParts.push(`${parts.hours} ч`);
    if (parts.minutes > 0) smallParts.push(`${parts.minutes} мин`);
    if (withSeconds && parts.seconds > 0)
      smallParts.push(`${parts.seconds} сек`);
    return "Длительность: " + smallParts.join(" ");
  }

  // 1+ дней
  const p = buildTimePartsRu(parts, withSeconds);
  return "Длительность: " + p.join(" ");
}

function formatEnSmart(parts, withSeconds) {
  const hasAny =
    parts.days ||
    parts.hours ||
    parts.minutes ||
    (withSeconds && parts.seconds);
  if (!hasAny) return "Duration: 0 min";

  if (parts.days === 0 && parts.hours === 0) {
    const smallParts = [];
    if (parts.minutes > 0) smallParts.push(`${parts.minutes} min`);
    if (withSeconds && parts.seconds > 0)
      smallParts.push(`${parts.seconds} sec`);
    if (smallParts.length === 0 && withSeconds)
      smallParts.push(`${parts.seconds} sec`);
    return "Duration: " + smallParts.join(" ");
  }

  if (parts.days === 0) {
    const smallParts = [];
    if (parts.hours > 0) smallParts.push(`${parts.hours} h`);
    if (parts.minutes > 0) smallParts.push(`${parts.minutes} min`);
    if (withSeconds && parts.seconds > 0)
      smallParts.push(`${parts.seconds} sec`);
    return "Duration: " + smallParts.join(" ");
  }

  const p = buildTimePartsEn(parts, withSeconds);
  return "Duration: " + p.join(" ");
}

function stripDurationPrefix(text) {
  if (!text) return "";
  return String(text)
    .replace(/^Длительность:\s*/i, "")
    .replace(/^Duration:\s*/i, "")
    .trim();
}

// ------------------------------
// Apply date format settings to pickers
// ------------------------------
function applyDateFormatSettings(settings) {
  const fmt = buildFlatpickrFormat(settings);

  dateOrderSelect.value = settings.order;
  dateSepSelect.value = settings.sep;
  showSecondsCheckbox.checked = settings.seconds;

  startPicker.set("dateFormat", fmt);
  endPicker.set("dateFormat", fmt);

  if (startPicker.selectedDates[0])
    startPicker.setDate(startPicker.selectedDates[0], false);
  if (endPicker.selectedDates[0])
    endPicker.setDate(endPicker.selectedDates[0], false);
}

// ------------------------------
// Update all
// ------------------------------
function updateAll() {
  updateDisplays(startPicker, "start");
  updateDisplays(endPicker, "end");
  updateDuration();
}

function updateDuration() {
  clearError();

  const start = startPicker.selectedDates[0];
  const end = endPicker.selectedDates[0];

  if (!start || !end) {
    resultRu.textContent = "Длительность: —";
    resultEn.textContent = "Duration: —";
    return;
  }

  const diffMs = end - start;
  if (diffMs < 0) {
    resultRu.textContent = "Конечная дата раньше начальной!";
    resultEn.textContent = "End is earlier than Start!";
    return;
  }

  const withSeconds = showSecondsCheckbox.checked;
  const parts = formatDurationParts(diffMs, withSeconds);

  resultRu.textContent = formatRuSmart(parts, withSeconds);
  resultEn.textContent = formatEnSmart(parts, withSeconds);
}

// ------------------------------
// Copy buttons (copy only time)
// ------------------------------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.getAttribute("data-copy");
    const el = document.getElementById(id);
    if (!el) return;

    const textToCopy = stripDurationPrefix(el.textContent);

    const ok = await copyText(textToCopy);
    const old = btn.textContent;

    btn.textContent = ok ? "Скопировано" : "Ошибка";
    setTimeout(() => (btn.textContent = old), 900);
  });
});

// ------------------------------
// Theme
// ------------------------------
function setCalendarTheme(theme) {
  themeLink.href = `https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/${theme}.css`;
}

const savedTheme = localStorage.getItem("theme") || "light";
document.body.classList.toggle("dark", savedTheme === "dark");
themeToggleBtn.textContent =
  savedTheme === "dark" ? "Светлая тема" : "Тёмная тема";
setCalendarTheme(savedTheme === "dark" ? "dark" : "light");

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggleBtn.textContent = isDark ? "Светлая тема" : "Тёмная тема";
  setCalendarTheme(isDark ? "dark" : "light");
});

// ------------------------------
// Date format settings UI events
// ------------------------------
const savedFmt = loadDateFormatSettings();
applyDateFormatSettings(savedFmt);

function onFormatSettingsChange() {
  const s = getCurrentFormatSettings();
  saveDateFormatSettings(s);
  applyDateFormatSettings(s);
  updateAll();
}

dateOrderSelect.addEventListener("change", onFormatSettingsChange);
dateSepSelect.addEventListener("change", onFormatSettingsChange);
showSecondsCheckbox.addEventListener("change", onFormatSettingsChange);

// initial draw
updateAll();
