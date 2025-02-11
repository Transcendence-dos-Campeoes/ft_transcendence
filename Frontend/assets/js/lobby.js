let socket;
let data;

function lobbyLoad() {
  console.log("pathname:", window.location.pathname);
  const currentUser = localStorage.getItem("username"); // Assuming you store the username in localStorage
  console.log("WebSocket user:", currentUser);

  const token = localStorage.getItem("access");
  if (typeof socket === "undefined" || socket.readyState === WebSocket.CLOSED)
    socket = new WebSocket(
      `wss://${window.location.host}/ws/users/online-players/?token=${token}`
    );
  else socket.send(JSON.stringify({ type: "lobby" }));

  waitingModal = new MessageModal(MessageType.INVITE);
  messageModal = new MessageModal(MessageType.INVITE);
  declineModal = new DeclineModal(MessageType.INFO);

  socket.onmessage = function (event) {
    data = JSON.parse(event.data);
    console.log("WebSocket message received:", data); // Debugging line

    if (data.type === "online.players.update") {
      let friends = []
      fetch(`${window.location.origin}/api/users/get_user_friends/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(friendsData => {
        const playersList = document.getElementById("online-players-list");
        if (playersList) {
            playersList.innerHTML = ""; // Clear the list before updating
        }
        friendsData.friends.forEach(friend => {
          friends.push(friend.username);
        });
          
          data.players_data.forEach((player) => {
            if (player.username !== currentUser && friends.includes(player.username)) {
              const a = document.createElement("a");
              a.href = "#";
              a.className = "list-group-item list-group-item-action py-3 lh-sm";
              a.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <span>${player.username}</span>
                    <span class="status-indicator rounded-circle bg-success ms-2"
                          style="width: 8px; height: 8px;">
                    </span>
                  </div>
                  <div class="dropdown">
                    <button class="btn btn-link text-white p-0" 
                            data-bs-toggle="dropdown">
                      <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                      <li>
                        <a class="dropdown-item" href="#" 
                           onclick="renderElement('friendProfile'); viewFriendProfile('${player.username}')">
                          <i class="bi bi-person me-2"></i>View Profile
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item invite-button" href="#" 
                           data-username=${player.username}>
                          <i class="bi bi-controller me-2"></i>Invite to Game
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              `;
  
              playersList.appendChild(a);
            }
          });
          const inviteButtons = document.querySelectorAll(".invite-button");
          inviteButtons.forEach((button) => {
            button.addEventListener("click", function (event) {
              event.preventDefault();
              const username = button.getAttribute("data-username");
              socket.send(
                JSON.stringify({
                  type: "invite",
                  from: currentUser,
                  to: username,
                })
              );
              waitingModal.show(`Waiting for ${username} to accept your game invite...`, "Invite Sent").then((accept) => {
                if (!accept) {
                  socket.send(
                    JSON.stringify({
                      type: "decline_invite",
                      from: currentUser,
                      to: username,
                    })
                  );
                  //declineModal.show(`Your game invite to ${username} was rejected.`, "Invite Rejected");
                }
              });
            });
          });
        })
        .catch(error => console.error('Error fetching friends:', error));
    } else if (data.type === "invite") {
      messageModal.show(`${data.from} has invited you to play a game. Do you accept?`, "Invite").then((accept) => {
        if (accept) {
          // User accepted the invitation
          socket.send(
            JSON.stringify({
              type: "accept_invite",
              from: currentUser,
              to: data.from,
            })
          );
          console.log("Game started with:", data.from);
        } else {
          // User declined the invitation
          socket.send(
            JSON.stringify({
              type: "decline_invite",
              from: currentUser,
              to: data.from,
            })
          );
        }
      });
    } else if (data.type === "decline_invite"){
        waitingModal.hide();
        messageModal.hide();
        if (data.to === currentUser)
          declineModal.show(`Game invite rejected.`, "Invite Rejected");

      console.log("Invite declined by:", data.from);
    } else if (data.type === "start_game") {
        waitingModal.hide();
      console.log("Game started with:", data.from);
      renderPage("pong");
    } else if (data.type === "close_connection") {
      socket.close();

    //TOURNAMENTS
    } else if (data.type === "invite_tournament_game") {
      messageModal.show(`${data.from} has invited you to play a game. Do you accept?`, "Invite").then((accept) => {
        if (accept) {
          // User accepted the invitation
          socket.send(
            JSON.stringify({
              type: "accept_invite_tournament_game",
              from: currentUser,
              to: data.from,
              game: data.game,
            })
          );
          console.log("Game started with:", data.from);
        } else {
          // User declined the invitation
          socket.send(
            JSON.stringify({
              type: "decline_invite",
              from: currentUser,
              to: data.from,
              game: match.match__id,
            })
          );
        }
      });
    }
  };

  socket.onclose = function (event) {
    console.error("WebSocket closed:", event);
  };

  socket.onerror = function (error) {
    console.error("WebSocket error:", error);
  };
}

