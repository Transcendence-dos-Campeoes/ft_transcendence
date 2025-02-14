let data;

class Socket {

  constructor(token) {
    this.token = token;
    this.connectWebSocket(token);

    this.waitingModal = new MessageModal(MessageType.INVITE);
    this.messageModal = new MessageModal(MessageType.INVITE);
    this.declineModal = new DeclineModal(MessageType.INFO);
  }

  async connectWebSocket(token) {
    this.socket = new WebSocket(
      `wss://${window.location.host}/ws/users/online-players/?token=${token}`
    );

    this.socket.onopen = () => {
      this.isConnected = true;
    };

    this.socket.onclose = async (event) => {
      // this.isConnected = false;
      // const newToken = await refreshToken();
      // this.socket.onopen = NULL;
      // this.socket.onclose = NULL;
      // this.socket.onerror = NULL;
      // this.socket.onmessage = NULL;
      // if (newToken) {
      //   this.connectWebSocket(newToken);
      // } else {
      //   renderPage('login');
      // }
      logout();
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.lobbyLoad(token);
  }

  async lobbyLoad(token) {

    console.log("pathname:", window.location.pathname);
    const currentUser = localStorage.getItem("username"); // Assuming you store the username in localStorage
    console.log("WebSocket user:", currentUser);

    if (typeof this.socket === "undefined" || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = new WebSocket(
        `wss://${window.location.host}/ws/users/online-players/?token=${token}`
      );
      await new Promise((resolve, reject) => {
        this.socket.onopen = resolve;
        this.socket.onerror = reject;
      });
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      await new Promise((resolve, reject) => {
        this.socket.onopen = resolve;
        this.socket.onerror = reject;
      });
    }
    else {
      this.socket.send(JSON.stringify({ type: "lobby" }));
    }

    this.socket.onmessage = async (event) => {
      data = JSON.parse(event.data);
      console.log("WebSocket message received:", data); // Debugging line

      if (data.type === "online.players.update") {
        const playersList = document.getElementById("online-players-list");
        if (playersList) {
          playersList.innerHTML = ""; // Clear the list before updating
        }
        if (Array.isArray(data.players_data)) {
          data.players_data.friends.forEach((friend) => {
            const a = document.createElement("a");
            a.href = "#";
            a.className = "list-group-item list-group-item-action py-3 lh-sm";
            a.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <span>${friend.username}</span>
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
                                    onclick="renderElement('friendProfile'); viewFriendProfile('${friend.username}')">
                                        <i class="bi bi-person me-2"></i>View Profile
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item invite-button" href="#" 
                                    data-username=${friend.username}>
                                        <i class="bi bi-controller me-2"></i>Invite to Game
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                `;
            playersList.appendChild(a);
          });
        }
        const inviteButtons = document.querySelectorAll(".invite-button");
        inviteButtons.forEach((button) => {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            const username = button.getAttribute("data-username");
            this.socket.send(
              JSON.stringify({
                type: "invite",
                from: currentUser,
                to: username,
              })
            );
            this.waitingModal.show(`Waiting for ${username} to accept your game invite...`, "Invite Sent").then((accept) => {
              if (!accept) {
                this.socket.send(
                  JSON.stringify({
                    type: "decline_invite",
                    from: currentUser,
                    to: username,
                  })
                );
                //this.declineModal.show(`Your game invite to ${username} was rejected.`, "Invite Rejected");
              }
            });
          });
        });
      } else if (data.type === "invite") {
        this.messageModal.show(`${data.from} has invited you to play a game. Do you accept?`, "Invite").then((accept) => {
          if (accept) {
            // User accepted the invitation
            this.socket.send(
              JSON.stringify({
                type: "accept_invite",
                from: currentUser,
                to: data.from,
              })
            );
            console.log("Game started with:", data.from);
          } else {
            // User declined the invitation
            this.socket.send(
              JSON.stringify({
                type: "decline_invite",
                from: currentUser,
                to: data.from,
              })
            );
          }
        });
      } else if (data.type === "decline_invite") {
        this.waitingModal.hide();
        this.messageModal.hide();
        if (data.to === currentUser)
          this.declineModal.show(`Game invite rejected.`, "Invite Rejected");

        console.log("Invite declined by:", data.from);
      } else if (data.type === "start_game") {
        this.waitingModal.hide();
        console.log("Game started with:", data.from);
        renderPage("pong");
      } else if (data.type === "close_connection") {
        this.socket.close();

        //TOURNAMENTS
      } else if (data.type === "invite_tournament_game") {
        this.messageModal.show(`${data.from} has invited you to play a game. Do you accept?`, "Invite").then((accept) => {
          if (accept) {
            // User accepted the invitation
            this.socket.send(
              JSON.stringify({
                type: "accept_invite_tournament_game",
                from: currentUser,
                to: data.from,
                game: data.game,
                player1: data.player1,
                player2: data.player2,
              })
            );
            console.log("Game started with:", data.from);
          } else {
            // User declined the invitation
            this.socket.send(
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
  }

  async send(message) {
    this.socket.send(message);
  }

  addEventListener(type, listener) {
    this.socket.addEventListener(type, listener);
  }
      
  removeEventListener(type, listener) {
      this.socket.removeEventListener(type, listener);
  }

  destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    console.log("Socket connection closed and resources cleaned up.");
  }
}