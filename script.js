const searchForm = document.querySelector("#searchForm");
const conditionInput = document.querySelector("#conditionInput");
const searchButton = document.querySelector("#searchButton");
const resultsMessage = document.querySelector("#resultsMessage");
const resultsList = document.querySelector("#resultsList");
const resultCount = document.querySelector("#resultCount");
const chartCanvas = document.querySelector("#statusChart");

const apiAddress = "https://clinicaltrials.gov/api/v2/studies";
const chartStatuses = [
  "Recruiting",
  "Not yet recruiting",
  "Active, not recruiting",
  "Completed",
  "Other"
];
let statusChart = null;

// Loads a small page of studies matching the selected health topic.
async function loadTrials(searchTerm) {
  const apiUrl = new URL(apiAddress);
  apiUrl.searchParams.set("query.cond", searchTerm);
  apiUrl.searchParams.set("pageSize", "10");
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("The research database could not be reached.");
  }

  const data = await response.json();
  return data.studies || [];
}

// Shows a short message below the search box.
function showMessage(message, isError) {
  resultsMessage.textContent = message;
  resultsMessage.classList.toggle("error", isError);
}

// Finds the study's main details and returns safe display values.
function getStudyDetails(study) {
  const protocol = study.protocolSection || {};
  const sponsorModule = protocol.sponsorCollaboratorsModule || {};
  return {
    identification: protocol.identificationModule || {},
    status: protocol.statusModule || {},
    design: protocol.designModule || {},
    sponsor: sponsorModule.leadSponsor || {}
  };
}

// Returns a readable phase label for a clinical trial.
function getTrialPhase(design) {
  const phases = design.phases || [];
  if (phases.length === 0) {
    return "Phase not reported";
  }
  return phases.join(", ");
}

// Turns the database status into a short chart label.
function getStatusLabel(status) {
  if (status === "RECRUITING") return "Recruiting";
  if (status === "NOT_YET_RECRUITING") return "Not yet recruiting";
  if (status === "ACTIVE_NOT_RECRUITING") return "Active, not recruiting";
  if (status === "COMPLETED") return "Completed";
  return "Other";
}

// Counts how many displayed studies have each recruitment status.
function countStatuses(studies) {
  const counts = {
    "Recruiting": 0,
    "Not yet recruiting": 0,
    "Active, not recruiting": 0,
    "Completed": 0,
    "Other": 0
  };

  for (const study of studies) {
    const details = getStudyDetails(study);
    const label = getStatusLabel(details.status.overallStatus);
    counts[label] += 1;
  }
  return counts;
}

// Creates one study card using text rather than inserting HTML from the API.
function createTrialCard(study) {
  const details = getStudyDetails(study);
  const card = document.createElement("article");
  card.className = "trial-card";

  const topLine = document.createElement("div");
  topLine.className = "trial-topline";
  topLine.append(createStudyId(details.identification.nctId));
  topLine.append(createStatusPill(details.status.overallStatus));

  const title = document.createElement("h3");
  title.textContent = details.identification.briefTitle || "Untitled study";
  const sponsor = document.createElement("p");
  sponsor.className = "trial-sponsor";
  sponsor.textContent = `Lead sponsor: ${details.sponsor.name || "Not reported"}`;
  const bottomLine = createTrialLink(details.identification.nctId, details.design);
  card.append(topLine, title, sponsor, bottomLine);
  return card;
}

// Creates the study ID shown at the top of a result card.
function createStudyId(nctId) {
  const idLabel = document.createElement("span");
  idLabel.className = "trial-id";
  idLabel.textContent = nctId || "ID not available";
  return idLabel;
}

// Creates a colored badge for the study's recruitment status.
function createStatusPill(status) {
  const pill = document.createElement("span");
  const label = getStatusLabel(status);
  pill.className = "status-pill";
  if (label === "Completed") pill.classList.add("status-blue");
  if (label === "Other") pill.classList.add("status-gray");
  pill.textContent = status ? status.replaceAll("_", " ") : "STATUS NOT REPORTED";
  return pill;
}

// Creates the phase label and official study link for a result card.
function createTrialLink(nctId, design) {
  const bottomLine = document.createElement("div");
  bottomLine.className = "trial-bottomline";

  const phase = document.createElement("span");
  phase.className = "trial-phase";
  phase.textContent = getTrialPhase(design);
  bottomLine.append(phase);

  if (nctId) {
    const link = document.createElement("a");
    link.className = "trial-link";
    link.href = `https://clinicaltrials.gov/study/${encodeURIComponent(nctId)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View study \u2197";
    bottomLine.append(link);
  }
  return bottomLine;
}

// Draws a chart of status counts for the studies currently displayed.
function updateStatusChart(studies) {
  const counts = countStatuses(studies);
  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: chartStatuses,
      datasets: [{
        data: chartStatuses.map((status) => counts[status]),
        backgroundColor: ["#28c6a4", "#8796f2", "#b2bcf5", "#4a66e8", "#cbd1de"],
        borderRadius: 6,
        barThickness: 13
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { displayColors: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, stepSize: 1 },
          grid: { color: "#f0f2f7" }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#78839a", font: { size: 9 } }
        }
      }
    }
  });
}

// Displays the cards and chart for a set of matching studies.
function showTrials(studies, searchTerm) {
  resultsList.replaceChildren();
  resultCount.textContent = `${studies.length} ${studies.length === 1 ? "study" : "studies"}`;

  if (studies.length === 0) {
    resultsList.innerHTML = '<p class="empty-state">No matching studies found. Try a broader topic.</p>';
  }
  for (const study of studies) {
    resultsList.append(createTrialCard(study));
  }

  updateStatusChart(studies);
  showMessage(`Showing up to 10 studies for "${searchTerm}".`, false);
}

// Searches the API, then displays matching research or a clear error.
async function searchStudies(searchTerm) {
  searchButton.disabled = true;
  resultsList.replaceChildren();
  resultCount.textContent = "Loading...";
  showMessage("Searching the ClinicalTrials.gov research database...", false);

  try {
    const studies = await loadTrials(searchTerm);
    showTrials(studies, searchTerm);
  } catch (error) {
    resultCount.textContent = "Unavailable";
    showMessage(`${error.message} Check your connection and try again.`, true);
  } finally {
    searchButton.disabled = false;
  }
}

// Starts a new search when the user submits the topic form.
function handleSearch(event) {
  event.preventDefault();
  const searchTerm = conditionInput.value.trim();
  if (searchTerm) {
    searchStudies(searchTerm);
  }
}

searchForm.addEventListener("submit", handleSearch);
searchStudies(conditionInput.value);