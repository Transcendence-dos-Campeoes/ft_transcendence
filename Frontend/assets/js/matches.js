let regularMatchesData = [];
let tournamentMatchesData = [];

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

function renderRegularMatch(match, currentUser) {
  return `<tr>
          <td>${new Date(match.created_at).toLocaleDateString()}</td>
              <td>${match.player1__username === currentUser
      ? match.player2__username
      : match.player1__username
    }</td>
              <td>${match.player1__username === currentUser
      ? match.player1_score + " - " + match.player2_score
      : match.player2_score + " - " + match.player1_score
    }</td>
              <td>${match.winner__username
      ? match.winner__username === currentUser
        ? '<span class="text-success">Win</span>'
        : '<span class="text-danger">Loss</span>'
      : "Undefined"
    }</td>
              <td>${getStatusBadge(match.status)}</td>
          </tr>`;
}

function renderTournamentMatch(match, currentUser) {
  return `<tr>
            <td>${match.tournament__name}</td>
            <td>${new Date(match.match__created_at).toLocaleDateString()}</td>
            <td>${match.match__player1__username === currentUser
      ? match.match__player2__username
      : match.match__player1__username
    }</td>
            <td>${match.match__player1__username === currentUser
      ? match.match__player1_score +
      " - " +
      match.match__player2_score
      : match.match__player2_score +
      " - " +
      match.match__player1_score
    }</td>
            <td>${match.match__winner__username
      ? match.match__winner__username === currentUser
        ? '<span class="text-success">Win</span>'
        : '<span class="text-danger">Loss</span>'
      : "Undefined"
    }</td>
            <td>${getStatusBadge(match.match__status)}</td>
          </tr>`;
}

function filterMatches(matches, filter, tableId, current_user, isRegularMatch) {
  const filteredMatches = matches.filter(match => {
    const searchTerm = filter.toLowerCase();

    if (isRegularMatch) {
      return match.player1__username.toLowerCase().includes(searchTerm) ||
        match.player2__username.toLowerCase().includes(searchTerm) ||
        match.status.toLowerCase().includes(searchTerm);
    } else {
      return match.tournament__name.toLowerCase().includes(searchTerm) ||
        match.match__player1__username.toLowerCase().includes(searchTerm) ||
        match.match__player2__username.toLowerCase().includes(searchTerm) ||
        match.match__status.toLowerCase().includes(searchTerm);
    }
  });

  document.getElementById(tableId).innerHTML = filteredMatches
    .map(match => isRegularMatch ?
      renderRegularMatch(match, current_user) :
      renderTournamentMatch(match, current_user))
    .join('');
}

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
    regularMatchesData = data.regular_matches;
    tournamentMatchesData = data.tournament_matches;

    // Add event listeners for filters
    document.getElementById('regular-matches-filter').addEventListener('input', (e) => {
      filterMatches(regularMatchesData, e.target.value, 'regular-matches', data.current_user, true);
    });

    document.getElementById('tournament-matches-filter').addEventListener('input', (e) => {
      filterMatches(tournamentMatchesData, e.target.value, 'tournament-matches', data.current_user, false);
    });

    // Initial render
    filterMatches(regularMatchesData, '', 'regular-matches', data.current_user, true);
    filterMatches(tournamentMatchesData, '', 'tournament-matches', data.current_user, false);
  } catch (error) {
    displayMessage("Failed to load matches", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}