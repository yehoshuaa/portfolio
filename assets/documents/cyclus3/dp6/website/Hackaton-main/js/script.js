const accessibilityOpenBtn = document.getElementById("accessibilityOpenBtn");
const accessibilityModal = document.getElementById("accessibilityModal");

const largeTextToggle = document.getElementById("largeTextToggle");
const contrastToggle = document.getElementById("contrastToggle");
const wheelchairToggle = document.getElementById("wheelchairToggle");
const languageSelect = document.getElementById("languageSelect");

const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");

const loginForm = document.getElementById("loginForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

const forgotModal = document.getElementById("forgotModal");
const closeForgotModal = document.getElementById("closeForgotModal");
const forgotForm = document.getElementById("forgotForm");

const errorModal = document.getElementById("errorModal");
const closeErrorModal = document.getElementById("closeErrorModal");
const errorOkBtn = document.getElementById("errorOkBtn");

function openModal(modal) {
  if (modal) {
    modal.classList.add("show");
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove("show");
  }
}

function applySavedAccessibilitySettings() {
  const savedLargeText = localStorage.getItem("largeText");
  const savedHighContrast = localStorage.getItem("highContrast");
  const savedWheelchair = localStorage.getItem("wheelchairRoute");

  if (savedLargeText === "true") {
    document.body.classList.add("large-text");
    if (largeTextToggle) {
      largeTextToggle.checked = true;
    }
  } else {
    document.body.classList.remove("large-text");
    if (largeTextToggle) {
      largeTextToggle.checked = false;
    }
  }

  if (savedHighContrast === "true") {
    document.body.classList.add("high-contrast");
    if (contrastToggle) {
      contrastToggle.checked = true;
    }
  } else {
    document.body.classList.remove("high-contrast");
    if (contrastToggle) {
      contrastToggle.checked = false;
    }
  }

  if (savedWheelchair === "true") {
    if (wheelchairToggle) {
      wheelchairToggle.checked = true;
    }
  } else {
    if (wheelchairToggle) {
      wheelchairToggle.checked = false;
    }
  }

  if (languageSelect) {
    languageSelect.value = getSavedLanguage();
  }
}

/* POPPETJE */
if (accessibilityOpenBtn) {
  accessibilityOpenBtn.addEventListener("click", () => {
    openModal(accessibilityModal);
  });
}

/* ACCESSIBILITY MODAL SLUITEN */
if (accessibilityModal) {
  accessibilityModal.addEventListener("click", (event) => {
    if (event.target === accessibilityModal) {
      closeModal(accessibilityModal);
    }
  });
}

/* OPSLAAN */
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    if (largeTextToggle && largeTextToggle.checked) {
      document.body.classList.add("large-text");
      localStorage.setItem("largeText", "true");
    } else {
      document.body.classList.remove("large-text");
      localStorage.setItem("largeText", "false");
    }

    if (contrastToggle && contrastToggle.checked) {
      document.body.classList.add("high-contrast");
      localStorage.setItem("highContrast", "true");
    } else {
      document.body.classList.remove("high-contrast");
      localStorage.setItem("highContrast", "false");
    }

    if (wheelchairToggle) {
      localStorage.setItem("wheelchairRoute", wheelchairToggle.checked ? "true" : "false");
    }

    if (languageSelect) {
      setLanguage(languageSelect.value);
    }

    closeModal(accessibilityModal);
  });
}

/* RESET */
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    localStorage.setItem("largeText", "false");
    localStorage.setItem("highContrast", "false");
    localStorage.setItem("wheelchairRoute", "false");

    document.body.classList.remove("large-text");
    document.body.classList.remove("high-contrast");

    if (largeTextToggle) {
      largeTextToggle.checked = false;
    }

    if (contrastToggle) {
      contrastToggle.checked = false;
    }

    if (wheelchairToggle) {
      wheelchairToggle.checked = false;
    }

    setLanguage("nl");
  });
}

/* WACHTWOORD VERGETEN */
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal(forgotModal);
  });
}

if (closeForgotModal) {
  closeForgotModal.addEventListener("click", () => {
    closeModal(forgotModal);
  });
}

if (forgotModal) {
  forgotModal.addEventListener("click", (event) => {
    if (event.target === forgotModal) {
      closeModal(forgotModal);
    }
  });
}

if (forgotForm) {
  forgotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    closeModal(forgotModal);
  });
}

/* FOUT POPUP */
if (closeErrorModal) {
  closeErrorModal.addEventListener("click", () => {
    closeModal(errorModal);
  });
}

if (errorOkBtn) {
  errorOkBtn.addEventListener("click", () => {
    closeModal(errorModal);
  });
}

if (errorModal) {
  errorModal.addEventListener("click", (event) => {
    if (event.target === errorModal) {
      closeModal(errorModal);
    }
  });
}

/* LOGIN */
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === "jeremy@windesheim.nl" && password === "Hallo123") {
      sessionStorage.setItem("showStarterGuide", "true");
      window.location.href = "HomePagina.html";
    } else {
      openModal(errorModal);
    }
  });
}

/* BIJ LADEN */
document.addEventListener("DOMContentLoaded", () => {
  applySavedAccessibilitySettings();
});
