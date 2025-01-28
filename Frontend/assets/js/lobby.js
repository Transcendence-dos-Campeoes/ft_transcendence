function lobbyLoad() {
  console.log("pathname:", window.location.pathname);
  const currentUser = localStorage.getItem("username"); // Assuming you store the username in localStorage
  console.log("WebSocket user:", currentUser);
  const socket = new WebSocket("ws://localhost:8000/ws/users/online-players/");

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data); // Debugging line

        if (data.type === 'online.players.update')
        {  
            const playersList = document.getElementById("online-players-list");
            if (playersList) 
            {
              playersList.innerHTML = ""; // Clear the list before updating
            }
            data.forEach((player) => 
            {
                if (player.username !== currentUser) 
                {
                    const a = document.createElement("a");
                    a.href = "#";
                    a.className = "list-group-item list-group-item-action py-3 lh-sm";
                    a.innerHTML = `
                                  <ul class="nav nav-pills flex-column mb-auto">
                                      <li class="nav-item d-flex align-items-center justify-content-between">
                                          <div class="d-flex align-items-center" id="online-players-list">
                                              <span>${player.username}</span>
                                          </div>
                                      <span
                                          class="status-indicator rounded-circle bg-success ms-auto"
                                          style="width: 8px; height: 8px; display: inline-block"
                                      >
                                      </span>
                              `;
                    a.addEventListener('click', function() 
                    {
                        // Handle player selection for the new game
                        console.log('Selected player:', player.username);
                        socket.send(JSON.stringify
                        ({
                            type: 'invite',
                            from: currentUser,
                            to: player.username
                        }));
                    });
                    playersList.appendChild(a);
                }
            });
        }
        else if (data.type === 'invite')
        {
            const accept = confirm(`${data.from} has invited you to play a game. Do you accept?`);
            if (accept) {
                socket.send(JSON.stringify({
                    type: 'accept_invite',
                    from: currentUser,
                    to: data.from
                }));
                // Start the game logic here
                console.log('Game started with:', data.from);
            }
        }
    };

    socket.onclose = function (event) {
      console.error("WebSocket closed:", event);
    };

    socket.onerror = function (error) {
      console.error("WebSocket error:", error);
    };
  }

