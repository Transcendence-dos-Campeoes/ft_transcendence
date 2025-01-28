function attachLoginFormListener() {
  const form = document.getElementById("loginForm");
  if (!form) {
    console.error("Form not found");
    return;
  }
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const username = document.getElementById("floatingUsername").value;
      const password = document.getElementById("floatingPassword").value;

      await login(username, password);
    });
}

async function login(username, password) {
  const errorModal = new ErrorModal();
  try {
    const response = await fetch("http://localhost:8000/api/users/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const responseText = await response.text();

    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log("Login successful:", responseData);
      // Store the tokens and expiration time in localStorage or a cookie
      localStorage.setItem("access", responseData.access);
      localStorage.setItem("refresh", responseData.refresh);
      const accessTokenExpiry = new Date().getTime() + 10 * 60 * 1000; // 2 minutes for testing
      localStorage.setItem("access_token_expiry", accessTokenExpiry);
      sessionStorage.setItem("username", username);
      renderPage("home");
    } else if (!response.ok && response.status == 429) {
      displayErrorMessage(
        "Too many requests. Please try again later.",
        errorModal
      );
    } else {
      try {
        const errorData = JSON.parse(responseText);
        displayErrorMessage(formatErrorMessages(errorData), errorModal);
      } catch (e) {
        console.error("Error parsing JSON:", e); // Log the JSON parsing error
        displayErrorMessage("An error occurred while logging in", errorModal);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    displayErrorMessage("An error occurred while logging in", errorModal);
  }
}

function formatErrorMessages(errors) {
  let formattedErrors = "";
  for (const [field, messages] of Object.entries(errors)) {
    formattedErrors += `<strong>${
      field.charAt(0).toUpperCase() + field.slice(1)
    }:</strong><br>`;
    messages.forEach((message) => {
      formattedErrors += `- ${message}<br>`;
    });
  }
  return formattedErrors;
}
