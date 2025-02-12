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
  const joinButton = match.match__status.toLowerCase() === 'pending' ? `<button class="btn btn-primary" onclick='joinMatch("${encodeURIComponent(JSON.stringify(match))}", "${currentUser}")'>Join</button>` : '';
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
            <td>${joinButton}</td>
          </tr>`;
}

// PLAY TOURNAMENT MATCHES
function joinMatch(encodedMatch, currentUser) {
  const match = JSON.parse(decodeURIComponent(encodedMatch));
  console.log(`Joining match with ID: ${match.match__id}`);
  console.log(`Player1: ${match.match__player1__username}`);
  console.log(`Player2: ${match.match__player2__username}`);

  const players = data.players_data.map(player => player.username);

  if (players.includes(match.match__player1__username) && players.includes(match.match__player2__username)) {
    console.log("Both players are in the players_data list.");
    const opponent = match.match__player1__username === currentUser ? match.match__player2__username : match.match__player1__username;
    waitingModal = new MessageModal(MessageType.INVITE);
    declineModal = new DeclineModal(MessageType.INFO);
  
    socket.send(
      JSON.stringify({
        type: "invite_tournament_game",
        from: currentUser,
        to: opponent,
        game: match.match__id,
        player1: match.match__player1__username,
        player2: match.match__player1__username,
      })
    );
  
    waitingModal.show(`Waiting for ${opponent} to accept your game invite...`, "Invite Sent").then((accept) => {
      if (!accept) {
        socket.send(
          JSON.stringify({
            type: "decline_invite",
            from: currentUser,
            to: opponent,
            game: match.match__id,
          })
        );
      }
    });
  
  
  } else {
    console.log("One or both players are not in the players_data list.");
  }
  // messageModal = new MessageModal(MessageType.INVITE);


  
  // You can add an API call here to join the match
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