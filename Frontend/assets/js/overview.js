async function loadChart() {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetch("http://localhost:8000/api/matches/get/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch matches data");
    }

    const data = await response.json();

    // Initialize arrays for each day
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const winsPerDay = Array(7).fill(0);
    const lossesPerDay = Array(7).fill(0);

    // Process matches to count wins/losses per day
    data.recent_matches.forEach((match) => {
      const matchDate = new Date(match.created_at);
      const dayIndex = matchDate.getDay();
      const currentUser = localStorage.getItem("username");

      if (match.winner__username === currentUser) {
        winsPerDay[dayIndex]++;
      } else {
        lossesPerDay[dayIndex]++;
      }
    });

    // Top Players Chart
    const topPlayersChart = new Chart(
      document.getElementById("topPlayersChart"),
      {
        type: "bar",
        data: {
          labels: data.overview_stats.top_players.map(
            (player) => player.username
          ),
          datasets: [
            {
              label: "Matches Played",
              data: data.overview_stats.top_players.map(
                (player) => player.matches
              ),
              backgroundColor: "rgba(51, 147, 234, 0.4)",
              borderColor: "rgba(51, 147, 234, 0.8)",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          indexAxis: "y",
          plugins: {
            legend: {
              display: true,
              labels: { color: "white" },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: "white",
                // stepSize: 1,
                callback: (value) => Math.round(value),
              },
            },
            y: {
              ticks: { color: "white" },
            },
          },
        },
      }
    );

    // Average Scores Chart
    const avgScoresChart = new Chart(
      document.getElementById("avgScoresChart"),
      {
        type: "doughnut",
        data: {
          labels: ["Player 1", "Player 2"],
          datasets: [
            {
              data: [
                data.overview_stats.average_scores.player1,
                data.overview_stats.average_scores.player2,
              ],
              backgroundColor: [
                "rgba(51, 147, 234, 0.4)",
                "rgba(180, 216, 254, 0.4)",
              ],
              borderColor: [
                "rgba(51, 147, 234, 0.8)",
                "rgba(180, 216, 254, 0.8)",
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: {
              display: true,
              labels: { color: "white" },
            },
          },
        },
      }
    );

    const getStatusBadge = (status) => {
      const statusColors = {
        active: "bg-success",
        pending: "bg-warning",
        finished: "bg-secondary",
        cancelled: "bg-danger",
      };
      return `<span class="badge ${
        statusColors[status.toLowerCase()] || "bg-secondary"
      }">${status}</span>`;
    };

    // Update match history
    const matchHistory = document.getElementById("latest-matches");
    matchHistory.innerHTML = data.recent_matches
      .map(
        (match) => `
        <tr>
            <td>${new Date(match.created_at).toLocaleDateString()}</td>
            <td>${match.player1__username} vs ${match.player2__username}</td>
            <td>${match.player1_score} - ${match.player2_score}</td>
            <td>${match.winner__username || "Undefined"}</td>
            <td>${getStatusBadge(match.status)}</td>
        </tr>
    `
      )
      .join("");

    // Update tournament history
    const tournamentHistory = document.getElementById("latest-tounaments");
    tournamentHistory.innerHTML = data.tournament_history
      .map(
        (tournament) => `
          <tr>
              <td>${tournament.name}</td>
              <td>${getStatusBadge(tournament.status)}</td>
              <td>${tournament.player_count}</td>
              <td>${new Date(tournament.created_at).toLocaleDateString()}</td>
              <td>${tournament.winner__username || "Undefined"}</td>
          </tr>
      `
      )
      .join("");
  } catch (error) {
    displayMessage("Failed to load graphics data", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}
