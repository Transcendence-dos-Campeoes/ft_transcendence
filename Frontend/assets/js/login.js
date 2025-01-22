
    document.getElementById('loginForm').addEventListener('submit', async function(event) {
        console.log('Login successful');
        event.preventDefault();

        const username = document.getElementById('usernameEmail').value;
        const password = document.getElementById('password').value;

        await login(username, password);
    });

async function login(username, password) {
    const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
    } else {
        console.error('Login failed:', response.statusText);
    }
}