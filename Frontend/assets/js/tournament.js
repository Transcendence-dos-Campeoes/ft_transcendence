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
        <tr>
            <td>${tournament.tournamentName}</td>
            <td>${tournament.creator}</td>
            <td>${tournament.currentPlayers}/${tournament.maxPlayers}</td>
            <td>${tournament.status}</td>
            <td>
                ${
                  tournament.creator === currentUser
                    ? `<button 
                        class="btn btn-success btn-sm" 
                        onclick="startTournament(${tournament.id})"
                        ${tournament.currentPlayers < 4 ? "disabled" : ""}
                    >
                        Start Tournament
                    </button>`
                    : `<button 
                        class="btn btn-primary btn-sm" 
                        onclick="joinTournament(${tournament.id})"
                        ${
                          tournament.currentPlayers >= tournament.maxPlayers
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
