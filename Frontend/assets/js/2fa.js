function checkAndRunTwoFA() {
	const currentUrl = window.location.href;
	console.log("Current URL:", currentUrl);

	if (currentUrl.match('https://localhost/two_fa_enable') != null) {
		renderPage("two_fa_enable")
		console.log("Matched two_fa_enable URL");
		two_fa_enable();
	} else if (currentUrl.match('https://localhost/two_fa_verify') != null) {
		console.log("Matched two_fa_verify URL");
		alert("VERIFY");
	}
	else {
		console.log("Didn't match any URL");
		console.log(currentUrl);
	}
}
async function two_fa_enable() {
	try {
		const username = localStorage.getItem("username");
		console.log("Username from localStorage:", username);

		const response = await fetch(
			"http://localhost:8000/api/users/twofa/enable/",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access")}`,
				},
				body: JSON.stringify({ username }), // Correctly stringify the username as an object
			}
		);

		if (response.ok) {
			console.log("2FA API working.");
			const responseData = await response.json();
			console.log("Response Data:", responseData);

			// Display the QR code on the page
			const qrCodeImage = document.getElementById("qrCodeImage");
			if (qrCodeImage) {
				qrCodeImage.src = responseData.qr_code;
			}
		} else {
			console.log("2FA API ERROR.");
			const errorData = await response.json();
			console.log("Error Data:", errorData);
		}
	} catch (error) {
		console.error("Error:", error);
		displayMessage("An error occurred while enabling 2FA.", MessageType.ERROR);
	}
}