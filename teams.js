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
    { id: "WAS", name: "Washington Wizards" }
];

// ===============================
// TEAM COLORS
// ===============================
const TEAM_COLORS = {
    ATL: "#E03A3E",
    BOS: "#007A33",
    BKN: "#2B2B2B",
    CHA: "#2C1A7A",
    CHI: "#CE1141",
    CLE: "#860038",
    DAL: "#00538C",
    DEN: "#1B3A6F",
    DET: "#C8102E",
    GSW: "#1D428A",
    HOU: "#CE1141",
    IND: "#002D62",
    LAC: "#C8102E",
    LAL: "#552583",
    MEM: "#4A6FA5",
    MIA: "#98002E",
    MIL: "#00471B",
    MIN: "#1E3A5F",
    NOP: "#002B5C",
    NYK: "#F58426",
    OKC: "#007AC1",
    ORL: "#0077C0",
    PHI: "#006BB6",
    PHX: "#5A2D81",
    POR: "#E03A3E",
    SAC: "#5A2D81",
    SAS: "#8A8D8F",
    TOR: "#CE1141",
    UTA: "#4B6CB7",
    WAS: "#002B5C"
};

window.TEAM_COLORS = TEAM_COLORS;

// ===============================
// GLOBAL SELECTED TEAM STATE
// ===============================
window.SELECTED_TEAMS = {
    left: { id: null, color: null },
    right: { id: null, color: null }
};

// ===============================
// CSV + STATS CONFIG
// ===============================
let csvData = [];

const allStats = [
    "Expected Points Pace",
    "Jump Shots Pace",
    "Layups Pace",
    "Dunks Pace",
    "Hooks Pace",
    "From Turnovers Pace",
    "From Second Chances Pace",
    "From Fast Break Pace"
];

// ===============================
// DROPDOWN POPULATION
// ===============================
function populateDropdowns() {
    const leftMenu = document.getElementById("teamMenuLeft");
    const rightMenu = document.getElementById("teamMenuRight");

    leftMenu.innerHTML = "";
    rightMenu.innerHTML = "";

    teams.forEach(team => {
        leftMenu.insertAdjacentHTML(
            "beforeend",
            `<li><a class="dropdown-item" href="#" data-id="${team.id}">${team.name}</a></li>`
        );
        rightMenu.insertAdjacentHTML(
            "beforeend",
            `<li><a class="dropdown-item" href="#" data-id="${team.id}">${team.name}</a></li>`
        );
    });
}

// ===============================
// STATS LIST UI
// ===============================
function buildStatsList() {
    const list = document.getElementById("stats-list");
    list.innerHTML = "";

    allStats.forEach(stat => {
        const key = stat.replace(/ /g, "-");
        list.insertAdjacentHTML(
            "beforeend",
            `
            <li class="list-group-item d-flex justify-content-between">
                <span>${stat}</span>
                <span id="value-left-${key}" class="fw-bold text-primary">—</span>
                <span id="value-right-${key}" class="fw-bold text-danger">—</span>
            </li>
            `
        );
    });
}

// ===============================
// COURT UPDATE
// ===============================
function updateCourt(containerId, teamId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const courtDiv = container.querySelector("div[id^='court']");
    if (!courtDiv) return;

    courtDiv.innerHTML = "";
}

// ===============================
// TEAM LOGOS
// ===============================
function updateTeamLogo(side, teamId) {
    const img = document.getElementById(side === "left" ? "logo-left" : "logo-right");
    if (!img || !teamId) return;

    img.onload = () => (img.style.display = "block");
    img.onerror = () => (img.style.display = "none");
    img.src = `logos/${teamId}.webp`;
}


// ===============================
// CSV STATS LOADING
// ===============================
function loadTeamStats() {
    if (!csvData.length) {
        d3.csv("data/shots_region_team_pace_20252026.csv")
            .then(data => {
                csvData = data;
                loadTeamStats();
            })
            .catch(console.error);
        return;
    }

    function getRow(teamId) {
        return csvData.find(r =>
            Object.keys(r).some(c => c.startsWith(teamId + "_"))
        );
    }

    const leftRow = getRow(window.SELECTED_TEAMS.left.id);
    const rightRow = getRow(window.SELECTED_TEAMS.right.id);

    allStats.forEach(stat => {
        const id = stat.replace(/ /g, "-");

        const leftKey = window.SELECTED_TEAMS.left.id
            ? `${window.SELECTED_TEAMS.left.id}_${stat.replace(/ /g, "_")}`
            : null;

        const rightKey = window.SELECTED_TEAMS.right.id
            ? `${window.SELECTED_TEAMS.right.id}_${stat.replace(/ /g, "_")}`
            : null;

        document.getElementById(`value-left-${id}`).textContent =
            leftRow && leftKey in leftRow ? leftRow[leftKey] : "N/A";

        document.getElementById(`value-right-${id}`).textContent =
            rightRow && rightKey in rightRow ? rightRow[rightKey] : "N/A";
    });
}

let opacityScale;

function buildOpacityScaleFromRegionAverages() {
    const regionAverages = [];

    csvData.forEach(row => {
        let sum = 0;
        let count = 0;

        Object.keys(row).forEach(key => {
            if (key.endsWith("_Expected_Points_Pace")) {
                const v = +row[key];
                if (!isNaN(v)) {
                    sum += v;
                    count++;
                }
            }
        });

        if (count > 0) {
            regionAverages.push(sum / count);
        }
    });

    const [min, max] = d3.extent(regionAverages);

    opacityScale = d3.scaleLinear()
        .domain([min, max])
        .range([0.25, 1])
        .clamp(true);
}

// ===============================
// UPDATE TEAM COLORS IN UI + COURT REGIONS
// ===============================
function updateTeamColors() {
    const leftColor = window.SELECTED_TEAMS.left.color || "#000000";
    const rightColor = window.SELECTED_TEAMS.right.color || "#000000";

    // --- Update Dropdown Text Colors ---
    const leftDropdown = document.getElementById("teamDropdownLeft");
    const rightDropdown = document.getElementById("teamDropdownRight");
    if (leftDropdown) leftDropdown.style.color = leftColor;
    if (rightDropdown) rightDropdown.style.color = rightColor;

    // --- Update Court Borders ---
    const court1 = document.getElementById("court1");
    const court2 = document.getElementById("court2");
    if (court1) {
        court1.style.borderColor = leftColor;
        court1.style.borderStyle = "solid";
        court1.style.borderWidth = "2px";
    }
    if (court2) {
        court2.style.borderColor = rightColor;
        court2.style.borderStyle = "solid";
        court2.style.borderWidth = "2px";
    }

    // --- Update Stats Text ---
    allStats.forEach(stat => {
        const key = stat.replace(/ /g, "-");
        const leftValue = document.getElementById(`value-left-${key}`);
        const rightValue = document.getElementById(`value-right-${key}`);
        if (leftValue) leftValue.style.color = leftColor;
        if (rightValue) rightValue.style.color = rightColor;
    });

    // --- Update Court Polygons ---
    if (typeof court_g !== "undefined") {
        court_g.selectAll(".aqua-cyan-region")
            .attr("fill", leftColor)
        court_g.selectAll(".coral-chartreuse-region")
            .attr("fill", leftColor)
        court_g.selectAll(".orchid-top-paint-region")
            .attr("fill", leftColor);
        court_g.selectAll(".sienna-bottom-paint-region")
            .attr("fill", leftColor);
        court_g.selectAll(".orange-red-center-region")
            .attr("fill", leftColor);
        court_g.selectAll(".orange-black-center-region-right")
            .attr("fill", leftColor);
        court_g.selectAll(".orange-red-outer-region")
            .attr("fill", leftColor);
        court_g.selectAll(".yellow-orange-outer-region")
            .attr("fill", leftColor);
        court_g.selectAll(".maroon-magenta-region")
            .attr("fill", leftColor)
        court_g.selectAll(".lime-fuchsia-region")
            .attr("fill", leftColor);
        court_g.selectAll(".region-11-combined")
            .attr("fill", leftColor);
        court_g.selectAll(".region-12-combined")
            .attr("fill", leftColor)
        court_g.selectAll(".orange-red-region")
            .attr("fill", leftColor);
        court_g.selectAll(".orange-red-region-right")
            .attr("fill", leftColor);
        court_g2.selectAll(".aqua-cyan-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".coral-chartreuse-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".orchid-top-paint-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".sienna-bottom-paint-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".orange-red-center-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".orange-black-center-region-right2")
            .attr("fill", rightColor);
        court_g2.selectAll(".orange-red-outer-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".yellow-orange-outer-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".maroon-magenta-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".lime-fuchsia-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".region-11-combined2")
            .attr("fill", rightColor);
        court_g2.selectAll(".region-12-combined2")
            .attr("fill", rightColor);
        court_g2.selectAll(".orange-red-region2")
            .attr("fill", rightColor);
        court_g2.selectAll(".orange-red-region-right2")
            .attr("fill", rightColor);
    }
}


// ===============================
// DROPDOWN HANDLERS
// ===============================
function setupDropdownHandlers() {
    document.getElementById("teamMenuLeft").addEventListener("click", e => {
        if (e.target.tagName !== "A") return;

        const teamId = e.target.dataset.id;
        window.SELECTED_TEAMS.left = {
            id: teamId,
            color: TEAM_COLORS[teamId]
        };

        document.getElementById("teamDropdownLeft").textContent = e.target.textContent;
        updateCourt("court1", teamId);
        updateTeamLogo("left", teamId);
        loadTeamStats();
        updateTeamColors();
    });

    document.getElementById("teamMenuRight").addEventListener("click", e => {
        if (e.target.tagName !== "A") return;

        const teamId = e.target.dataset.id;
        window.SELECTED_TEAMS.right = {
            id: teamId,
            color: TEAM_COLORS[teamId]
        };

        document.getElementById("teamDropdownRight").textContent = e.target.textContent;
        updateCourt("court2", teamId);
        updateTeamLogo("right", teamId);
        loadTeamStats();
        updateTeamColors();
    });
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    populateDropdowns();
    buildStatsList();
    setupDropdownHandlers();

    const left = teams[0];
    const right = teams[1];

    window.SELECTED_TEAMS.left = { id: left.id, color: TEAM_COLORS[left.id] };
    window.SELECTED_TEAMS.right = { id: right.id, color: TEAM_COLORS[right.id] };

    document.getElementById("teamDropdownLeft").textContent = left.name;
    document.getElementById("teamDropdownRight").textContent = right.name;

    updateCourt("court1", left.id);
    updateCourt("court2", right.id);

    updateTeamLogo("left", left.id);
    updateTeamLogo("right", right.id);

    loadTeamStats();
    updateTeamColors();
});