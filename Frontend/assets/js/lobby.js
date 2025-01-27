

function fetchAvailablePlayers() {
    const accessToken = localStorage.getItem('token');
    const currentUser = sessionStorage.getItem('username');

    if (!accessToken) {
        console.error('Access token not found');
        return;
    }

    fetch('http://localhost:8000/api/users/available-players/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('API response:', data); // Debugging line
        const playersList = document.getElementById('online-players-list');
        //playersList.innerHTML = '';
        if (Array.isArray(data)) {
            data.forEach(player => {
                if (player.username !== currentUser) {
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
        } else {
            console.error('Expected an array but got:', data);
        }
        });

    }

document.addEventListener('DOMContentLoaded', function() {
    fetchAvailablePlayers();
    //setInterval(fetchAvailablePlayers, 5000); // Refresh every 5 seconds
});
