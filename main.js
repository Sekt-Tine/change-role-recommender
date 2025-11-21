const rangeFields = document.querySelectorAll('input[type="range"]');
rangeFields.forEach((input) => {
  const output = input.parentElement.querySelector("output");
  const update = () => {
    output.textContent = input.value;
  };
  input.addEventListener("input", update);
  update();
});

const sectionButtons = document.querySelectorAll("[data-section-toggle]");
const viewSections = document.querySelectorAll("[data-view-section]");

const switchSection = (targetSelector, trigger) => {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  viewSections.forEach((section) => {
    if (section === target) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  sectionButtons.forEach((btn) => {
    btn.setAttribute("data-active", String(btn === trigger));
  });

  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

sectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetSelector = button.getAttribute("data-target");
    if (!targetSelector) return;
    switchSection(targetSelector, button);
  });
});

const jobProfilesContainer = document.getElementById("job-profiles-container");
const jobProfileTemplate = document.getElementById("job-profile-template");
const roleDescriptionTemplate = document.getElementById(
  "role-description-template"
);
const addJobProfileBtn = document.getElementById("add-job-profile");
const profileShortcuts = document.getElementById("profile-shortcuts");
let profileCounter = 0;

const createRoleDescriptionField = (profileId, container) => {
  if (!roleDescriptionTemplate) return;
  const fragment = roleDescriptionTemplate.content.cloneNode(true);
  const textarea = fragment.querySelector("[data-description-field]");
  if (textarea) {
    textarea.name = `profiles[${profileId}][roleDescriptions][]`;
  }
  container.appendChild(fragment);
};

const addProfileShortcut = (profileId, titleInput) => {
  if (!profileShortcuts) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors";
  button.setAttribute("data-profile-shortcut", profileId);
  button.textContent = `Job Profil ${profileId}`;
  
  button.addEventListener("click", () => {
    showProfile(profileId);
  });

  if (titleInput) {
    titleInput.addEventListener("input", () => {
      const label = titleInput.value.trim() || `Job Profil ${profileId}`;
      button.textContent = label;
    });
  }

  profileShortcuts.appendChild(button);
};

const showProfile = (profileId) => {
  // Verstecke alle Profile
  document.querySelectorAll(".job-profile-card").forEach((card) => {
    card.classList.add("hidden");
  });
  
  // Zeige das ausgewählte Profil
  const selectedCard = document.querySelector(
    `.job-profile-card[data-profile-id="${profileId}"]`
  );
  if (selectedCard) {
    selectedCard.classList.remove("hidden");
  }
  
  // Aktualisiere die aktiven Shortcuts
  document.querySelectorAll("[data-profile-shortcut]").forEach((btn) => {
    const btnProfileId = btn.getAttribute("data-profile-shortcut");
    if (btnProfileId === String(profileId)) {
      btn.classList.add("bg-indigo-50", "border-indigo-300", "text-indigo-700");
      btn.classList.remove("text-slate-600");
    } else {
      btn.classList.remove("bg-indigo-50", "border-indigo-300", "text-indigo-700");
      btn.classList.add("text-slate-600");
    }
  });
};

const addJobProfile = () => {
  if (!jobProfilesContainer || !jobProfileTemplate) return;
  profileCounter += 1;

  const fragment = jobProfileTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".job-profile-card");

  if (!card) return;
  card.dataset.profileId = String(profileCounter);

  const label = card.querySelector("[data-profile-label]");
  if (label) {
    label.textContent = `Job Profil ${profileCounter}`;
  }

  card.querySelectorAll("[data-field]").forEach((field) => {
    const fieldName = field.getAttribute("data-field");
    if (!fieldName) return;
    field.name = `profiles[${profileCounter}][${fieldName}]`;
  });

  const roleDescriptionsContainer = card.querySelector(
    "[data-role-descriptions]"
  );
  const addDescriptionBtn = card.querySelector("[data-add-role-description]");

  if (roleDescriptionsContainer) {
    createRoleDescriptionField(profileCounter, roleDescriptionsContainer);
  }

  if (addDescriptionBtn && roleDescriptionsContainer) {
    addDescriptionBtn.addEventListener("click", () => {
      createRoleDescriptionField(profileCounter, roleDescriptionsContainer);
    });
  }

  jobProfilesContainer.appendChild(fragment);

  const appendedCard = document.querySelector(
    `.job-profile-card[data-profile-id="${profileCounter}"]`
  );
  
  // Verstecke alle Profile außer dem ersten
  if (profileCounter > 1) {
    appendedCard?.classList.add("hidden");
  }
  
  const titleInput = appendedCard?.querySelector('[data-field="jobTitle"]');
  if (titleInput instanceof HTMLInputElement) {
    addProfileShortcut(profileCounter, titleInput);
  } else {
    addProfileShortcut(profileCounter, null);
  }
  
  // Füge Save-Button Event Listener hinzu
  const saveButton = appendedCard?.querySelector("[data-save-profile]");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      saveProfile(profileCounter, appendedCard);
    });
    
    // Prüfe, ob dieses Profil bereits gespeichert wurde
    const savedProfiles = JSON.parse(localStorage.getItem("savedProfiles") || "{}");
    if (savedProfiles[profileCounter]) {
      saveButton.classList.remove("bg-indigo-600", "hover:bg-indigo-500");
      saveButton.classList.add("bg-emerald-600", "hover:bg-emerald-500");
      saveButton.setAttribute("data-saved", "true");
      
      // Füge Checkmark hinzu
      if (!saveButton.querySelector(".checkmark")) {
        const checkmark = document.createElement("span");
        checkmark.className = "checkmark";
        checkmark.innerHTML = "✓";
        checkmark.style.marginRight = "0.5rem";
        saveButton.insertBefore(checkmark, saveButton.firstChild);
      }
    }
  }
};

if (addJobProfileBtn) {
  addJobProfileBtn.addEventListener("click", addJobProfile);
}

const saveProfile = (profileId, cardElement) => {
  const form = cardElement.querySelector("form");
  if (!form) return;
  
  const formData = new FormData(form);
  const profileData = {};
  
  // Sammle alle Formularfelder
  form.querySelectorAll("[data-field]").forEach((field) => {
    const fieldName = field.getAttribute("data-field");
    if (fieldName) {
      profileData[fieldName] = field.value;
    }
  });
  
  // Sammle Rollenbeschreibungen
  const roleDescriptions = [];
  form.querySelectorAll("[data-description-field]").forEach((textarea) => {
    if (textarea.value.trim()) {
      roleDescriptions.push(textarea.value.trim());
    }
  });
  profileData.roleDescriptions = roleDescriptions;
  
  // Speichere im localStorage
  const savedProfiles = JSON.parse(localStorage.getItem("savedProfiles") || "{}");
  savedProfiles[profileId] = profileData;
  localStorage.setItem("savedProfiles", JSON.stringify(savedProfiles));
  
  // Aktualisiere Button-Status
  const saveButton = cardElement.querySelector("[data-save-profile]");
  if (saveButton) {
    saveButton.classList.remove("bg-indigo-600", "hover:bg-indigo-500");
    saveButton.classList.add("bg-emerald-600", "hover:bg-emerald-500");
    saveButton.setAttribute("data-saved", "true");
    
    // Füge Checkmark hinzu, falls noch nicht vorhanden
    if (!saveButton.querySelector(".checkmark")) {
      const checkmark = document.createElement("span");
      checkmark.className = "checkmark";
      checkmark.innerHTML = "✓";
      checkmark.style.marginRight = "0.5rem";
      saveButton.insertBefore(checkmark, saveButton.firstChild);
    }
  }
};

addJobProfile();

// Zeige das erste Profil beim Laden
if (profileCounter > 0) {
  showProfile(1);
}

const employeeForm = document.getElementById("employee-form");
const resultBox = document.getElementById("result");
const roleName = document.getElementById("role-name");
const probabilityEl = document.getElementById("probability");
const rationaleEl = document.getElementById("rationale");
const risksEl = document.getElementById("risks");

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(employeeForm);
  const answers = Object.fromEntries(formData.entries());

  answers.systemsThinking = Number(answers.systemsThinking);
  answers.motivation = Number(answers.motivation);

  const recommendation = recommendRole(answers);

  roleName.textContent = `Empfohlene Rolle: ${recommendation.role}`;
  probabilityEl.textContent = `Wahrscheinlichkeit: ${recommendation.probability}%`;
  rationaleEl.textContent = recommendation.rationale;
  risksEl.textContent = recommendation.risks;

  resultBox.classList.remove("hidden");
});

function recommendRole(answers) {
  const { motivation, changeReadiness, systemsThinking, workStyle } = answers;

  if (motivation >= 4 && changeReadiness === "hoch" && workStyle === "agil") {
    return {
      role: "Change Coach",
      probability: 78,
      rationale:
        "Hohe Motivation, agile Präferenz und ausgeprägte Change-Bereitschaft passen zu einer coachenden Rolle.",
      risks:
        "Bitte Erfahrung im Umgang mit Widerständen und Auslastung prüfen; fehlende Branchentiefe könnte Coaching-Wirkung begrenzen.",
    };
  }

  if (systemsThinking >= 4 && workStyle === "hybrid") {
    return {
      role: "Stream Lead Support",
      probability: 66,
      rationale:
        "Starkes systemisches Denken und hybride Arbeitsweise eignen sich für koordinierende Aufgaben im Stream Lead Umfeld.",
      risks:
        "Unklare Führungserfahrung und Stakeholder-Komplexität können zusätzliche Begleitung erfordern; Lernziele beachten.",
    };
  }

  if (motivation <= 2) {
    return {
      role: "Transformation Analyst",
      probability: 55,
      rationale:
        "Geringere Veränderungsmotivation deutet auf analytische und strukturierende Rollen mit geringerer Exposition hin.",
      risks:
        "Widerstände gegenüber schnellen Iterationen möglich; Coaching zur Motivationssteigerung einplanen.",
    };
  }

  return {
    role: "PMO / Delivery Support",
    probability: 60,
    rationale:
      "Ausgeglichene Werte sprechen für eine unterstützende Rolle mit Prozess- und Reporting-Fokus.",
    risks:
      "Ohne Angaben zu Erfahrung oder Belastbarkeit bleibt das Risiko von Überforderung unklar; bitte nachreichen.",
  };
}

