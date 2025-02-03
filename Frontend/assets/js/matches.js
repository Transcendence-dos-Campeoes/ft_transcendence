async function loadMatches() {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetch("http://localhost:8000/api/matches/get/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }

    const matches = await response.json();
    const tbody = document.getElementById("regular-matches");

    if (matches.length === 0) {
      tbody.innerHTML = "";
      return;
    }

    tbody.innerHTML = matches
      .map(
        (matche) => `
          <tr>
              <td>${matche.id}</td>
              <td>${matche.player1}</td>
              <td>${matche.player2}</td>
              <td>${matche.status}</td>
              <td>${matche.score}</td>
              <td>${matche.actions}</td>
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
