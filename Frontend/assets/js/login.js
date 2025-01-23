function attachLoginFormListener() {
    const form = document.getElementById('loginForm');
    if (!form) {
        console.error('Form not found');
        return;
    }
    document.getElementById('loginForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('usernameEmail').value;
        const password = document.getElementById('password').value;

        await login(username, password);
    });
}

async function login(username, password) {
    const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    const responseText = await response.json();
    if (response.ok) {
        console.log('Login successful:', responseText);
        navigateToPage("home");
    }
    else if (!response.ok && response.status == 429) 
    {
        displayErrorMessage("Too many requests. Please try again later.")
    }
    else 
    {
        const errorData = JSON.parse(responseText);
        displayErrorMessage(formatErrorMessages(errorData));
    }
        
}

function displayErrorMessage(message) {
    const errorMessagesDiv = document.getElementById('errorMessages');
    errorMessagesDiv.innerHTML = message;
    errorMessagesDiv.classList.remove('d-none');
}