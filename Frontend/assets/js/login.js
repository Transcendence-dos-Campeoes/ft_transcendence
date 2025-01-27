function attachLoginFormListener() {
  const form = document.getElementById('loginForm');
  if (!form) {
    console.error('Form not found');
    return;
  }
  document.getElementById('loginForm')
      .addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('floatingUsername').value;
        const password = document.getElementById('floatingPassword').value;

        await login(username, password);
      });
}

async function login(username, password) {
  try {
    const response = await fetch('http://localhost:8000/api/users/login/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    });

    const responseText = await response.text();
    console.log('Response text:', responseText);  // Log the response text

    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log('Login successful:', responseData);
      // Store the token in localStorage or a cookie
      localStorage.setItem('token', responseData.access);
      sessionStorage.setItem('username', username);
      navigateToPage('home');
    } else if (!response.ok && response.status == 429) {
      displayErrorMessage('Too many requests. Please try again later.')
    } else {
      try {
        const errorData = JSON.parse(responseText);
        displayErrorMessage(formatErrorMessages(errorData));
      } catch (e) {
        console.error('Error parsing JSON:', e);  // Log the JSON parsing error
        displayErrorMessage('An error occurred while logging in');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    displayErrorMessage('An error occurred while logging in');
  }
}

function displayErrorMessage(message) {
  const errorMessagesDiv = document.getElementById('errorMessages');
  errorMessagesDiv.innerHTML = message;
  errorMessagesDiv.classList.remove('d-none');
}

function formatErrorMessages(errors) {
  let formattedErrors = '';
  for (const [field, messages] of Object.entries(errors)) {
    formattedErrors += `<strong>${
        field.charAt(0).toUpperCase() + field.slice(1)}:</strong><br>`;
    messages.forEach(message => {
      formattedErrors += `- ${message}<br>`;
    });
  }
  return formattedErrors;
}