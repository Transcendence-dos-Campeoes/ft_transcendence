async function attachSettingsFormListener() {
  const formUser = document.getElementById("profile-form");
  if (!formUser) {
    console.error("Profile form not found");
    return;
  }

  const formPassword = document.getElementById("password-form");
  if (!formPassword) {
    console.error("Password form not found");
    return;
  }

  formUser.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("📝 Submitting profile form");
    const loadingOverlay = new LoadingOverlay();

    const username = document.getElementById("username-input").value;
    const email = document.getElementById("email-input").value;
    const twoFactorEnabled = document.getElementById("2fa-toggle").checked;
    try {
      loadingOverlay.show();
      const response = await fetch(
        "http://localhost:8000/api/users/profile/update/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({
            username: username,
            email: email,
            two_factor_enabled: twoFactorEnabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      console.log("✅ Profile updated:", data);

      // Update form with new data
      document.getElementById("username-input").value = data.username;
      localStorage.setItem("username", data.username);
      document.getElementById("email-input").value = data.email;
      document.getElementById("2fa-toggle").checked = data.two_factor_enabled;

      // Show success message
      displayMessage("Profile updated successfully", MessageType.SUCCESS);
      renderElement("overview");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      displayMessage("Failed to update profile", MessageType.ERROR);
    } finally {
      loadingOverlay.hide();
    }
  });

  formPassword.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("📝 Submitting password form");
    const loadingOverlay = new LoadingOverlay();

    const currPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confPassword = document.getElementById("confirm-password").value;

    try {
      loadingOverlay.show();
      const response = await fetch(
        "http://localhost:8000/api/users/profile/update/password/",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({
            currPassword: currPassword,
            newPassword: newPassword,
            confPassword: confPassword,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update password");
      }

      // Show success message
      displayMessage("Password updated successfully", MessageType.SUCCESS);
      renderElement("overview");
    } catch (error) {
      console.error("❌ Password updating:", error);
      displayMessage("Failed to update password", MessageType.ERROR);
    } finally {
      loadingOverlay.hide();
    }
  });
}

async function loadSettingsData() {
  try {
    const response = await fetch("http://localhost:8000/api/users/settings/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile data");
    }

    const data = await response.json();

    // Update profile form and details
    document.getElementById("username-input").value = data.username;
    document.getElementById("email-input").value = data.email;
    document.getElementById("profile-username").textContent = data.username;
    document.getElementById("2fa-toggle").checked = data.two_fa_enabled;

    // Format and display creation date
    const createdDate = new Date(data.created_time).toLocaleDateString(
      "pt-PT",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    document.getElementById("profile-created").textContent = createdDate;
  } catch (error) {
    displayMessage("Failed to load profile data", MessageType.ERROR);
  }
}
