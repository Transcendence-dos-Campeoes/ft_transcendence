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
			displayMessage("Passwords do not match", MessageType.ERROR);
			return;
		}

		const data = { username: username, email: email, password: password };
		const loadingOverlay = new LoadingOverlay();

		try {
			loadingOverlay.show();
			const response = await fetch(`${window.location.origin}/api/users/create/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const responseText = await response.text();
			if (response.ok) {
				const responseData = JSON.parse(responseText);

				const responseStruct = {
					access: responseData.access,
					refresh: responseData.refresh,
					username: responseData.user,
					email: responseData.email
				};

				renderAuthPage("two_fa_enable", responseStruct);
			} else if (!response.ok && response.status == 429) {
				displayMessage(
					"Too many requests. Please try again later.",
					MessageType.ERROR
				);
			} else {
				try {
					const errorData = JSON.parse(responseText);
					displayMessage(formatErrorMessages(errorData), MessageType.ERROR);
				} catch (e) {
					console.error("Error parsing JSON:", e); // Log the JSON parsing error
					displayMessage(
						"An error occurred while registering the user",
						MessageType.ERROR
					);
				}
			}
		} catch (error) {
			console.error("Error:", error);
			displayMessage(
				"An error occurred while registering the user",
				MessageType.ERROR
			);
		} finally {
			loadingOverlay.hide();
		}
	});
}
