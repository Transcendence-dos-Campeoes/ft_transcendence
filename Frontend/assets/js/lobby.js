

function fetchAvailablePlayers() {
    const accessToken = localStorage.getItem('token');
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
        if (Array.isArray(data)) {
            const playersList = document.getElementById('players-list');
            playersList.innerHTML = '';
            data.forEach(player => {
                const li = document.createElement('li');
                li.textContent = player.username;
                playersList.appendChild(li);
            });
        } else {
            console.error('Expected an array but got:', data);
        }
        });

    }

document.addEventListener('DOMContentLoaded', function() {
    fetchAvailablePlayers();
    setInterval(fetchAvailablePlayers, 5000); // Refresh every 5 seconds
});
