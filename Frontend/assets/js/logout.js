// Logout function
async function logout() {
	const refresh = localStorage.getItem("refresh");
	try {
		const response = await fetchWithAuth("/api/users/logout/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ refresh }),
			credentials: "include",
		});
		if (socket != null || socket != undefined) 
			socket.destroy();
		
		if (response.ok) {
			localStorage.clear();
			renderPage("login");
		} else {
			let responseData;
			try {
				responseData = await response.json();
			} catch (e) {
				console.error("Error parsing JSON:", e);
				responseData = { detail: "An error occurred" };
			}
			if (responseData.detail === "Token is already blacklisted") {
				localStorage.clear();
				renderPage("login");
			} else {
				console.error("Failed to log out:", responseData);
			}
		}
	} catch (error) {
		console.error("Error logging out:", error);
		localStorage.clear();
	}
}

async function clearLocalStorage() {
	localStorage.clear();
}