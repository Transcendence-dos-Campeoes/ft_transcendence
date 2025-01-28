function attachRegisterFormListener() {
  const form = document.getElementById("registrationForm");
  if (!form) {
    console.error("Form not found");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log("Form submitted");

    const username = document.getElementById("floatingUsername").value;
    const email = document.getElementById("floatingInput").value;
    const password = document.getElementById("floatingPassword").value;
    const repeatPassword = document.getElementById(
      "floatingRepeatPassword"
    ).value;

    if (password !== repeatPassword) {
      displayErrorMessage("Passwords do not match");
      return;
    }

    const data = { username: username, email: email, password: password };

    try {
      const response = await fetch("http://localhost:8000/api/users/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseText = await response.text();
      if (response.ok) {
        console.log("User Registered Succesfully");
        const responseData = JSON.parse(responseText);
        // Store the tokens and expiration time in localStorage or a cookie
        localStorage.setItem("access", responseData.access);
        localStorage.setItem("refresh", responseData.refresh);
        const accessTokenExpiry = new Date().getTime() + 10 * 60 * 1000; // 30 minutes
        localStorage.setItem("access_token_expiry", accessTokenExpiry);
        renderPage("home");
      } else if (!response.ok && response.status == 429) {
        displayErrorMessage("Too many requests. Please try again later.");
      } else {
        try {
          const errorData = JSON.parse(responseText);
          displayErrorMessage(formatErrorMessages(errorData));
        } catch (e) {
          console.error("Error parsing JSON:", e); // Log the JSON parsing error
          displayErrorMessage("An error occurred while registering the user");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      displayErrorMessage("An error occurred while registering the user");
    }
  });
}
