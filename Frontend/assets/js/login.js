function attachLoginFormListener() {
	const form = document.getElementById("loginForm");
	if (!form) {
		//console.error("Form not found");
		return;
	}
	form.addEventListener("submit", async function (event) {
		event.preventDefault();

		const username = document.getElementById("floatingUsername").value;
		const password = document.getElementById("floatingPassword").value;

		await login(username, password);
	});
}

async function login(username, password) {
	try {
		const response = await fetch(`${window.location.origin}/api/users/login/`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		const responseText = await response.text();

		if (response.ok) {
			const responseData = JSON.parse(responseText);

			const responseStruct = {
				access: responseData.access,
				refresh: responseData.refresh,
				username: username,
				email: responseData.email
			};
			if (responseData.two_fa_enabled == false) {
				renderAuthPage("two_fa_enable", responseStruct);
			}
			else {
				renderAuthPage("two_fa_verify", responseStruct)
			}
		} else if (!response.ok && response.status == 429) {
			displayMessage(
				"Too many requests. Please try again later.",
				MessageType.ERROR
			);
		} else {
			displayMessage("An error occurred while logging in", MessageType.ERROR);
		}
	} catch (error) {
		//console.error("Error:", error);
		displayMessage("An error occurred while logging in", MessageType.ERROR);
	}
}
