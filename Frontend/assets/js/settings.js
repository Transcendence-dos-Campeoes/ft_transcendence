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
    const profilePictureInput = document.getElementById(
      "profile-picture-input"
    );

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("two_factor_enabled", twoFactorEnabled);

    if (profilePictureInput && profilePictureInput.files.length > 0) {
      formData.append("profile_image", profilePictureInput.files[0]);
    }
    console.log(formData)
    try {
      loadingOverlay.show();
      const response = await fetch(
        "http://localhost:8000/api/users/settings/update/",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: formData,
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

      // Update profile picture
      if (data.profile_image) {
        document.getElementById("profile-picture-settings").src =
          data.profile_image;
      }

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

async function attachChangeMapFormListener() {
  const form = document.getElementById("profile-form");
  if (!form) {
    console.error("Change map form not found");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("📝 Submitting change map form");
    const loadingOverlay = new LoadingOverlay();

    const mapLayout = document.getElementById("map-layout-input").value;

    const formData = new FormData();
    formData.append("mapLayout", mapLayout);

    console.log(formData)
    try {
      loadingOverlay.show();
      const response = await fetch(
        "http://localhost:8000/api/users/settings/map/update/",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update map layout");
      }

      const data = await response.json();
      console.log("✅ Map layout updated:", data);

      document.getElementById("map-layout-input").value = data.mapLayout;

      // Show success message
      displayMessage("Map layout updated successfully", MessageType.SUCCESS);
      renderElement("settings");
    } catch (error) {
      console.error("❌ Error updating map layout:", error);
      displayMessage("Failed to change the map layout", MessageType.ERROR);
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
    const profileImg = document.getElementById("profile-picture-settings");
    if (profileImg && data.profile_image) {
      profileImg.src = data.profile_image;
    }

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

async function loadMaps() {
  try {
    const response = await fetch("http://localhost:8000/api/users/settings/maps/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch maps");
    }

    const data = await response.json();
    const mapContainer = document.getElementById("map-container");

    mapContainer.innerHTML = '';

    data.maps.forEach(map => {
      mapContainer.innerHTML += `
        <div class="col-md-3 mb-4">
          <div class="card bg-dark border-light">
            <div class="card-body">
              <h5 class="card-title text-center">${map.name}</h5>
              <div class="map-preview mb-3" style="height: 200px; background-color: ${map.background_color};">
                <!-- Left paddle -->
                <div class="paddle left" style="background-color: ${map.paddle_color}"></div>
                
                <!-- Right paddle -->
                <div class="paddle right" style="background-color: ${map.paddle_color}"></div>
                
                <!-- Ball -->
                <div class="ball" style="background-color: ${map.ball_color}"></div>
                
                <!-- Walls -->
                <div class="wall top" style="background-color: ${map.wall_color}"></div>
                <div class="wall bottom" style="background-color: ${map.wall_color}"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

  } catch (error) {
    displayMessage("Failed to load maps", MessageType.ERROR);
  }
}


