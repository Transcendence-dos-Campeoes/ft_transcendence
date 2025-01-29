function lobbyLoad() {
  console.log("pathname:", window.location.pathname);
  const currentUser = localStorage.getItem("username"); // Assuming you store the username in localStorage
  console.log("WebSocket user:", currentUser);
  const socket = new WebSocket("ws://localhost:8000/ws/users/online-players/");

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    console.log("WebSocket message received:", data);
    const playersList = document.getElementById("online-players-list");
    if (playersList) {
      playersList.innerHTML = "";
    }
    data.forEach((player) => {
      if (player.username !== currentUser) {
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
                                   onclick="viewProfile('${player.username}')">
                                    <i class="bi bi-person me-2"></i>View Profile
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" 
                                   onclick="inviteToGame('${player.username}')">
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
  };
}
