
document.addEventListener('DOMContentLoaded', function() {

    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        console.log('pathname:',window.location.pathname);
        const currentUser = localStorage.getItem('username'); // Assuming you store the username in localStorage
        console.log('WebSocket user:', currentUser);
        const socket = new WebSocket('ws://localhost:8000/ws/users/online-players/');

        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data); // Debugging line
            const playersList = document.getElementById('online-players-list');
            if (playersList) {
                playersList.innerHTML = '';// Clear the list before updating
            }
                data.forEach(player => {
                if (player.username !== currentUser) { // Exclude the current user
                    const a = document.createElement('a');
                    a.href = '#';
                    a.className = 'list-group-item list-group-item-action py-3 lh-sm';
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
                    playersList.appendChild(a);
                }
            });
        };

        socket.onclose = function(event) {
            console.error('WebSocket closed:', event);
        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }
});
