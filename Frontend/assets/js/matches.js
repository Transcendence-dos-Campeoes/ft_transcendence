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

function filterRegularMatches(matches, filters, current_user) {
  const filteredMatches = matches.filter(match => {
    const matchDate = new Date(match.created_at).toLocaleDateString();
    const opponent = match.player1__username === current_user ?
      match.player2__username : match.player1__username;
    const result = match.winner__username ?
      (match.winner__username === current_user ? 'win' : 'loss') : '';

    return (!filters.date || matchDate.includes(filters.date)) &&
      (!filters.opponent || opponent.toLowerCase().includes(filters.opponent.toLowerCase())) &&
      (!filters.result || result === filters.result) &&
      (!filters.status || match.status.toLowerCase() === filters.status.toLowerCase());
  });

  document.getElementById('regular-matches').innerHTML = filteredMatches
    .map(match =>
      renderRegularMatch(match, current_user))
    .join('');
}

function filterTournamentMatches(matches, filters, current_user) {
  const filteredMatches = matches.filter(match => {
    const matchDate = new Date(match.match__created_at).toLocaleDateString();
    const opponent = match.match__player1__username === current_user ?
      match.match__player2__username : match.match__player1__username;
    const result = match.match__winner__username ?
      (match.match__winner__username === current_user ? 'win' : 'loss') : '';

    return (!filters.date || matchDate.includes(filters.date)) &&
      (!filters.opponent || opponent.toLowerCase().includes(filters.opponent.toLowerCase())) &&
      (!filters.result || result === filters.result) &&
      (!filters.status || match.match__status.toLowerCase() === filters.status.toLowerCase());
  });


  document.getElementById('tournament-matches').innerHTML = filteredMatches
    .map(match =>
      renderTournamentMatch(match, current_user))
    .join('');
}

async function loadMatches() {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetchWithAuth("/api/users/matches/");

    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }

    const data = await response.json();
    regularMatchesData = data.regular_matches;
    tournamentMatchesData = data.tournament_matches;

    const noTournamentsDiv = document.getElementById("no-tournaments-matches");
    const noRegularDiv = document.getElementById("no-regular-matches");

    ['date', 'opponent', 'result', 'status'].forEach(filterType => {
      document.getElementById(`regular-matches-filter-${filterType}`).addEventListener('input', (e) => {
        const filters = {
          date: document.getElementById('regular-matches-filter-date').value,
          opponent: document.getElementById('regular-matches-filter-opponent').value,
          result: document.getElementById('regular-matches-filter-result').value,
          status: document.getElementById('regular-matches-filter-status').value
        };
        if (regularMatchesData.length !== 0) {
          noRegularDiv.classList.add("d-none");
          filterRegularMatches(regularMatchesData, filters, data.current_user);
        }
        else {
          noRegularDiv.classList.remove("d-none");
        }
      });
    });

    ['date', 'opponent', 'result', 'status'].forEach(filterType => {
      document.getElementById(`tournament-matches-filter-${filterType}`).addEventListener('input', (e) => {
        const filters = {
          date: document.getElementById('tournament-matches-filter-date').value,
          opponent: document.getElementById('tournament-matches-filter-opponent').value,
          result: document.getElementById('tournament-matches-filter-result').value,
          status: document.getElementById('tournament-matches-filter-status').value
        };
        if (tournamentMatchesData.length !== 0) {
          noTournamentsDiv.classList.add("d-none");
          filterTournamentMatches(tournamentMatchesData, filters, data.current_user);
        }
        else {
          noTournamentsDiv.classList.remove("d-none");
        }
      });
    });

    if (tournamentMatchesData.length !== 0) {
      noTournamentsDiv.classList.add("d-none");
      filterTournamentMatches(tournamentMatchesData, {}, data.current_user);
    }
    else {
      noTournamentsDiv.classList.remove("d-none");
    }

    if (regularMatchesData.length !== 0) {
      noRegularDiv.classList.add("d-none");
      filterRegularMatches(regularMatchesData, {}, data.current_user);
    }
    else {
      noRegularDiv.classList.remove("d-none");
    }

  } catch (error) {
    displayMessage("Failed to load matches", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}