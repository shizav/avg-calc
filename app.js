const STORAGE_KEY = "avg-calc:courses";

/** @type {{id: string, name: string, credits: number, grade: number}[]} */
let courses = loadCourses();

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
    nameCell.textContent = course.name;

    const creditsCell = document.createElement("td");
    creditsCell.textContent = course.credits;

    const gradeCell = document.createElement("td");
    gradeCell.textContent = course.grade;

    const actionCell = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeCourse(course.id));
    actionCell.appendChild(removeBtn);

    row.append(nameCell, creditsCell, gradeCell, actionCell);
    courseList.appendChild(row);
  }

  resultEl.hidden = true;
}

function removeCourse(id) {
  courses = courses.filter((c) => c.id !== id);
  saveCourses();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError();

  const name = nameInput.value.trim();
  const credits = Number(creditsInput.value);
  const grade = Number(gradeInput.value);

  if (!name) {
    showError("Please enter a course name.");
    return;
  }
  if (!Number.isFinite(credits) || credits <= 0) {
    showError("Credit points must be a positive number.");
    return;
  }
  if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
    showError("Grade must be a number between 0 and 100.");
    return;
  }

  courses.push({ id: makeId(), name, credits, grade });
  saveCourses();
  render();

  form.reset();
  nameInput.focus();
});

calculateBtn.addEventListener("click", () => {
  const average = calculateAverage(courses);

  if (average === null) {
    resultEl.hidden = false;
    resultEl.textContent = "Add at least one course to calculate an average.";
    return;
  }

  resultEl.hidden = false;
  resultEl.textContent = `Current average: ${average.toFixed(2)}`;
});

clearBtn.addEventListener("click", () => {
  if (courses.length === 0) return;
  if (!confirm("Remove all courses?")) return;
  courses = [];
  saveCourses();
  render();
});

render();
