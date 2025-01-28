async function attachProfileFormListener() {
  const form = document.getElementById("profile-form");
  if (!form) {
    console.error("Profile form not found");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("📝 Submitting profile form");

    const username = document.getElementById("username-input").value;
    const email = document.getElementById("email-input").value;
    const twoFactorEnabled = document.getElementById("2fa-toggle").checked;

    try {
      const response = await fetch(
        "http://localhost:8000/api/users/profile/update/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({
            username: username,
            email: email,
            two_factor_enabled: twoFactorEnabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      console.log("✅ Profile updated:", data);

      // Update form with new data
      document.getElementById("username-input").value = data.username;
      localStorage.setItem("username", data.username);
      document.getElementById("email-input").value = data.email;
      document.getElementById("2fa-toggle").checked = data.two_factor_enabled;

      // Show success message
      displayMessage("Profile updated successfully", MessageType.SUCCESS);
      renderPage("home");
      renderElement("overview");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      displayMessage("Failed to update profile", MessageType.ERROR);
    }
  });
}

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

    // Update profile form and details
    document.getElementById("username-input").value = data.username;
    document.getElementById("email-input").value = data.email;
    document.getElementById("profile-username").textContent = data.username;
    document.getElementById("2fa-toggle").checked = data.two_fa_enabled;

    // Format and display creation date
    const createdDate = new Date(data.created_time).toLocaleDateString(
      "pt-PT",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    document.getElementById("profile-created").textContent = createdDate;

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
    displayMessage("Failed to load profile data", MessageType.ERROR);
  }
}

function updateUserProfile() {
  const username = localStorage.getItem("username");
  if (!username) return;

  const userDisplay = document.querySelector(".user-display");
  if (userDisplay) {
    userDisplay.textContent = username;
  }
}
