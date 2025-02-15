async function attachSettingsFormListener() {
  const formUser = document.getElementById("profile-form");
  if (!formUser) {
   //console.error("Profile form not found");
    return;
  }

  const formPassword = document.getElementById("password-form");
  if (!formPassword) {
    //console.error("Password form not found");
    return;
  }

  formUser.addEventListener("submit", async (event) => {
    event.preventDefault();
    //console.log("📝 Submitting profile form");
    const loadingOverlay = new LoadingOverlay();

    const username = document.getElementById("username-input").value;
    const email = document.getElementById("email-input").value;
    const profilePictureInput = document.getElementById(
      "profile-picture-input"
    );

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);

    if (profilePictureInput && profilePictureInput.files.length > 0) {
      formData.append("profile_image", profilePictureInput.files[0]);
    }
    //console.log(formData)
    try {
      loadingOverlay.show();
      const response = await fetchWithAuth("/api/users/settings/update/", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      //console.log("✅ Profile updated:", data);

      // Show success message
      displayMessage("Profile updated successfully", MessageType.SUCCESS);
      renderPage("home");
    } catch (error) {
      //console.error("❌ Error updating profile:", error);
      displayMessage("Failed to update profile", MessageType.ERROR);
    } finally {
      loadingOverlay.hide();
    }
  });

  formPassword.addEventListener("submit", async (event) => {
    event.preventDefault();
    //console.log("📝 Submitting password form");
    const loadingOverlay = new LoadingOverlay();

    const currPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confPassword = document.getElementById("confirm-password").value;

    try {
      loadingOverlay.show();
      const response = await fetchWithAuth("/api/users/profile/update/password/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currPassword: currPassword,
          newPassword: newPassword,
          confPassword: confPassword,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update password");
      }

      // Show success message
      displayMessage("Password updated successfully", MessageType.SUCCESS);
      renderElement("overview");
    } catch (error) {
      //console.error("❌ Password updating:", error);
      displayMessage("Failed to update password", MessageType.ERROR);
    } finally {
      loadingOverlay.hide();
    }
  });
}

async function loadSettingsData() {
  const loadingOverlay = new LoadingOverlay();

  try {
    loadingOverlay.show();
    const response = await fetchWithAuth("/api/users/settings/");

    if (!response.ok) {
      throw new Error("Failed to fetch profile data");
    }

    const data = await response.json();

    // Update profile form and details
    document.getElementById("username-input").value = data.username;
    document.getElementById("email-input").value = data.email;
    document.getElementById("profile-username").textContent = data.username;
    const profileImg = document.getElementById("profile-picture-settings");
    if (profileImg && data.profile_image) {
      profileImg.src = `data:image/jpeg;base64,${data.profile_image}`;
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
  } finally {
    loadingOverlay.hide();
  }
}

async function loadMaps() {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetchWithAuth("/api/users/settings/maps/");

    if (!response.ok) {
      throw new Error("Failed to fetch maps");
    }

    const maps = await response.json();
    const mapContainer = document.getElementById("map-container");
    mapContainer.innerHTML = '';

    // Create row wrapper for every 2 maps
    for (let i = 0; i < maps.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'row mb-4';

      // First map in row
      row.innerHTML += `
        <div class="col-md-6">
          <div class="card bg-dark ${maps[i].selected ? 'border border-primary border-3' : ''}" 
              onclick="selectMap(${maps[i].map_number})" 
              style="cursor: pointer">
              <img src="${maps[i].image_data}" class="card-img-top" alt="Map ${maps[i].map_number}">
              <div class="card-body text-center">
                  <h5 class="card-title">Map ${maps[i].map_number}</h5>
              </div>
          </div>
        </div>`;

      // Second map in row (if exists)
      if (maps[i + 1]) {
        row.innerHTML += `
          <div class="col-md-6">
            <div class="card bg-dark ${maps[i + 1].selected ? 'border border-primary border-3' : ''}" 
                onclick="selectMap(${maps[i + 1].map_number})" 
                style="cursor: pointer">
                <img src="${maps[i + 1].image_data}" class="card-img-top" alt="Map ${maps[i + 1].map_number}">
                <div class="card-body text-center">
                    <h5 class="card-title">Map ${maps[i + 1].map_number}</h5>
                </div>
            </div>
          </div>`;
      }

      mapContainer.appendChild(row);
    }

  } catch (error) {
    displayMessage("Failed to load maps", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}

async function selectMap(mapId) {
  const loadingOverlay = new LoadingOverlay();
  try {
    loadingOverlay.show();
    const response = await fetchWithAuth("/api/users/settings/map/update/", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ map_number: mapId })
    });

    if (!response.ok) throw new Error("Failed to update map");

    await loadMaps();
    displayMessage("Map updated successfully", MessageType.SUCCESS);
  } catch (error) {
    displayMessage("Failed to update map", MessageType.ERROR);
  } finally {
    loadingOverlay.hide();
  }
}

