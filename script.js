// ====== SETTINGS ======
// Paste your Google Apps Script Web App URL here (see Code.gs setup steps)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNE9JMDDloO460viNhoh88yC9W0QnfTHC9MZBIIsUkuZt9BiMikyUFTXGW9wyyVaL2DA/exec";

// ====== MOBILE MENU ======
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
if (menuBtn) menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));

// ====== FOOTER YEAR ======
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ====== SEND FORM DATA TO GOOGLE SHEETS ======
function setupForm(formId, formType) {
  const form = document.getElementById(formId);
  if (!form) return;
  const msg = form.querySelector(".message");
  const btn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (SCRIPT_URL.includes("PASTE_YOUR")) {
      showMessage(msg, "error", "Set your Google Apps Script URL in script.js first.");
      return;
    }

    const data = new FormData(form);
    console.log("Trip Type:", data.get("tripType"));
    console.log("Form Data:", [...data.entries()]);  
    data.append("formType", formType);

    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Sending...";

    try {
      // no-cors: Apps Script accepts the data, response is opaque
      await fetch(SCRIPT_URL, { method: "POST", body: data, mode: "no-cors" });
      showMessage(msg, "success", "Submitted successfully! Thank you.");
      form.reset();
      toggleReturnDate();
    } catch (err) {
      showMessage(msg, "error", "Something went wrong. Please try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });
}

function showMessage(el, type, text) {
  el.className = "message " + type;
  el.textContent = text;
}

setupForm("registrationForm", "Passengers");
setupForm("reservationForm", "Reservations");
setupForm("contactForm", "Contact");

// ====== DATE RULES ======
const today = new Date().toISOString().split("T")[0];
const depart = document.getElementById("departDate");
const ret = document.getElementById("returnDate");
const birth = document.getElementById("birthdate");
if (depart) {
  depart.min = today;
  depart.addEventListener("change", () => { if (ret) ret.min = depart.value; });
}
if (birth) birth.max = today;

// ====== ROUND TRIP / ONE WAY TOGGLE ======
function toggleReturnDate() {
  const wrap = document.getElementById("returnWrap");
  const selectedTripType = document.querySelector("input[name=tripType]:checked");
  const isOneWay = selectedTripType && selectedTripType.value === "One-way";

  if (wrap) wrap.style.display = isOneWay ? "none" : "flex";
  if (ret) {
    ret.required = !isOneWay;
    ret.disabled = isOneWay;
    if (isOneWay) ret.value = "";
  }
}
document.querySelectorAll("input[name=tripType]").forEach(r => r.addEventListener("change", toggleReturnDate));
toggleReturnDate();

// ====== SECTION REVEAL ANIMATIONS ======
const revealItems = document.querySelectorAll("section, .page-title, .card, .form-box, .contact-info");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${index * 90}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// ====== ORIGIN AND DESTINATION MUST DIFFER ======
const reservationForm = document.getElementById("reservationForm");
if (reservationForm) {
  reservationForm.addEventListener("submit", (e) => {
    const selectedTripType = reservationForm.querySelector("input[name=tripType]:checked");
    const tripType = selectedTripType ? selectedTripType.value : "Round-trip";
    const returnDateField = reservationForm.querySelector("#returnDate");

    if (tripType !== "One-way" && returnDateField && !returnDateField.value) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showMessage(reservationForm.querySelector(".message"), "error", "Please select a return date for round-trip bookings.");
      return;
    }

    const o = reservationForm.origin.value, d = reservationForm.destination.value;
    if (o && o === d) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showMessage(reservationForm.querySelector(".message"), "error", "Origin and destination cannot be the same.");
    }
  }, true);
}
