// ===============================
// NBA TEAMS LIST
// ===============================
const teams = [
    { id: "ATL", name: "Atlanta Hawks" },
    { id: "BOS", name: "Boston Celtics" },
    { id: "BKN", name: "Brooklyn Nets" },
    { id: "CHA", name: "Charlotte Hornets" },
    { id: "CHI", name: "Chicago Bulls" },
    { id: "CLE", name: "Cleveland Cavaliers" },
    { id: "DAL", name: "Dallas Mavericks" },
    { id: "DEN", name: "Denver Nuggets" },
    { id: "DET", name: "Detroit Pistons" },
    { id: "GSW", name: "Golden State Warriors" },
    { id: "HOU", name: "Houston Rockets" },
    { id: "IND", name: "Indiana Pacers" },
    { id: "LAC", name: "Los Angeles Clippers" },
    { id: "LAL", name: "Los Angeles Lakers" },
    { id: "MEM", name: "Memphis Grizzlies" },
    { id: "MIA", name: "Miami Heat" },
    { id: "MIL", name: "Milwaukee Bucks" },
    { id: "MIN", name: "Minnesota Timberwolves" },
    { id: "NOP", name: "New Orleans Pelicans" },
    { id: "NYK", name: "New York Knicks" },
    { id: "OKC", name: "Oklahoma City Thunder" },
    { id: "ORL", name: "Orlando Magic" },
    { id: "PHI", name: "Philadelphia 76ers" },
    { id: "PHX", name: "Phoenix Suns" },
    { id: "POR", name: "Portland Trail Blazers" },
    { id: "SAC", name: "Sacramento Kings" },
    { id: "SAS", name: "San Antonio Spurs" },
    { id: "TOR", name: "Toronto Raptors" },
    { id: "UTA", name: "Utah Jazz" },
    { id: "WAS", name: "Washington Wizards" },
];

const TEAM_COLORS = {
    ATL: "#E03A3E",
    BOS: "#007A33",
    BKN: "#000000",
    CHA: "#1D1160",
    CHI: "#CE1141",
    CLE: "#860038",
    DAL: "#00538C",
    DEN: "#0E2240",
    DET: "#C8102E",
    GSW: "#1D428A",
    HOU: "#CE1141",
    IND: "#002D62",
    LAC: "#C8102E",
    LAL: "#552583",
    MEM: "#5D76A9",
    MIA: "#98002E",
    MIL: "#00471B",
    MIN: "#0C2340",
    NOP: "#0C2340",
    NYK: "#006BB6",
    OKC: "#007AC1",
    ORL: "#0077C0",
    PHI: "#006BB6",
    PHX: "#1D1160",
    POR: "#E03A3E",
    SAC: "#5A2D81",
    SAS: "#C4CED4",
    TOR: "#CE1141",
    UTA: "#002B5C",
    WAS: "#002B5C"
};

window.TEAM_COLORS = TEAM_COLORS;

// ===============================
// GLOBAL STATE
// ===============================
let csvData = [];
let selectedLeftTeam = null;
let selectedRightTeam = null;

const allStats = [
    "Expected Points Pace",
    "Jump Shots Pace",
    "Layups Pace",
    "Dunks Pace",
    "Hooks Pace",
    "From Turnovers Pace",
    "From Second Chances Pace",
    "From Fast Break Pace",
];

// ===============================
// POPULATE DROPDOWN MENUS
// ===============================
function populateDropdowns() {
    const menuLeft = document.getElementById("teamMenuLeft");
    const menuRight = document.getElementById("teamMenuRight");

    menuLeft.innerHTML = "";
    menuRight.innerHTML = "";

    teams.forEach(team => {
        const liLeft = document.createElement("li");
        liLeft.innerHTML = `<a class="dropdown-item" href="#" data-id="${team.id}">${team.name}</a>`;
        menuLeft.appendChild(liLeft);

        const liRight = document.createElement("li");
        liRight.innerHTML = `<a class="dropdown-item" href="#" data-id="${team.id}">${team.name}</a>`;
        menuRight.appendChild(liRight);
    });
}

// ===============================
// BUILD STATS LIST
// ===============================
function buildStatsList() {
    const statsList = document.getElementById("stats-list");
    statsList.innerHTML = "";

    allStats.forEach(stat => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between";

        li.innerHTML = `
            <span>${stat}</span>
            <span id="value-left-${stat.replace(/ /g, '-')}" class="fw-bold text-primary">—</span>
            <span id="value-right-${stat.replace(/ /g, '-')}" class="fw-bold text-danger">—</span>
        `;
        statsList.appendChild(li);
    });
}

// ===============================
// UPDATE COURT (compatible with Court.js)
// ===============================
function updateCourt(containerId, teamId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Nested div that Court.js expects
    const courtDiv = container.querySelector("div[id^='court']");
    if (!courtDiv) return;

    courtDiv.innerHTML = ""; // clear previous content

    if (typeof renderCourtInto === "function") {
        renderCourtInto(courtDiv, teamId).then(() => {
            if (typeof initCourtForContainer === "function") {
                initCourtForContainer(containerId);
            }
        });
    } else if (typeof initCourtForContainer === "function") {
        initCourtForContainer(containerId);
    }
}

// ===============================
// UPDATE TEAM LOGO
// ===============================
function updateTeamLogo(side, teamId) {
    const img = document.getElementById(side === "left" ? "logo-left" : "logo-right");
    if (!img) return;

    if (!teamId) {
        img.style.display = "none";
        return;
    }

    img.onload = () => { img.style.display = "block"; };
    img.onerror = () => { img.style.display = "none"; };
    img.src = `logos/${teamId}.webp`;
}

// ===============================
// LOAD CSV AND UPDATE STATS
// ===============================
function loadTeamStats() {
    if (!csvData.length) {
        d3.csv("data/shots_region_team_pace_20252026.csv").then(data => {
            csvData = data;
            loadTeamStats(); // retry after loading
        }).catch(err => console.error("Failed to load CSV:", err));
        return;
    }

    function applyTeamHeatmap(containerId, teamId, stat = "Expected Points Pace") {
        if (!teamId || !csvData.length) return;

        const key = `${teamId}_${stat.replace(/ /g, "_")}`;

        // Build Region -> value map
        const regionToValue = new Map(
            csvData.map(row => [Number(row.Region), Number(row[key])])
        );

        const values = [...regionToValue.values()].filter(v => Number.isFinite(v));
        if (!values.length) return;

        const [minV, maxV] = d3.extent(values);
        const colorScale = d3.scaleSequential(d3.interpolateReds).domain([minV, maxV]);

        d3.select(`#${containerId}`)
            .selectAll("polygon.shot-region")
            .attr("fill", function () {
                const r = Number(this.dataset.region);
                const v = regionToValue.get(r);
                return Number.isFinite(v) ? colorScale(v) : "white";
            })
            .attr("opacity", 0.95);
    }


    function getTeamRow(teamId) {
        if (!teamId) return null;
        return csvData.find(row => Object.keys(row).some(col => col.startsWith(teamId + "_")));
    }

    const leftRow = getTeamRow(selectedLeftTeam);
    const rightRow = getTeamRow(selectedRightTeam);

    allStats.forEach(stat => {
        const statId = stat.replace(/ /g, '-');
        const leftKey = selectedLeftTeam ? `${selectedLeftTeam}_${stat.replace(/ /g, '_')}` : null;
        const rightKey = selectedRightTeam ? `${selectedRightTeam}_${stat.replace(/ /g, '_')}` : null;

        const leftElem = document.getElementById(`value-left-${statId}`);
        const rightElem = document.getElementById(`value-right-${statId}`);

        if (leftElem) leftElem.textContent = leftRow && leftKey in leftRow ? leftRow[leftKey] : "N/A";
        if (rightElem) rightElem.textContent = rightRow && rightKey in rightRow ? rightRow[rightKey] : "N/A";
    });
}

// ===============================
// DROPDOWN HANDLERS
// ===============================
function setupDropdownHandlers() {
    document.getElementById("teamMenuLeft").addEventListener("click", e => {
        if (e.target.tagName !== "A") return;

        selectedLeftTeam = e.target.dataset.id;
        document.getElementById("teamDropdownLeft").textContent = e.target.textContent;

        updateCourt("court1", selectedLeftTeam);
        updateTeamLogo("left", selectedLeftTeam);
        loadTeamStats();
    });

    document.getElementById("teamMenuRight").addEventListener("click", e => {
        if (e.target.tagName !== "A") return;

        selectedRightTeam = e.target.dataset.id;
        document.getElementById("teamDropdownRight").textContent = e.target.textContent;

        updateCourt("court2", selectedRightTeam);
        updateTeamLogo("right", selectedRightTeam);
        loadTeamStats();
    });
}


// ===============================
// INITIALIZATION
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    populateDropdowns();
    buildStatsList();
    setupDropdownHandlers();

    // Initialize first two teams automatically
    if (teams.length >= 2) {
        selectedLeftTeam = teams[0].id;
        selectedRightTeam = teams[1].id;

        document.getElementById("teamDropdownLeft").textContent = teams[0].name;
        document.getElementById("teamDropdownRight").textContent = teams[1].name;

        updateCourt("court1", selectedLeftTeam);
        updateCourt("court2", selectedRightTeam);

        updateTeamLogo("left", selectedLeftTeam);
        updateTeamLogo("right", selectedRightTeam);

        loadTeamStats();
    }
});
