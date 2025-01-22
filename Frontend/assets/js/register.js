function attachRegisterFormListener() {
    const form = document.getElementById('registrationForm');
    if (!form) {
        console.error('Form not found');
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        console.log('Form submitted');

        const username = document.getElementById('floatingUsername').value;
        const email = document.getElementById('floatingInput').value;
        const password = document.getElementById('floatingPassword').value;
        const repeatPassword = document.getElementById('floatingRepeatPassword').value;

        if (password !== repeatPassword) {
            displayErrorMessage('Passwords do not match');
            return;
        }

        const data = {
            username: username,
            email: email,
            password: password
        };

        try {
            const response = await fetch('http://localhost:8000/api/users/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const responseText = await response.text();
            if (response.ok) {
                alert('User registered successfully');
                const errorMessagesDiv = document.getElementById('errorMessages');
                errorMessagesDiv.classList.add('d-none'); // Hide the error box
                errorMessagesDiv.innerHTML = ''; // Clear any existing error messages
            }
            else if (!response.ok && response.status == 429) {
                displayErrorMessage("Too many requests. Please try again later.")
            }
            else {
                const errorData = JSON.parse(responseText);
                displayErrorMessage(formatErrorMessages(errorData));
            }
        } catch (error) {
            console.error('Error:', error);
            displayErrorMessage('An error occurred while registering the user');
        }
    });
}

function formatErrorMessages(errors) {
    let formattedErrors = '';
    for (const [field, messages] of Object.entries(errors)) {
        formattedErrors += `<strong>${field.charAt(0).toUpperCase() + field.slice(1)}:</strong><br>`;
        messages.forEach(message => {
            formattedErrors += `- ${message}<br>`;
        });
    }
    return formattedErrors;
}

function displayErrorMessage(message) {
    const errorMessagesDiv = document.getElementById('errorMessages');
    errorMessagesDiv.innerHTML = message;
    errorMessagesDiv.classList.remove('d-none');
}