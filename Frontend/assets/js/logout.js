// Logout function
async function logout() {
	const refresh = localStorage.getItem("refresh");
	if (!refresh) return;

	try {
		const response = await fetch(`${window.location.origin}/api/users/logout/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access")}`,
			},
			body: JSON.stringify({ refresh }),
			credentials: "include", // Include cookies in the request
		});
		socket.close();
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
				localStorage.removeItem("access");
				localStorage.removeItem("refresh");
				localStorage.removeItem("access_token_expiry");
				localStorage.removeItem("username");
				renderPage("login");
			} else {
				console.error("Failed to log out:", responseData);
			}
		}
	} catch (error) {
		console.error("Error logging out:", error);
	}
}
