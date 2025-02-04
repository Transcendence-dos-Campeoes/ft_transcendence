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
    const tbody = document.getElementById("regular-matches");

    if (data.matches.length === 0) {
      tbody.innerHTML = "";
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

    tbody.innerHTML = data.matches
      .map(
        (matche) => `
          <tr>
          <td>${new Date(matche.created_at).toLocaleDateString()}</td>
              <td>${matche.player1__username}</td>
              <td>${matche.player2__username}</td>
              <td>${matche.player1_score + "/" + matche.player2_score}</td>
              <td>${
                matche.winner__username
                  ? matche.winner__username === data.current_user
                    ? '<span class="text-success">Win</span>'
                    : '<span class="text-danger">Loss</span>'
                  : "Undefined"
              }</td>
              <td>${getStatusBadge(matche.status)}</td>
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
