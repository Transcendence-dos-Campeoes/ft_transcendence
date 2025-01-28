async function loadProfileData() {
  try {
    const response = await fetch("http://localhost:8000/api/users/profile/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile data");
    }

    const data = await response.json();

    // Update profile form
    document.getElementById("username-input").value = data.username;
    document.getElementById("email-input").value = data.email;
    document.getElementById("profile-username").textContent = data.username;

    // Update stats section
    const stats = data.stats;
    const statsChart = new Chart(document.getElementById("statsChart"), {
      type: "bar",
      data: {
        labels: ["Total Games", "Wins", "Losses", "Win Rate"],
        datasets: [
          {
            data: [
              stats.total_matches,
              stats.wins,
              stats.losses,
              stats.win_rate,
            ],
            backgroundColor: [
              "rgba(255, 255, 255, 0.4)",
              "rgba(75, 192, 192, 0.4)",
              "rgba(255, 99, 132, 0.4)",
              "rgba(54, 162, 235, 0.4)",
            ],
            borderColor: "rgba(255, 255, 255, 0.8)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "white" },
          },
          x: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "white" },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });

    // Update match history
    const matchHistory = document.getElementById("match-history");
    matchHistory.innerHTML = data.recent_matches
      .map(
        (match) => `
            <tr>
                <td>${new Date(match.created_at).toLocaleDateString()}</td>
                <td>${match.player1__username} vs ${
          match.player2__username
        }</td>
                <td>${
                  match.winner__username === data.username
                    ? '<span class="text-success">Win</span>'
                    : '<span class="text-danger">Loss</span>'
                }</td>
                <td>${match.player1_score} - ${match.player2_score}</td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    displayErrorMessage("Failed to load profile data");
  }
}

function updateUserProfile() {
  const username = sessionStorage.getItem("username");
  if (!username) return;

  const userDisplay = document.querySelector(".user-display");
  if (userDisplay) {
    userDisplay.textContent = username;
  }
}
