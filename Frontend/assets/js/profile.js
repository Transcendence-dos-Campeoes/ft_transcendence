function loadProfileData(data) {
	const profileImg = document.getElementById("profile-picture");
	if (profileImg && data.profile_image) {
		profileImg.src = `data:image/jpeg;base64,${data.profile_image}`;
	}
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

	// Bar chart for matches
	const stats = data.stats;
	const matchesChart = new Chart(document.getElementById("matchesChart"), {
		type: "bar",
		data: {
			labels: ["Total Games", "Wins", "Losses"],
			datasets: [
				{
					data: [stats.total_matches, stats.wins, stats.losses],
					backgroundColor: [
						"rgba(255, 255, 255, 0.4)",
						"rgba(75, 192, 192, 0.4)",
						"rgba(255, 99, 132, 0.4)",
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
					ticks: {
						color: "white",
						stepSize: 1,
						callback: (value) => Math.round(value),
					},
				},
				x: {
					grid: { color: "rgba(255, 255, 255, 0.1)" },
					ticks: { color: "white" },
				},
			},
			plugins: {
				legend: { display: false },
			},
		},
	});

	// Doughnut chart for win rate
	const winRateChart = new Chart(document.getElementById("winRateChart"), {
		type: "doughnut",
		data: {
			labels: ["Wins", "Losses"],
			datasets: [
				{
					data: [stats.win_rate, 100 - stats.win_rate],
					backgroundColor: [
						"rgba(75, 192, 192, 0.4)",
						"rgba(255, 99, 132, 0.4)",
					],
					borderColor: "rgba(255, 255, 255, 0.8)",
					borderWidth: 1,
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
					position: "right",
					labels: { color: "white" },
				},
			},
		},
	});

	const getStatusBadge = (status) => {
		const statusColors = {
			active: "bg-success",
			pending: "bg-warning",
			finished: "bg-secondary",
			cancelled: "bg-danger",
		};
		return `<span class="badge ${statusColors[status.toLowerCase()] || "bg-secondary"
			}">${status}</span>`;
	};

	const noTournamentsDiv = document.getElementById("no-tournaments");
	const noMatchesDiv = document.getElementById("no-matches");

	// Update match history
	if (data.recent_matches.length !== 0) {
		noMatchesDiv.classList.add("d-none");
		const matchHistory = document.getElementById("match-history");
		matchHistory.innerHTML = data.recent_matches
			.map(
				(match) => `
            <tr>
              <td>${new Date(match.created_at).toLocaleDateString()}</td>
              <td>${match.player1__username === data.username
						? match.player2__username
						: match.player1__username
					}</td>
              <td>${match.player1__username === data.username
						? match.player1_score + " - " + match.player2_score
						: match.player2_score + " - " + match.player1_score
					}</td>
              <td>${match.winner__username
						? match.winner__username === data.username
							? '<span class="text-success">Win</span>'
							: '<span class="text-danger">Loss</span>'
						: "Undefined"
					}</td>
              <td>${getStatusBadge(match.status)}</td>
            </tr>
        `
			)
			.join("");
	} else {
		noMatchesDiv.classList.remove("d-none");
	}

	// Update tournament history
	if (data.tournament_history.length !== 0) {
		noTournamentsDiv.classList.add("d-none");
		const tournamentHistory = document.getElementById("tournament-history");
		tournamentHistory.innerHTML = data.tournament_history
			.map(
				(tournament) => `
    <tr>
      <td onclick="renderElement('tournamentBracket'); loadTournamentBracket(${tournament.id})">${new Date(tournament.date).toLocaleDateString()}</td>
      <td>${tournament.name}</td>
      <td>${tournament.position}</td>
      <td>${tournament.total_players}</td>
    </tr>
  `
			)
			.join("");
	} else {
		noTournamentsDiv.classList.remove("d-none");
	}
}

async function viewProfile() {
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
		loadProfileData(data);
	} catch (error) {
		displayMessage("Failed to load profile data", MessageType.ERROR);
	}
}

async function viewFriendProfile(username) {
	const loadingOverlay = new LoadingOverlay();

	try {
		loadingOverlay.show();
		const response = await fetch(
			`http://localhost:8000/api/users/profile/${username}/`,
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem("access")}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error("Failed to fetch profile data");
		}

		const data = await response.json();
		loadProfileData(data);
	} catch (error) {
		displayMessage("Failed to load profile data", MessageType.ERROR);
	} finally {
		loadingOverlay.hide();
	}
}

async function deleteAccount() {
	const loadingOverlay = new LoadingOverlay();
	try {
		loadingOverlay.show();
		const response = await fetch("http://localhost:8000/api/users/delete/", {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${localStorage.getItem("access")}`,
			},
		});

		if (response.ok) {
			// Clear local storage
			localStorage.clear();
		} else {
			alert("Failed to delete account");
		}
	} catch (error) {
		console.error("Error deleting account:", error);
		alert("Error deleting account");
	} finally {
		loadingOverlay.hide();
		renderPage("login");
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
