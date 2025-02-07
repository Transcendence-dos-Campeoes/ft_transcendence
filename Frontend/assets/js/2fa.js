// window.onload = checkAndRunTwoFA;

function checkAndRunTwoFA() {
	const currentUrl = window.location.href;
	console.log("Current URL:", currentUrl);

	if (currentUrl.match('https://localhost/two_fa_enable') != null) {
		renderPage("two_fa_enable")
		console.log("Matched two_fa_enable URL");
		two_fa_enable();
	}
	else if (currentUrl.match('https://localhost/two_fa_re_enable') != null) {
		renderPage("two_fa_re_enable")
		console.log("Matched two_fa_re_enable URL");
		two_fa_enable();
	}
	else if (currentUrl.match('https://localhost/two_fa_verify') != null) {
		renderPage("two_fa_verify")
	}
	else {
		console.log("Didn't match any URL");
		console.log(currentUrl);
	}
}

function cancelRegistration() {
	// Redirect to the home page or another appropriate page
	const messageModal = new MessageModal(MessageType.INVITE);
	messageModal.show(
		"Are you sure you want to cancel your account registration? All your progress will be lost.",
		"Cancel Account Registration"
	).then(async (accept) => {
		if (accept) {
			console.log("Account registration cancelled.");
			try {
				const response = await fetch("http://localhost:8000/api/users/delete/", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("access")}`,
					},
					credentials: "include"
				});

				const responseText = await response.text();

				if (response.ok) {
					console.log("Account registration canceled.");
					localStorage.clear();
					window.location.href = "https://localhost/register";
				}
			} catch (error) {
				console.error("Error:", error);
				displayMessage("An error occurred while deleting user", MessageType.ERROR);
			}
		} else {
			console.log("Account registration continued.");
		}
	});
}

function cancelVerification() {
	console.log("2FA verification canceled.");
	// Redirect to the home page or another appropriate page
	localStorage.clear();
	window.location.href = "https://localhost/login";
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

async function verifyOtpCode() {
	try {
		const otpCode = document.getElementById("otpCode").value;
		const username = localStorage.getItem("username");
		console.log("OTP Code:", otpCode);

		const response = await fetch(
			"http://localhost:8000/api/users/twofa/verify/",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access")}`,
				},
				body: JSON.stringify({ username, otpCode }), // Send the OTP code and username
			}
		);

		if (response.ok) {
			console.log("OTP verification successful.");
			const responseData = await response.json();
			console.log("Response Data:", responseData);
			renderPage("home")
		} else {
			console.log("OTP verification failed.");
			const errorData = await response.json();
			console.log("Error Data:", errorData);
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

async function requestOtp() {
	const email = document.getElementById("emailInputRecover").value;
	try {
		// Request a new 2FA QR code
		const enableResponse = await fetch(
			"http://localhost:8000/api/users/setRecoverOTP/",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access")}`,
				},
				body: JSON.stringify({ email }), // Send the username
			}
		);

		if (!enableResponse.ok) {
			const errorData = await enableResponse.json();
			console.log("Error Data:", errorData);
			return;
		}

		const enableData = await enableResponse.json();
		console.log("Email with recover OTP sent succesfully:", enableData);
	} catch (error) {
		console.error("Error during 2FA recovery:", error);
	}
}

async function checkRecoverOTP() {
	const otp_code = document.getElementById("otpInputRecover").value;
	console.log(otp_code);
	try {
		const enableResponse = await fetch(
			"http://localhost:8000/api/users/checkRecoverOTP/",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("access")}`,
				},
				body: JSON.stringify({ otp_code }),
			}
		);

		if (!enableResponse.ok) {
			const errorData = await enableResponse.json();
			console.log("Error Data:", errorData);
			return;
		}

		const enableData = await enableResponse.json();
		console.log("2FA reset successfully:", enableData);
		history.pushState({}, '', 'https://localhost/two_fa_re_enable');
		checkAndRunTwoFA()
	} catch (error) {
		console.error("Error during 2FA recovery:", error);
	}
}