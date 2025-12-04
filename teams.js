// List of NBA teams
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
    { id: "PHI", name: "Philidelphia 76ers" },
    { id: "PHX", name: "Phoenix Suns" },
    { id: "POR", name: "Portland Trail Blazers" },
    { id: "SAC", name: "Sacramento Kings" },
    { id: "SAS", name: "San Antonio Spurs" },
    { id: "TOR", name: "Toronto Raptors" },
    { id: "UTA", name: "Utah Jazz" },
    { id: "WAS", name: "Washington Wizards" },
];

// Store references to the courts
let leftCourt, rightCourt;

// Populate both dropdown menus
function populateDropdowns() {
    const menuLeft = document.getElementById("teamMenuLeft");
    const menuRight = document.getElementById("teamMenuRight");

    teams.forEach(team => {
        // Left dropdown
        const liLeft = document.createElement("li");
        liLeft.innerHTML = `<a class="dropdown-item" href="#" data-id="${team.id}">${team.name}</a>`;
        menuLeft.appendChild(liLeft);

        // Right dropdown
        const liRight = document.createElement("li");
        liRight.innerHTML = `<a class="dropdown-item" href="#" data-id="${team.id}">${team.name}</a>`;
        menuRight.appendChild(liRight);
    });
}

// Update the court for a given div and team
function updateCourt(containerId, teamId) {
    // Remove existing SVG
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    // Call your Court.js init function with the container id
    if (typeof initCourtForContainer === "function") {
        initCourtForContainer(containerId, teamId);
    }

    // Optionally, you can also update heatmaps / stats here per team
}

// Wire up dropdown selections
function setupDropdownHandlers() {
    // LEFT TEAM
    document.getElementById("teamMenuLeft").addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            const teamId = e.target.getAttribute("data-id");
            document.getElementById("teamDropdownLeft").textContent = e.target.textContent;
            updateCourt("court-left", teamId);
        }
    });

    // RIGHT TEAM
    document.getElementById("teamMenuRight").addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            const teamId = e.target.getAttribute("data-id");
            document.getElementById("teamDropdownRight").textContent = e.target.textContent;
            updateCourt("court-right", teamId);
        }
    });
}

// Initialize both dropdowns and courts on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    populateDropdowns();
    setupDropdownHandlers();

    // Optional: initialize with first two teams
    if (teams.length >= 2) {
        updateCourt("court-left", teams[0].id);
        document.getElementById("teamDropdownLeft").textContent = teams[0].name;

        updateCourt("court-right", teams[1].id);
        document.getElementById("teamDropdownRight").textContent = teams[1].name;
    }
});

const allStats = [
    "Expected Points Pace",
    "Jump Shots Pace",
    "Layups Pace",
    "Dunks Pace",
    "Hooks Pace",
    "From Turnovers Pace",
    "Second Chance Pace",
    "Fast Break Pace",
];

window.addEventListener("DOMContentLoaded", () => {
    const statsList = document.getElementById("stats-list");

    allStats.forEach(stat => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between";

        li.innerHTML = `
            <span>${stat}</span>
            <span id="value-${stat.replaceAll(' ', '-')}" class="fw-bold text-primary">—</span>
        `;

        statsList.appendChild(li);
    });
});

d3.csv("stats.csv").then(data => {
    const teamData = data.find(row => row.Team === selectedTeam);

    allStats.forEach(stat => {
        const key = stat.replaceAll(" ", "-");
        const element = document.getElementById(`value-${key}`);

        element.textContent = teamData[stat] || "N/A";
    });
});

