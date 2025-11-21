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

  // Aktualisiere Fragen, wenn zum Fragebogen gewechselt wird
  if (targetSelector === "#questionnaire-section") {
    generateQuestionnaireQuestions();
  }

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

// Funktion zum Extrahieren von Items aus Textfeldern
const extractItems = (text) => {
  if (!text || !text.trim()) return [];
  
  // Teile nach Komma, Semikolon, Zeilenumbruch oder Bullet Points
  const items = text
    .split(/[,;\n\r•\-\*]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  return [...new Set(items)]; // Entferne Duplikate
};

// Funktion zum Sammeln aller Anforderungen aus gespeicherten Profilen
const collectProfileRequirements = () => {
  const savedProfiles = JSON.parse(localStorage.getItem("savedProfiles") || "{}");
  const requirements = {
    skills: new Set(),
    qualifications: new Set(),
    strengths: new Set(),
    responsibilityDetails: new Set(),
  };
  
  Object.values(savedProfiles).forEach((profile) => {
    if (profile.skills) {
      extractItems(profile.skills).forEach(item => requirements.skills.add(item));
    }
    if (profile.qualifications) {
      extractItems(profile.qualifications).forEach(item => requirements.qualifications.add(item));
    }
    if (profile.strengths) {
      extractItems(profile.strengths).forEach(item => requirements.strengths.add(item));
    }
    if (profile.responsibilityDetails) {
      extractItems(profile.responsibilityDetails).forEach(item => requirements.responsibilityDetails.add(item));
    }
  });
  
  return {
    skills: Array.from(requirements.skills).sort(),
    qualifications: Array.from(requirements.qualifications).sort(),
    strengths: Array.from(requirements.strengths).sort(),
    responsibilityDetails: Array.from(requirements.responsibilityDetails).sort(),
  };
};

// Funktion zum Generieren von Multiple Choice Fragen
const generateQuestionnaireQuestions = () => {
  const requirements = collectProfileRequirements();
  const questionsContainer = document.getElementById("dynamic-questions");
  if (!questionsContainer) return;
  
  // Leere den Container
  questionsContainer.innerHTML = "";
  
  // Qualifikationen als Checkboxen (mehrfach auswählbar)
  if (requirements.qualifications.length > 0) {
    const qualSection = document.createElement("div");
    qualSection.className = "flex flex-col gap-3";
    
    const qualLabel = document.createElement("label");
    qualLabel.className = "text-sm font-medium text-slate-700";
    qualLabel.textContent = "Qualifikationen / Zertifikate";
    qualSection.appendChild(qualLabel);
    
    const qualHint = document.createElement("p");
    qualHint.className = "text-xs text-slate-500 mb-2";
    qualHint.textContent = "Bitte wählen Sie alle zutreffenden Qualifikationen aus:";
    qualSection.appendChild(qualHint);
    
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50";
    
    requirements.qualifications.forEach((qual, index) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "qualifications[]";
      checkbox.value = qual;
      checkbox.className = "w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500";
      
      const checkboxLabel = document.createElement("span");
      checkboxLabel.className = "text-sm text-slate-700";
      checkboxLabel.textContent = qual;
      
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(checkboxLabel);
      checkboxContainer.appendChild(checkboxWrapper);
    });
    
    qualSection.appendChild(checkboxContainer);
    questionsContainer.appendChild(qualSection);
  }
  
  // Fähigkeiten als Checkboxen
  if (requirements.skills.length > 0) {
    const skillsSection = document.createElement("div");
    skillsSection.className = "flex flex-col gap-3";
    
    const skillsLabel = document.createElement("label");
    skillsLabel.className = "text-sm font-medium text-slate-700";
    skillsLabel.textContent = "Fähigkeiten";
    skillsSection.appendChild(skillsLabel);
    
    const skillsHint = document.createElement("p");
    skillsHint.className = "text-xs text-slate-500 mb-2";
    skillsHint.textContent = "Bitte wählen Sie alle zutreffenden Fähigkeiten aus:";
    skillsSection.appendChild(skillsHint);
    
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50";
    
    requirements.skills.forEach((skill) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "skills[]";
      checkbox.value = skill;
      checkbox.className = "w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500";
      
      const checkboxLabel = document.createElement("span");
      checkboxLabel.className = "text-sm text-slate-700";
      checkboxLabel.textContent = skill;
      
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(checkboxLabel);
      checkboxContainer.appendChild(checkboxWrapper);
    });
    
    skillsSection.appendChild(checkboxContainer);
    questionsContainer.appendChild(skillsSection);
  }
  
  // Stärken als Checkboxen
  if (requirements.strengths.length > 0) {
    const strengthsSection = document.createElement("div");
    strengthsSection.className = "flex flex-col gap-3";
    
    const strengthsLabel = document.createElement("label");
    strengthsLabel.className = "text-sm font-medium text-slate-700";
    strengthsLabel.textContent = "Typische Stärken";
    strengthsSection.appendChild(strengthsLabel);
    
    const strengthsHint = document.createElement("p");
    strengthsHint.className = "text-xs text-slate-500 mb-2";
    strengthsHint.textContent = "Bitte wählen Sie alle zutreffenden Stärken aus:";
    strengthsSection.appendChild(strengthsHint);
    
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50";
    
    requirements.strengths.forEach((strength) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "strengths[]";
      checkbox.value = strength;
      checkbox.className = "w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500";
      
      const checkboxLabel = document.createElement("span");
      checkboxLabel.className = "text-sm text-slate-700";
      checkboxLabel.textContent = strength;
      
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(checkboxLabel);
      checkboxContainer.appendChild(checkboxWrapper);
    });
    
    strengthsSection.appendChild(checkboxContainer);
    questionsContainer.appendChild(strengthsSection);
  }
  
  // Verantwortungsbereiche als Checkboxen
  if (requirements.responsibilityDetails.length > 0) {
    const respSection = document.createElement("div");
    respSection.className = "flex flex-col gap-3";
    
    const respLabel = document.createElement("label");
    respLabel.className = "text-sm font-medium text-slate-700";
    respLabel.textContent = "Verantwortungsbereiche";
    respSection.appendChild(respLabel);
    
    const respHint = document.createElement("p");
    respHint.className = "text-xs text-slate-500 mb-2";
    respHint.textContent = "Bitte wählen Sie alle zutreffenden Verantwortungsbereiche aus:";
    respSection.appendChild(respHint);
    
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50";
    
    requirements.responsibilityDetails.forEach((resp) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "responsibilityDetails[]";
      checkbox.value = resp;
      checkbox.className = "w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500";
      
      const checkboxLabel = document.createElement("span");
      checkboxLabel.className = "text-sm text-slate-700";
      checkboxLabel.textContent = resp;
      
      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(checkboxLabel);
      checkboxContainer.appendChild(checkboxWrapper);
    });
    
    respSection.appendChild(checkboxContainer);
    questionsContainer.appendChild(respSection);
  }
  
  // Hinweis, falls keine Fragen generiert werden konnten
  if (questionsContainer.children.length === 0) {
    const noQuestionsMsg = document.createElement("p");
    noQuestionsMsg.className = "text-sm text-slate-500 italic";
    noQuestionsMsg.textContent = "Bitte speichern Sie zuerst mindestens ein Job Profil, um Fragen zu generieren.";
    questionsContainer.appendChild(noQuestionsMsg);
  }
};

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
  
  // Aktualisiere den Fragebogen mit neuen Fragen
  generateQuestionnaireQuestions();
};

addJobProfile();

// Zeige das erste Profil beim Laden
if (profileCounter > 0) {
  showProfile(1);
}

// Generiere Fragen beim Laden der Seite
generateQuestionnaireQuestions();

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
  
  // Sammle Checkbox-Werte (Arrays)
  answers.qualifications = formData.getAll("qualifications[]");
  answers.skills = formData.getAll("skills[]");
  answers.strengths = formData.getAll("strengths[]");
  answers.responsibilityDetails = formData.getAll("responsibilityDetails[]");

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

