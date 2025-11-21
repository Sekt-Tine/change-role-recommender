// Initialisiere Range-Felder
const initializeRangeFields = () => {
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    // Prüfe, ob bereits ein Event Listener vorhanden ist
    if (input.hasAttribute("data-range-initialized")) return;
    
    const output = input.parentElement.querySelector("output");
    if (output) {
      const update = () => {
        output.textContent = input.value;
      };
      input.addEventListener("input", update);
      input.setAttribute("data-range-initialized", "true");
      update();
    }
  });
};

// Initialisiere beim Laden
initializeRangeFields();

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

  // Sidebar-Logik
  const jobProfilesSidebar = document.getElementById("job-profiles-sidebar");
  const employeeSidebar = document.getElementById("employee-sidebar");
  
  if (targetSelector === "#job-profiles-section") {
    if (jobProfilesSidebar) jobProfilesSidebar.classList.remove("hidden");
    if (employeeSidebar) employeeSidebar.classList.add("hidden");
  } else if (targetSelector === "#questionnaire-section") {
    if (jobProfilesSidebar) jobProfilesSidebar.classList.add("hidden");
    if (employeeSidebar) employeeSidebar.classList.remove("hidden");
    // Aktualisiere Fragen für alle bestehenden Fragebögen
    document.querySelectorAll(".employee-form-card").forEach((card) => {
      const employeeId = card.getAttribute("data-employee-id");
      if (employeeId) {
        generateQuestionsForEmployee(employeeId);
      }
    });
  } else {
    if (jobProfilesSidebar) jobProfilesSidebar.classList.add("hidden");
    if (employeeSidebar) employeeSidebar.classList.add("hidden");
  }

  // Aktualisiere Gesamtauswertung, wenn zum Overview gewechselt wird
  if (targetSelector === "#overview-section") {
    generateOverview();
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
  
  // Aktualisiere Fragen für alle bestehenden Fragebögen
  document.querySelectorAll(".employee-form-card").forEach((card) => {
    const employeeId = card.getAttribute("data-employee-id");
    if (employeeId) {
      generateQuestionsForEmployee(employeeId);
    }
  });
};

addJobProfile();

// Zeige das erste Profil beim Laden
if (profileCounter > 0) {
  showProfile(1);
}

// Datei-Upload-Logik
const fileUploadInput = document.getElementById("file-upload");
const uploadStatus = document.getElementById("upload-status");

if (fileUploadInput) {
  fileUploadInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Zeige Upload-Status
    uploadStatus.classList.remove("hidden");
    uploadStatus.textContent = "Datei wird hochgeladen und analysiert...";
    uploadStatus.className = "text-sm text-blue-600";
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Hochladen");
      }
      
      // Erstelle Job Profile aus der Antwort
      if (data.profiles && Array.isArray(data.profiles)) {
        uploadStatus.textContent = `${data.profiles.length} Job Profile gefunden. Werden erstellt...`;
        
        const firstProfileId = profileCounter + 1;
        
        for (let i = 0; i < data.profiles.length; i++) {
          const profileData = data.profiles[i];
          
          // Erstelle neues Profil
          addJobProfile();
          
          // Finde das zuletzt erstellte Profil
          const lastProfile = document.querySelector(
            `.job-profile-card[data-profile-id="${profileCounter}"]`
          );
          
          if (lastProfile) {
            // Verstecke alle Profile außer dem ersten neuen
            if (i > 0) {
              lastProfile.classList.add("hidden");
            }
            
            // Fülle die Felder aus
            const form = lastProfile.querySelector("form");
            if (form) {
              // Fülle alle Felder
              Object.keys(profileData).forEach((key) => {
                const field = form.querySelector(`[data-field="${key}"]`);
                if (field) {
                  field.value = profileData[key] || "";
                  
                  // Für Select-Felder
                  if (field.tagName === "SELECT") {
                    field.value = profileData[key] || "";
                  }
                  
                  // Trigger input event für Change-Tracking
                  field.dispatchEvent(new Event("input", { bubbles: true }));
                }
              });
              
              // Aktualisiere den Shortcut-Namen
              const titleInput = form.querySelector('[data-field="jobTitle"]');
              if (titleInput && titleInput.value) {
                const shortcutButton = document.querySelector(
                  `[data-profile-shortcut="${profileCounter}"]`
                );
                if (shortcutButton) {
                  shortcutButton.textContent = titleInput.value;
                }
              }
            }
          }
        }
        
        uploadStatus.textContent = `✓ ${data.profiles.length} Job Profile erfolgreich erstellt!`;
        uploadStatus.className = "text-sm text-emerald-600";
        
        // Zeige das erste neue Profil
        if (data.profiles.length > 0) {
          showProfile(firstProfileId);
        }
      } else {
        throw new Error("Keine Profile in der Antwort gefunden");
      }
      
      // Reset file input
      fileUploadInput.value = "";
      
      // Verstecke Status nach 5 Sekunden
      setTimeout(() => {
        uploadStatus.classList.add("hidden");
      }, 5000);
      
    } catch (error) {
      console.error("Upload-Fehler:", error);
      uploadStatus.textContent = `✗ Fehler: ${error.message}`;
      uploadStatus.className = "text-sm text-red-600";
      fileUploadInput.value = "";
      
      // Verstecke Status nach 5 Sekunden
      setTimeout(() => {
        uploadStatus.classList.add("hidden");
      }, 5000);
    }
  });
}

// Fragen werden beim Erstellen der Fragebögen generiert

// Mitarbeiterfragebogen-Logik
const employeeFormsContainer = document.getElementById("employee-forms-container");
const employeeFormTemplate = document.getElementById("employee-form-template");
const addEmployeeBtn = document.getElementById("add-employee");
const employeeShortcuts = document.getElementById("employee-shortcuts");
let employeeCounter = 0;

const addEmployeeShortcut = (employeeId, nameInput) => {
  if (!employeeShortcuts) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "w-full text-left px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors";
  button.setAttribute("data-employee-shortcut", employeeId);
  button.textContent = `Mitarbeiter ${employeeId}`;
  
  button.addEventListener("click", () => {
    showEmployee(employeeId);
  });

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const label = nameInput.value.trim() || `Mitarbeiter ${employeeId}`;
      button.textContent = label;
    });
  }

  employeeShortcuts.appendChild(button);
};

const showEmployee = (employeeId) => {
  // Verstecke alle Fragebögen
  document.querySelectorAll(".employee-form-card").forEach((card) => {
    card.classList.add("hidden");
  });
  
  // Zeige den ausgewählten Fragebogen
  const selectedCard = document.querySelector(
    `.employee-form-card[data-employee-id="${employeeId}"]`
  );
  if (selectedCard) {
    selectedCard.classList.remove("hidden");
  }
  
  // Aktualisiere die aktiven Shortcuts
  document.querySelectorAll("[data-employee-shortcut]").forEach((btn) => {
    const btnEmployeeId = btn.getAttribute("data-employee-shortcut");
    if (btnEmployeeId === String(employeeId)) {
      btn.classList.add("bg-emerald-50", "border-emerald-300", "text-emerald-700");
      btn.classList.remove("text-slate-600");
    } else {
      btn.classList.remove("bg-emerald-50", "border-emerald-300", "text-emerald-700");
      btn.classList.add("text-slate-600");
    }
  });
};

const addEmployee = () => {
  if (!employeeFormsContainer || !employeeFormTemplate) return;
  employeeCounter += 1;

  const fragment = employeeFormTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".employee-form-card");

  if (!card) return;
  card.dataset.employeeId = String(employeeCounter);

  const form = card.querySelector("form");
  
  // Füge alle Felder hinzu
  const nameField = document.createElement("label");
  nameField.className = "flex flex-col gap-2";
  nameField.innerHTML = `
    <span class="text-sm font-medium text-slate-700">Name</span>
    <input
      type="text"
      class="text-field"
      name="name"
      placeholder="z. B. Max Mustermann"
      required
      data-employee-field
    />
  `;
  form.insertBefore(nameField, form.querySelector("[data-save-employee]"));

  const ageField = document.createElement("label");
  ageField.className = "flex flex-col gap-2";
  ageField.innerHTML = `
    <span class="text-sm font-medium text-slate-700">Alter</span>
    <input
      type="number"
      class="text-field"
      name="age"
      min="18"
      max="70"
      placeholder="z. B. 35"
      required
      data-employee-field
    />
  `;
  form.insertBefore(ageField, form.querySelector("[data-save-employee]"));

  const yearsField = document.createElement("div");
  yearsField.className = "flex flex-col gap-2";
  yearsField.innerHTML = `
    <label class="text-sm font-medium text-slate-700">
      Betriebszugehörigkeit (in Jahren)
    </label>
    <div class="flex items-center gap-3">
      <input
        type="range"
        name="yearsOfService"
        min="0"
        max="50"
        value="5"
        class="w-full accent-emerald-600"
        data-employee-field
      />
      <output class="range-output text-sm text-slate-600">5</output>
      <span class="text-xs text-slate-500">Jahre</span>
    </div>
  `;
  form.insertBefore(yearsField, form.querySelector("[data-save-employee]"));
  initializeRangeFields();

  const positionField = document.createElement("label");
  positionField.className = "flex flex-col gap-2";
  positionField.innerHTML = `
    <span class="text-sm font-medium text-slate-700">Bisherige Position</span>
    <input
      type="text"
      class="text-field"
      name="currentPosition"
      placeholder="z. B. Projektmanager"
      required
      data-employee-field
    />
  `;
  form.insertBefore(positionField, form.querySelector("[data-save-employee]"));

  const workStyleField = document.createElement("label");
  workStyleField.className = "flex flex-col gap-2";
  workStyleField.innerHTML = `
    <span class="text-sm font-medium text-slate-700">Bevorzugter Arbeitsstil</span>
    <select class="select-field" name="workStyle" data-employee-field>
      <option value="agil">Agil</option>
      <option value="prozessorientiert">Prozessorientiert</option>
      <option value="hybrid" selected>Hybrid</option>
    </select>
  `;
  form.insertBefore(workStyleField, form.querySelector("[data-save-employee]"));

  const dynamicQuestionsDiv = document.createElement("div");
  dynamicQuestionsDiv.className = "space-y-5 border-t border-slate-200 pt-5 mt-5";
  dynamicQuestionsDiv.setAttribute("data-dynamic-questions", employeeCounter);
  form.insertBefore(dynamicQuestionsDiv, form.querySelector("[data-save-employee]"));

  const commentField = document.createElement("label");
  commentField.className = "flex flex-col gap-2";
  commentField.innerHTML = `
    <span class="text-sm font-medium text-slate-700">Optional: Hinweise zu Lernzielen oder Risiken</span>
    <textarea
      class="text-field"
      name="comment"
      rows="3"
      placeholder="z. B. Bedarf an regulatorischer Erfahrung, Wunsch nach Coaching"
      data-employee-field
    ></textarea>
  `;
  form.insertBefore(commentField, form.querySelector("[data-save-employee]"));

  employeeFormsContainer.appendChild(fragment);

  const appendedCard = document.querySelector(
    `.employee-form-card[data-employee-id="${employeeCounter}"]`
  );
  
  // Verstecke alle Fragebögen außer dem ersten
  if (employeeCounter > 1) {
    appendedCard?.classList.add("hidden");
  }
  
  const nameInput = appendedCard?.querySelector('input[name="name"]');
  if (nameInput instanceof HTMLInputElement) {
    addEmployeeShortcut(employeeCounter, nameInput);
  } else {
    addEmployeeShortcut(employeeCounter, null);
  }
  
  // Füge Save-Button Event Listener hinzu
  const saveButton = appendedCard?.querySelector("[data-save-employee]");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      saveEmployee(employeeCounter, appendedCard);
    });
  }
  
  // Füge Change-Tracking hinzu
  appendedCard?.querySelectorAll("[data-employee-field]").forEach((field) => {
    field.addEventListener("input", () => {
      resetSaveButton(employeeCounter, appendedCard);
    });
    field.addEventListener("change", () => {
      resetSaveButton(employeeCounter, appendedCard);
    });
  });
  
  // Generiere Fragen für diesen Fragebogen
  generateQuestionsForEmployee(employeeCounter);
};

const resetSaveButton = (employeeId, cardElement) => {
  const saveButton = cardElement.querySelector("[data-save-employee]");
  if (saveButton && saveButton.getAttribute("data-saved") === "true") {
    // Setze Button zurück auf blau (indigo)
    saveButton.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
    saveButton.classList.add("bg-indigo-600", "hover:bg-indigo-500");
    saveButton.setAttribute("data-saved", "false");
    
    // Entferne Checkmark
    const checkmark = saveButton.querySelector(".checkmark");
    if (checkmark) {
      checkmark.remove();
    }
  }
};

const saveEmployee = (employeeId, cardElement) => {
  const form = cardElement.querySelector("form");
  if (!form) return;
  
  const formData = new FormData(form);
  const answers = Object.fromEntries(formData.entries());

  answers.age = Number(answers.age);
  answers.yearsOfService = Number(answers.yearsOfService);
  
  // Sammle Checkbox-Werte (Arrays)
  answers.qualifications = formData.getAll("qualifications[]");
  answers.skills = formData.getAll("skills[]");
  answers.strengths = formData.getAll("strengths[]");
  answers.responsibilityDetails = formData.getAll("responsibilityDetails[]");
  
  // Speichere mit eindeutiger ID
  answers.id = `employee-${employeeId}`;
  answers.timestamp = new Date().toISOString();

  // Speichere im localStorage
  const employeeAnswers = JSON.parse(localStorage.getItem("employeeAnswers") || "[]");
  const existingIndex = employeeAnswers.findIndex(e => e.id === answers.id);
  if (existingIndex >= 0) {
    employeeAnswers[existingIndex] = answers;
  } else {
    employeeAnswers.push(answers);
  }
  localStorage.setItem("employeeAnswers", JSON.stringify(employeeAnswers));
  
  // Aktualisiere Button-Status
  const saveButton = cardElement.querySelector("[data-save-employee]");
  if (saveButton) {
    saveButton.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
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

const generateQuestionsForEmployee = (employeeId) => {
  const card = document.querySelector(`.employee-form-card[data-employee-id="${employeeId}"]`);
  if (!card) return;
  
  const questionsContainer = card.querySelector("[data-dynamic-questions]");
  if (!questionsContainer) return;
  
  const requirements = collectProfileRequirements();
  questionsContainer.innerHTML = "";
  
  // Qualifikationen
  if (requirements.qualifications.length > 0) {
    const qualSection = document.createElement("div");
    qualSection.className = "flex flex-col gap-3";
    qualSection.innerHTML = `
      <label class="text-sm font-medium text-slate-700">Qualifikationen / Zertifikate</label>
      <p class="text-xs text-slate-500 mb-2">Bitte wählen Sie alle zutreffenden Qualifikationen aus:</p>
      <div class="space-y-2 border border-slate-200 rounded-xl p-4 bg-white"></div>
    `;
    const checkboxContainer = qualSection.querySelector("div");
    requirements.qualifications.forEach((qual) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors";
      checkboxWrapper.innerHTML = `
        <input type="checkbox" name="qualifications[]" value="${qual}" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" data-employee-field />
        <span class="text-sm text-slate-700">${qual}</span>
      `;
      checkboxContainer.appendChild(checkboxWrapper);
    });
    questionsContainer.appendChild(qualSection);
  }
  
  // Fähigkeiten
  if (requirements.skills.length > 0) {
    const skillsSection = document.createElement("div");
    skillsSection.className = "flex flex-col gap-3";
    skillsSection.innerHTML = `
      <label class="text-sm font-medium text-slate-700">Fähigkeiten</label>
      <p class="text-xs text-slate-500 mb-2">Bitte wählen Sie alle zutreffenden Fähigkeiten aus:</p>
      <div class="space-y-2 border border-slate-200 rounded-xl p-4 bg-white"></div>
    `;
    const checkboxContainer = skillsSection.querySelector("div");
    requirements.skills.forEach((skill) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors";
      checkboxWrapper.innerHTML = `
        <input type="checkbox" name="skills[]" value="${skill}" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" data-employee-field />
        <span class="text-sm text-slate-700">${skill}</span>
      `;
      checkboxContainer.appendChild(checkboxWrapper);
    });
    questionsContainer.appendChild(skillsSection);
  }
  
  // Stärken
  if (requirements.strengths.length > 0) {
    const strengthsSection = document.createElement("div");
    strengthsSection.className = "flex flex-col gap-3";
    strengthsSection.innerHTML = `
      <label class="text-sm font-medium text-slate-700">Typische Stärken</label>
      <p class="text-xs text-slate-500 mb-2">Bitte wählen Sie alle zutreffenden Stärken aus:</p>
      <div class="space-y-2 border border-slate-200 rounded-xl p-4 bg-white"></div>
    `;
    const checkboxContainer = strengthsSection.querySelector("div");
    requirements.strengths.forEach((strength) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors";
      checkboxWrapper.innerHTML = `
        <input type="checkbox" name="strengths[]" value="${strength}" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" data-employee-field />
        <span class="text-sm text-slate-700">${strength}</span>
      `;
      checkboxContainer.appendChild(checkboxWrapper);
    });
    questionsContainer.appendChild(strengthsSection);
  }
  
  // Verantwortungsbereiche
  if (requirements.responsibilityDetails.length > 0) {
    const respSection = document.createElement("div");
    respSection.className = "flex flex-col gap-3";
    respSection.innerHTML = `
      <label class="text-sm font-medium text-slate-700">Verantwortungsbereiche</label>
      <p class="text-xs text-slate-500 mb-2">Bitte wählen Sie alle zutreffenden Verantwortungsbereiche aus:</p>
      <div class="space-y-2 border border-slate-200 rounded-xl p-4 bg-white"></div>
    `;
    const checkboxContainer = respSection.querySelector("div");
    requirements.responsibilityDetails.forEach((resp) => {
      const checkboxWrapper = document.createElement("label");
      checkboxWrapper.className = "flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors";
      checkboxWrapper.innerHTML = `
        <input type="checkbox" name="responsibilityDetails[]" value="${resp}" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" data-employee-field />
        <span class="text-sm text-slate-700">${resp}</span>
      `;
      checkboxContainer.appendChild(checkboxWrapper);
    });
    questionsContainer.appendChild(respSection);
  }
  
  // Füge Change-Tracking für Checkboxen hinzu
  card.querySelectorAll("[data-employee-field]").forEach((field) => {
    if (!field.hasAttribute("data-change-tracked")) {
      field.setAttribute("data-change-tracked", "true");
      field.addEventListener("change", () => {
        resetSaveButton(employeeId, card);
      });
    }
  });
};

if (addEmployeeBtn) {
  addEmployeeBtn.addEventListener("click", addEmployee);
}

// Erstelle ersten Mitarbeiterfragebogen
addEmployee();

// Zeige den ersten Fragebogen beim Laden
if (employeeCounter > 0) {
  showEmployee(1);
}

function recommendRole(answers) {
  const savedProfiles = JSON.parse(localStorage.getItem("savedProfiles") || "{}");
  
  if (Object.keys(savedProfiles).length === 0) {
    return {
      role: "Keine Profile gefunden",
      probability: 0,
      rationale: "Bitte erstellen und speichern Sie zuerst Job Profile, um Empfehlungen zu erhalten.",
      risks: "Keine Risikobewertung möglich, da keine Rollenprofile vorhanden sind.",
    };
  }

  // Bewerte jedes Profil basierend auf den Antworten
  const profileScores = [];
  
  Object.entries(savedProfiles).forEach(([profileId, profile]) => {
    let score = 0;
    let maxScore = 0;
    const matches = [];
    const missing = [];
    
    // Bewerte Qualifikationen
    if (profile.qualifications) {
      const profileQuals = extractItems(profile.qualifications);
      maxScore += profileQuals.length;
      if (answers.qualifications && answers.qualifications.length > 0) {
        const matchedQuals = answers.qualifications.filter(q => profileQuals.includes(q));
        score += matchedQuals.length;
        if (matchedQuals.length > 0) {
          matches.push(`${matchedQuals.length} Qualifikation(en) passen`);
        }
        const missingQuals = profileQuals.filter(q => !answers.qualifications.includes(q));
        if (missingQuals.length > 0) {
          missing.push(`Fehlende Qualifikationen: ${missingQuals.slice(0, 3).join(", ")}`);
        }
      } else {
        missing.push("Keine Qualifikationen angegeben");
      }
    }
    
    // Bewerte Fähigkeiten
    if (profile.skills) {
      const profileSkills = extractItems(profile.skills);
      maxScore += profileSkills.length;
      if (answers.skills && answers.skills.length > 0) {
        const matchedSkills = answers.skills.filter(s => profileSkills.includes(s));
        score += matchedSkills.length;
        if (matchedSkills.length > 0) {
          matches.push(`${matchedSkills.length} Fähigkeit(en) passen`);
        }
        const missingSkills = profileSkills.filter(s => !answers.skills.includes(s));
        if (missingSkills.length > 0) {
          missing.push(`Fehlende Fähigkeiten: ${missingSkills.slice(0, 3).join(", ")}`);
        }
      } else {
        missing.push("Keine Fähigkeiten angegeben");
      }
    }
    
    // Bewerte Stärken
    if (profile.strengths) {
      const profileStrengths = extractItems(profile.strengths);
      maxScore += profileStrengths.length;
      if (answers.strengths && answers.strengths.length > 0) {
        const matchedStrengths = answers.strengths.filter(s => profileStrengths.includes(s));
        score += matchedStrengths.length;
        if (matchedStrengths.length > 0) {
          matches.push(`${matchedStrengths.length} Stärke(n) passen`);
        }
      }
    }
    
    // Bewerte Verantwortungsbereiche
    if (profile.responsibilityDetails) {
      const profileResp = extractItems(profile.responsibilityDetails);
      maxScore += profileResp.length;
      if (answers.responsibilityDetails && answers.responsibilityDetails.length > 0) {
        const matchedResp = answers.responsibilityDetails.filter(r => profileResp.includes(r));
        score += matchedResp.length;
        if (matchedResp.length > 0) {
          matches.push(`${matchedResp.length} Verantwortungsbereich(e) passen`);
        }
      }
    }
    
    // Berechne Prozentsatz
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    profileScores.push({
      profileId,
      profile,
      score,
      maxScore,
      percentage,
      matches,
      missing: missing.slice(0, 3), // Begrenze auf 3 fehlende Items
    });
  });
  
  // Sortiere nach Prozentsatz (höchste zuerst)
  profileScores.sort((a, b) => b.percentage - a.percentage);
  
  const bestMatch = profileScores[0];
  
  if (!bestMatch || bestMatch.percentage === 0) {
    return {
      role: "Keine passende Rolle gefunden",
      probability: 0,
      rationale: "Die eingegebenen Anforderungen passen zu keinem der definierten Rollenprofile.",
      risks: "Bitte überprüfen Sie die Anforderungen oder erstellen Sie neue Rollenprofile.",
    };
  }
  
  const roleTitle = bestMatch.profile.jobTitle || `Job Profil ${bestMatch.profileId}`;
  const rationale = bestMatch.matches.length > 0
    ? `Passende Aspekte: ${bestMatch.matches.join("; ")}.`
    : "Grundlegende Übereinstimmung mit dem Profil.";
  
  const risks = bestMatch.missing.length > 0
    ? `Zu beachten: ${bestMatch.missing.join("; ")}.`
    : "Alle Hauptanforderungen erfüllt.";
  
  return {
    role: roleTitle,
    probability: bestMatch.percentage,
    rationale: rationale,
    risks: risks,
  };
}

// Funktion zur Berechnung des Match-Prozentsatzes für einen Mitarbeiter und ein Profil
function calculateMatchPercentage(employeeAnswers, profile) {
  let score = 0;
  let maxScore = 0;
  
  // Bewerte Qualifikationen
  if (profile.qualifications) {
    const profileQuals = extractItems(profile.qualifications);
    maxScore += profileQuals.length;
    if (employeeAnswers.qualifications && employeeAnswers.qualifications.length > 0) {
      const matchedQuals = employeeAnswers.qualifications.filter(q => profileQuals.includes(q));
      score += matchedQuals.length;
    }
  }
  
  // Bewerte Fähigkeiten
  if (profile.skills) {
    const profileSkills = extractItems(profile.skills);
    maxScore += profileSkills.length;
    if (employeeAnswers.skills && employeeAnswers.skills.length > 0) {
      const matchedSkills = employeeAnswers.skills.filter(s => profileSkills.includes(s));
      score += matchedSkills.length;
    }
  }
  
  // Bewerte Stärken
  if (profile.strengths) {
    const profileStrengths = extractItems(profile.strengths);
    maxScore += profileStrengths.length;
    if (employeeAnswers.strengths && employeeAnswers.strengths.length > 0) {
      const matchedStrengths = employeeAnswers.strengths.filter(s => profileStrengths.includes(s));
      score += matchedStrengths.length;
    }
  }
  
  // Bewerte Verantwortungsbereiche
  if (profile.responsibilityDetails) {
    const profileResp = extractItems(profile.responsibilityDetails);
    maxScore += profileResp.length;
    if (employeeAnswers.responsibilityDetails && employeeAnswers.responsibilityDetails.length > 0) {
      const matchedResp = employeeAnswers.responsibilityDetails.filter(r => profileResp.includes(r));
      score += matchedResp.length;
    }
  }
  
  // Berechne Prozentsatz
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// Funktion zur Generierung der Gesamtauswertung
function generateOverview() {
  const overviewContainer = document.getElementById("overview-container");
  if (!overviewContainer) return;
  
  const savedProfiles = JSON.parse(localStorage.getItem("savedProfiles") || "{}");
  const employeeAnswers = JSON.parse(localStorage.getItem("employeeAnswers") || "[]");
  
  if (Object.keys(savedProfiles).length === 0) {
    overviewContainer.innerHTML = `
      <div class="text-center py-8 text-slate-500">
        <p>Keine Job Profile vorhanden. Bitte erstellen Sie zuerst Rollenprofile.</p>
      </div>
    `;
    return;
  }
  
  if (employeeAnswers.length === 0) {
    overviewContainer.innerHTML = `
      <div class="text-center py-8 text-slate-500">
        <p>Noch keine Mitarbeiterantworten vorhanden. Bitte füllen Sie zuerst den Fragebogen aus.</p>
      </div>
    `;
    return;
  }
  
  overviewContainer.innerHTML = "";
  
  // Für jedes Profil die Top 3 Kandidaten finden
  Object.entries(savedProfiles).forEach(([profileId, profile]) => {
    const profileTitle = profile.jobTitle || `Job Profil ${profileId}`;
    
    // Berechne Match-Prozentsatz für jeden Mitarbeiter
    const candidateScores = employeeAnswers.map(employee => ({
      employee,
      percentage: calculateMatchPercentage(employee, profile),
    }));
    
    // Sortiere nach Prozentsatz (höchste zuerst) und nimm Top 3
    candidateScores.sort((a, b) => b.percentage - a.percentage);
    const top3 = candidateScores.slice(0, 3);
    
    // Erstelle Karte für dieses Profil
    const profileCard = document.createElement("div");
    profileCard.className = "bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4";
    
    const profileHeader = document.createElement("div");
    profileHeader.className = "border-b border-slate-200 pb-3";
    profileHeader.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-900">${profileTitle}</h3>
      ${profile.function ? `<p class="text-sm text-slate-600">${profile.function}</p>` : ""}
    `;
    profileCard.appendChild(profileHeader);
    
    if (top3.length === 0 || top3[0].percentage === 0) {
      const noCandidates = document.createElement("p");
      noCandidates.className = "text-sm text-slate-500 italic py-4";
      noCandidates.textContent = "Keine passenden Kandidaten gefunden.";
      profileCard.appendChild(noCandidates);
    } else {
      const candidatesList = document.createElement("div");
      candidatesList.className = "space-y-3 pt-2";
      
      top3.forEach((candidate, index) => {
        const candidateItem = document.createElement("div");
        candidateItem.className = "flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4";
        
        const candidateInfo = document.createElement("div");
        candidateInfo.className = "flex items-center gap-3";
        
        const rankBadge = document.createElement("div");
        rankBadge.className = `w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
          index === 0 ? "bg-emerald-100 text-emerald-700" :
          index === 1 ? "bg-blue-100 text-blue-700" :
          "bg-slate-100 text-slate-700"
        }`;
        rankBadge.textContent = index + 1;
        candidateInfo.appendChild(rankBadge);
        
        const candidateName = document.createElement("div");
        candidateName.innerHTML = `
          <p class="font-medium text-slate-900">${candidate.employee.name || "Unbekannt"}</p>
          ${candidate.employee.currentPosition ? `<p class="text-xs text-slate-500">${candidate.employee.currentPosition}</p>` : ""}
        `;
        candidateInfo.appendChild(candidateName);
        
        const percentageBadge = document.createElement("div");
        percentageBadge.className = `px-4 py-2 rounded-lg font-semibold ${
          candidate.percentage >= 70 ? "bg-emerald-100 text-emerald-700" :
          candidate.percentage >= 50 ? "bg-blue-100 text-blue-700" :
          "bg-amber-100 text-amber-700"
        }`;
        percentageBadge.textContent = `${candidate.percentage}%`;
        
        candidateItem.appendChild(candidateInfo);
        candidateItem.appendChild(percentageBadge);
        candidatesList.appendChild(candidateItem);
      });
      
      profileCard.appendChild(candidatesList);
    }
    
    overviewContainer.appendChild(profileCard);
  });
}

