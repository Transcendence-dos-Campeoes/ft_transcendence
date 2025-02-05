async function attachTournamentFormListener() {
  const form = document.getElementById("new-tournament-form");
  if (!form) {
    console.error("Tournament form not found");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("📝 Submitting tournament form");
    const loadingOverlay = new LoadingOverlay();

    const tournamentName = document.getElementById("tournament-name").value;
    const maxPlayers = document.getElementById("max-players").value;

    try {
      loadingOverlay.show();
      const response = await fetch(
        "http://localhost:8000/api/tournaments/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({
            tournamentName: tournamentName,
            maxPlayers: maxPlayers,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create tournament");
      }

      // Show success message
      displayMessage("Tournament created successfully", MessageType.SUCCESS);
      renderElement("overview");
    } catch (error) {
      console.error("❌ Error creating tournament:", error);
      displayMessage("Failed to create tournament", MessageType.ERROR);
    } finally {
      loadingOverlay.hide();
    }
  });
}

// Add join tournament function
async function joinTournament(tournamentId) {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetch(
      `http://localhost:8000/api/tournaments/${tournamentId}/join/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to join tournament");
    }

    displayMessage("Successfully joined tournament!", MessageType.SUCCESS);
    loadAvailableTournaments(); // Refresh the list
  } catch (error) {
    displayMessage("Failed to join tournament", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}

async function startTournament(tournamentId) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/tournaments/${tournamentId}/start/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to start tournament");

    displayMessage("Tournament started successfully!", MessageType.SUCCESS);
    loadAvailableTournaments();
  } catch (error) {
    displayMessage("Failed to start tournament", MessageType.ERROR);
  }
}

async function loadTournamentBracket(tournamentId) {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetch(`http://localhost:8000/api/tournaments/${tournamentId}/bracket/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load tournament bracket");
    }

    const data = await response.json();
    renderBracket(data);
  } catch (error) {
    displayMessage("Failed to load tournament bracket", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}

function renderBracket(data) {
  const container = document.getElementById('tournament-bracket-container');
  const rounds = Object.entries(data.rounds).sort((a, b) => a[0] - b[0]);

  let bracketHtml = '<div class="tournament-bracket d-flex">';

  rounds.forEach(([roundNum, matches]) => {
    bracketHtml += `
      <div class="round mx-3">
          <h5 class="text-center mb-3">Round ${roundNum}</h5>
          <div class="matches">
              ${matches.map(match => `
                  <div class="match-container mb-3">
                      <div class="match-connector"></div>
                      <div class="match card bg-dark">
                          <div class="card-body p-2">
                              <div class="player ${match.winner === match.player1 ? 'winner' : ''}">
                                  <span>${match.player1 || 'TBD'}</span>
                                  <span class="score">${match.player1_score || '0'}</span>
                              </div>
                              <div class="player ${match.winner === match.player2 ? 'winner' : ''}">
                                  <span>${match.player2 || 'TBD'}</span>
                                  <span class="score">${match.player2_score || '0'}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              `).join('')}
          </div>
      </div>
  `;
  });

  bracketHtml += '</div>';
  container.innerHTML = bracketHtml;
}

async function loadAvailableTournaments() {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetch("http://localhost:8000/api/tournaments/get/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tournaments");
    }

    const tournaments = await response.json();
    const currentUser = localStorage.getItem("username");
    const tbody = document.getElementById("available-tournaments");
    const noTournamentsDiv = document.getElementById("no-tournaments");

    if (tournaments.length === 0) {
      tbody.innerHTML = "";
      noTournamentsDiv.classList.remove("d-none");
      return;
    }

    noTournamentsDiv.classList.add("d-none");
    tbody.innerHTML = tournaments
      .map(
        (tournament) => `
        <tr style="cursor: pointer">
            <td onclick="renderElement('tournamentBracket'); loadTournamentBracket(${tournament.id})">${tournament.tournamentName}</td>
            <td>${tournament.creator}</td>
            <td>${tournament.currentPlayers}/${tournament.maxPlayers}</td>
            <td>${tournament.status}</td>
            <td>
                ${tournament.creator === currentUser
            ? `<button 
                        class="btn btn-success btn-sm" 
                        onclick="startTournament(${tournament.id})"
                        ${tournament.currentPlayers < 4 ? "disabled" : ""}
                    >
                        Start Tournament
                    </button>
                    <button 
                        class="btn btn-primary btn-sm" 
                        onclick="joinTournament(${tournament.id})"
                        ${tournament.currentPlayers >= tournament.maxPlayers
              ? "disabled"
              : ""
            }
                    >
                        Join
                    </button>`
            : `<button 
                        class="btn btn-primary btn-sm" 
                        onclick="joinTournament(${tournament.id})"
                        ${tournament.currentPlayers >= tournament.maxPlayers
              ? "disabled"
              : ""
            }
                    >
                        Join
                    </button>`
          }
            </td>
        </tr>
    `
      )
      .join("");
  } catch (error) {
    displayMessage("Failed to load tournaments", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}
