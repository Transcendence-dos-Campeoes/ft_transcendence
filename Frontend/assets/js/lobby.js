
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
                        <div class="d-flex w-100 align-items-center justify-content-between">
                            <strong class="mb-1">${player.username}</strong>
                            <small class="text-body-secondary">Online</small>
                        </div>
                    `;
                    playersList.appendChild(a);
                }
            });
        };

        // socket.onclose = function(event) {
        //     console.error('WebSocket closed:', event);
        // };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }
    //if (window.location.pathname.endsWith('home')) {
// fetchAvailablePlayers();
// setInterval(fetchAvailablePlayers, 5000); // Refresh every 5 seconds
    //}
});
