const STORAGE_KEY = "avg-calc:courses";
const LANG_KEY = "avg-calc:lang";

const translations = {
  en: {
    title: "Undergraduate Average Calculator",
    subtitle: "Add each course's credit points and grade to see your weighted average.",
    courseName: "Course name",
    courseNamePlaceholder: "e.g. Calculus 1",
    creditPoints: "Credit points",
    creditPointsPlaceholder: "e.g. 5",
    grade: "Grade",
    gradePlaceholder: "e.g. 90",
    addCourse: "Add course",
    course: "Course",
    credits: "Credits",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    remove: "Remove",
    calculate: "Calculate",
    clearAll: "Clear all",
    emptyState: "No courses added yet.",
    untitledCourse: "Untitled course",
    errorCredits: "Credit points must be a positive number.",
    errorGrade: "Grade must be a number between 0 and 100.",
    resultEmpty: "Add at least one course to calculate an average.",
    resultText: (avg) => `Current average: ${avg}`,
    confirmClear: "Remove all courses?",
    changeLanguage: "Change language",
  },
  he: {
    title: "מחשבון ממוצע לתואר",
    subtitle: "הוסיפו את נקודות הזכות והציון של כל קורס כדי לראות את הממוצע המשוקלל.",
    courseName: "שם הקורס",
    courseNamePlaceholder: "לדוגמה: חשבון אינפיניטסימלי 1",
    creditPoints: "נקודות זכות",
    creditPointsPlaceholder: "לדוגמה: 5",
    grade: "ציון",
    gradePlaceholder: "לדוגמה: 90",
    addCourse: "הוסף קורס",
    course: "קורס",
    credits: 'נק"ז',
    edit: "ערוך",
    save: "שמור",
    cancel: "ביטול",
    remove: "הסר",
    calculate: "חשב",
    clearAll: "נקה הכול",
    emptyState: "עדיין לא נוספו קורסים.",
    untitledCourse: "קורס ללא שם",
    errorCredits: "נקודות הזכות חייבות להיות מספר חיובי.",
    errorGrade: "הציון חייב להיות מספר בין 0 ל-100.",
    resultEmpty: "יש להוסיף לפחות קורס אחד כדי לחשב ממוצע.",
    resultText: (avg) => `הממוצע הנוכחי: ${avg}`,
    confirmClear: "למחוק את כל הקורסים?",
    changeLanguage: "החלף שפה",
  },
};

let currentLang = loadLang();

function loadLang() {
  try {
    return localStorage.getItem(LANG_KEY) || "en";
  } catch {
    return "en";
  }
}

function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // localStorage unavailable — language choice just won't persist
  }
}

function t(key) {
  return translations[currentLang][key];
}

/** @type {{id: string, name: string, credits: number, grade: number}[]} */
let courses = loadCourses();

/** id of the course whose grade is currently being edited inline, or null */
let editingId = null;

const form = document.getElementById("course-form");
const nameInput = document.getElementById("course-name");
const creditsInput = document.getElementById("course-credits");
const gradeInput = document.getElementById("course-grade");
const formError = document.getElementById("form-error");
const courseList = document.getElementById("course-list");
const emptyState = document.getElementById("empty-state");
const calculateBtn = document.getElementById("calculate-btn");
const clearBtn = document.getElementById("clear-btn");
const resultEl = document.getElementById("result");
const resultLoaderEl = document.getElementById("result-loader");
const langMenuBtn = document.getElementById("lang-toggle");
const langMenu = document.getElementById("lang-menu");

function openLangMenu() {
  langMenu.classList.add("open");
  langMenuBtn.setAttribute("aria-expanded", "true");
}

function closeLangMenu() {
  langMenu.classList.remove("open");
  langMenuBtn.setAttribute("aria-expanded", "false");
}

langMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (langMenu.classList.contains("open")) {
    closeLangMenu();
  } else {
    openLangMenu();
  }
});

langMenu.querySelectorAll("button[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyLanguage(btn.dataset.lang);
    closeLangMenu();
  });
});

document.addEventListener("click", (e) => {
  if (!langMenu.contains(e.target) && e.target !== langMenuBtn) {
    closeLangMenu();
  }
});

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.title = t("title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const img = el.querySelector("img");
    if (img) img.alt = t(el.dataset.i18nAlt);
  });
  langMenu.querySelectorAll("button[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  saveLang(lang);
  clearError();
  resultEl.hidden = true;
  resultLoaderEl.hidden = true;
  render();
}

function loadCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCourses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // localStorage unavailable (e.g. private browsing) — app still works in-memory
  }
}

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearError() {
  formError.hidden = true;
  formError.textContent = "";
}

function calculateAverage(list) {
  const totalCredits = list.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return null;

  return list.reduce(
    (avg, c) => avg + (c.credits / totalCredits) * c.grade,
    0
  );
}

function render() {
  courseList.innerHTML = "";
  emptyState.hidden = courses.length > 0;

  for (const course of courses) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = course.name || t("untitledCourse");

    const creditsCell = document.createElement("td");
    creditsCell.textContent = course.credits;

    const gradeCell = document.createElement("td");
    const actionCell = document.createElement("td");

    if (course.id === editingId) {
      const gradeEditInput = document.createElement("input");
      gradeEditInput.type = "number";
      gradeEditInput.className = "grade-edit-input";
      gradeEditInput.min = "0";
      gradeEditInput.max = "100";
      gradeEditInput.step = "0.1";
      gradeEditInput.value = course.grade;
      gradeEditInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveGradeEdit(course.id, gradeEditInput.value);
        if (e.key === "Escape") {
          editingId = null;
          render();
        }
      });
      gradeCell.appendChild(gradeEditInput);

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "row-btn";
      saveBtn.textContent = t("save");
      saveBtn.addEventListener("click", () => saveGradeEdit(course.id, gradeEditInput.value));

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "row-btn";
      cancelBtn.textContent = t("cancel");
      cancelBtn.addEventListener("click", () => {
        editingId = null;
        render();
      });

      actionCell.append(saveBtn, cancelBtn);
      requestAnimationFrame(() => gradeEditInput.focus());
    } else {
      gradeCell.textContent = course.grade;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "row-btn";
      editBtn.textContent = t("edit");
      editBtn.addEventListener("click", () => {
        editingId = course.id;
        render();
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.textContent = t("remove");
      removeBtn.addEventListener("click", () => removeCourse(course.id));

      actionCell.append(editBtn, removeBtn);
    }

    row.append(nameCell, creditsCell, gradeCell, actionCell);
    courseList.appendChild(row);
  }

  resultEl.hidden = true;
  resultLoaderEl.hidden = true;
}

function removeCourse(id) {
  courses = courses.filter((c) => c.id !== id);
  if (editingId === id) editingId = null;
  saveCourses();
  render();
}

function saveGradeEdit(id, rawValue) {
  const grade = Number(rawValue);

  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    showError(t("errorGrade"));
    return;
  }

  const course = courses.find((c) => c.id === id);
  if (course) course.grade = grade;

  editingId = null;
  clearError();
  saveCourses();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError();

  const name = nameInput.value.trim();
  const credits = Number(creditsInput.value);
  const grade = Number(gradeInput.value);

  if (!Number.isFinite(credits) || credits <= 0) {
    showError(t("errorCredits"));
    return;
  }
  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    showError(t("errorGrade"));
    return;
  }

  courses.push({ id: makeId(), name, credits, grade });
  saveCourses();
  render();

  form.reset();
  nameInput.focus();
});

const CALCULATE_ANIMATION_MS = 700;

calculateBtn.addEventListener("click", () => {
  const average = calculateAverage(courses);

  resultEl.hidden = true;
  resultLoaderEl.hidden = false;
  calculateBtn.disabled = true;

  setTimeout(() => {
    resultLoaderEl.hidden = true;
    calculateBtn.disabled = false;

    if (average === null) {
      resultEl.hidden = false;
      resultEl.textContent = t("resultEmpty");
      return;
    }

    resultEl.hidden = false;
    resultEl.textContent = t("resultText")(average.toFixed(2));
  }, CALCULATE_ANIMATION_MS);
});

clearBtn.addEventListener("click", () => {
  if (courses.length === 0) return;
  if (!confirm(t("confirmClear"))) return;
  courses = [];
  editingId = null;
  saveCourses();
  render();
});

applyLanguage(currentLang);
