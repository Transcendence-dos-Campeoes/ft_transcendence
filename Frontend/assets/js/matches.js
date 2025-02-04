async function loadMatches() {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetch("http://localhost:8000/api/users/matches/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }

    const data = await response.json();
    const matches = document.getElementById("regular-matches");

    if (data.regular_matches.length === 0) {
      matches.innerHTML = "";
      return;
    }

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

    matches.innerHTML = data.regular_matches
      .map(
        (match) => `
          <tr>
          <td>${new Date(match.created_at).toLocaleDateString()}</td>
              <td>${
                match.player1__username === data.current_user
                  ? match.player2__username
                  : match.player1__username
              }</td>
              <td>${
                match.player1__username === data.current_user
                  ? match.player1_score + "/" + match.player2_score
                  : match.player2_score + "/" + match.player1_score
              }</td>
              <td>${
                match.winner__username
                  ? match.winner__username === data.current_user
                    ? '<span class="text-success">Win</span>'
                    : '<span class="text-danger">Loss</span>'
                  : "Undefined"
              }</td>
              <td>${getStatusBadge(match.status)}</td>
          </tr>
      `
      )
      .join("");

    const tournaments = document.getElementById("tournament-matches");

    if (data.tournament_matches.length === 0) {
      tournaments.innerHTML = "";
      return;
    }

    tournaments.innerHTML = data.tournament_matches
      .map(
        (match) => `
          <tr>
            <td>${match.tournament__name}</td>
            <td>${new Date(match.match__created_at).toLocaleDateString()}</td>
            <td>${
              match.match__player1__username === data.current_user
                ? match.match__player2__username
                : match.match__player1__username
            }</td>
            <td>${
              match.match__player1__username === data.current_user
                ? match.match__player2_score
                : match.match__player2_score + "/" + match.match__player1_score
            }</td>
            <td>${
              match.match__winner__username
                ? match.match__winner__username === data.current_user
                  ? '<span class="text-success">Win</span>'
                  : '<span class="text-danger">Loss</span>'
                : "Undefined"
            }</td>
            <td>${getStatusBadge(match.match__status)}</td>
          </tr>
      `
      )
      .join("");
  } catch (error) {
    displayMessage("Failed to load matches", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}
