const startInput = document.getElementById("startFull");
const endInput = document.getElementById("endFull");
const startAdjustDiv = document.getElementById("startAdjust");
const endAdjustDiv = document.getElementById("endAdjust");
const slaResult = document.getElementById("slaResult");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const fields = [
  { label: "Day", min: 1, max: 31, getter: "getDate", setter: "setDate" },
  {
    label: "Month",
    min: 1,
    max: 12,
    getter: "getMonth",
    setter: "setMonth",
  },
  {
    label: "Year",
    min: 1970,
    max: 2100,
    getter: "getFullYear",
    setter: "setFullYear",
  },
  {
    label: "Hour",
    min: 0,
    max: 23,
    getter: "getHours",
    setter: "setHours",
  },
  {
    label: "Minute",
    min: 0,
    max: 59,
    getter: "getMinutes",
    setter: "setMinutes",
  },
];

const now = new Date();

const startPicker = flatpickr(startInput, {
  enableTime: true,
  dateFormat: "d.m.Y H:i",
  defaultDate: now,
  time_24hr: true,
  onChange: updateSLA,
  locale: "ru",
  disableMobile: true,
  clickOpens: false, //отключил открытие формы по нажатию на поле Input
  allowInput: true, //редактируемое поле Input
});
const endPicker = flatpickr(endInput, {
  enableTime: true,
  dateFormat: "d.m.Y H:i",
  defaultDate: now,
  time_24hr: true,
  onChange: updateSLA,
  locale: "ru",
  disableMobile: true,
  clickOpens: false, //отключил открытие формы по нажатию на поле Input
  allowInput: true, //редактируемое поле Input
});

document
  .getElementById("startCalendarBtn")
  .addEventListener("click", () => startPicker.open());
//startInput.addEventListener("click", () => startPicker.open());
document
  .getElementById("endCalendarBtn")
  .addEventListener("click", () => endPicker.open());
//endInput.addEventListener("click", () => endPicker.open());

function buildAdjustControls(container, picker, prefix) {
  fields.forEach((f) => {
    const block = document.createElement("div");
    block.className = "adjust-item";

    const btnUp = document.createElement("button");
    btnUp.textContent = "▲";
    btnUp.tabIndex = -1;

    const input = document.createElement("input");
    input.type = "number";
    input.id = prefix + "_" + f.label.toLowerCase();
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
  let date = picker.selectedDates[0] || new Date();
  const newDate = new Date(date);
  if (field.getter === "getMonth") delta = delta;
  newDate[field.setter](date[field.getter]() + delta);
  picker.setDate(newDate, true);
  updateDisplays(picker, prefix);
  updateSLA();
}

function updateFromFields(picker, prefix) {
  const d = parseInt(document.getElementById(prefix + "_day").value) || 1;
  const m =
    (parseInt(document.getElementById(prefix + "_month").value) || 1) - 1;
  const y = parseInt(document.getElementById(prefix + "_year").value) || 2025;
  const h = parseInt(document.getElementById(prefix + "_hour").value) || 0;
  const min = parseInt(document.getElementById(prefix + "_minute").value) || 0;
  const newDate = new Date(y, m, d, h, min);
  picker.setDate(newDate, true);
  updateSLA();
}

function updateDisplays(picker, prefix) {
  const date = picker.selectedDates[0] || new Date();
  document.getElementById(prefix + "_day").value = date
    .getDate()
    .toString()
    .padStart(2, "0");
  document.getElementById(prefix + "_month").value = (date.getMonth() + 1)
    .toString()
    .padStart(2, "0");
  document.getElementById(prefix + "_year").value = date.getFullYear();
  document.getElementById(prefix + "_hour").value = date
    .getHours()
    .toString()
    .padStart(2, "0");
  document.getElementById(prefix + "_minute").value = date
    .getMinutes()
    .toString()
    .padStart(2, "0");
}

function updateSLA() {
  updateDisplays(startPicker, "start");
  updateDisplays(endPicker, "end");

  const start = startPicker.selectedDates[0];
  const end = endPicker.selectedDates[0];

  if (!start || !end) {
    slaResult.textContent = "Длительность: —";
    return;
  }

  const diffMs = end - start;
  if (diffMs < 0) {
    slaResult.textContent = "Конечная дата раньше начальной!";
    return;
  }

  const totalMinutes = Math.floor(diffMs / 60000);

  // Русские значения
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Английские значения (d/h/min)
  const daysEn = Math.floor(totalMinutes / (60 * 24));
  const hoursEn = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutesEn = totalMinutes % 60;

  let ruText = `${totalHours} ч ${minutes} мин`;

  if (totalHours >= 24) {
    const daysRu = Math.floor(totalHours / 24);
    const hoursRu = totalHours % 24;
    ruText += `<br><span style="font-size: 90%">${daysRu} д ${hoursRu} ч ${minutes} мин</span>`;
  }

  let enText = "";
  if (daysEn > 0) {
    enText = `${daysEn} d ${hoursEn} h ${minutesEn} min`;
  } else {
    enText = `${hoursEn} h ${minutesEn} min`;
  }

  // Итог: русский блок + ниже английский блок
  slaResult.innerHTML =
    `${ruText}` +
    `<br><span style="font-size: 90%; opacity: 0.9">${enText}</span>`;
}

const themeLink = document.getElementById("theme-style");

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

updateSLA();
