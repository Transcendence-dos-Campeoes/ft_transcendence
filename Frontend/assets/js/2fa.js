function attach2FAVerifyFormListener(responseStruct) {
	const form = document.getElementById("otpForm");
	const cancelBtn = document.getElementById("cancel");
	const disableBtn = document.getElementById("disable");

	if (!form) {
		console.error("Form not found");
		return;
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const code = document.getElementById("otpCode").value;
		await verifyOtpCode(responseStruct, code);
	});

	cancelBtn.addEventListener("click", () => {
		cancelVerification();
	});

	disableBtn.addEventListener("click", () => {
		renderAuthPage("two_fa_recover", responseStruct);
	});
}

function attach2FAEnableFormListener(responseStruct) {
	const form = document.getElementById("twoFaEnableForm");
	const cancelBtn = document.getElementById("cancel");

	if (!form) {
		console.error("Form not found");
		return;
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const code = document.getElementById("otpCode").value;
		await verifyEnableOtpCode(responseStruct, code);
	});

	cancelBtn.addEventListener("click", async function () {
		await cancelRegistration(responseStruct);
	});
}

function attach2FaRecoverFormListener(responseStruct) {
	const form = document.getElementById("twoFaRecoverForm");
	const cancelBtn = document.getElementById("cancel");
	const requestBtn = document.getElementById("request");

	if (!form) {
		console.error("Form not found");
		return;
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const code = document.getElementById("otpInputRecover").value;
		await checkRecoverOTP(responseStruct, code);
	});

	requestBtn.addEventListener("click", async function (event) {
		event.preventDefault();
		const email = document.getElementById("emailInputRecover").value;
		await requestOtp(responseStruct, email);
	});

	cancelBtn.addEventListener("click", async function (event) {
		event.preventDefault();
		cancelVerification();
	});
}

async function cancelRegistration(responseStruct) {
	const messageModal = new MessageModal(MessageType.INVITE);
	const result = await messageModal.show(
		"Are you sure you want to cancel your account registration? All your progress will be lost.",
		"Cancel Account Registration"
	);

	renderAuthPage("two_fa_enable", responseStruct);

	try {
		const response = await fetchWithDiffAuth('/api/users/delete/', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		}, responseStruct);

		if (!response.ok) {
			throw new Error('Failed to delete account');
		}

		localStorage.clear();
		window.location.href = '/register';
	} catch (error) {
		console.error('Error:', error);
		displayMessage('An error occurred while deleting user', MessageType.ERROR);
	}
}

function cancelVerification() {
	console.log("2FA verification canceled.");
	localStorage.clear();
	window.location.href = `${window.location.origin}/login`;
}


async function get_two_fa_qr(responseStruct) {
	try {
		const response = await fetchWithDiffAuth('/api/users/twofa/enable/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		}, responseStruct);

		if (!response.ok) {
			throw new Error('Failed to enable 2FA');
		}

		const responseData = await response.json();
		const qrCodeImage = document.getElementById("qrCodeImage");
		if (qrCodeImage) {
			qrCodeImage.src = responseData.qr_code;
		}
	} catch (error) {
		console.error("Error:", error);
		displayMessage("An error occurred while enabling 2FA.", MessageType.ERROR);
	}
}

async function verifyOtpCode(responseStruct, otpCode) {
	try {
		const response = await fetchWithDiffAuth('/api/users/twofa/verify/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ otpCode })
		}, responseStruct);

		if (response.ok) {
			localStorage.setItem('access', responseStruct.access);
			localStorage.setItem('refresh', responseStruct.refresh);
			localStorage.setItem('username', responseStruct.username);
			localStorage.setItem('email', responseStruct.email);
			// socket = new WebSocket(
			// 	`wss://${window.location.host}/ws/users/online-players/?token=${responseStruct.access}`
			// );
			renderPage("home");
		} else {
			displayMessage("Invalid OTP code", MessageType.ERROR);
			renderAuthPage("two_fa_verify", responseStruct);
		}
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to verify OTP", MessageType.ERROR);
		renderAuthPage("two_fa_verify", responseStruct);
	}
}

async function verifyEnableOtpCode(responseStruct, otpCode) {
	try {
		const response = await fetchWithDiffAuth('/api/users/twofa/verify/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ otpCode })
		}, responseStruct);

		if (response.ok) {
			localStorage.setItem('access', responseStruct.access);
			localStorage.setItem('refresh', responseStruct.refresh);
			localStorage.setItem('username', responseStruct.username);
			localStorage.setItem('email', responseStruct.email);
			// socket = new WebSocket(
			// 	`wss://${window.location.host}/ws/users/online-players/?token=${responseStruct.access}`
			// );
			renderPage("home");
		} else {
			displayMessage("Invalid OTP code", MessageType.ERROR);
			renderAuthPage("two_fa_enable", responseStruct);
		}
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to verify OTP", MessageType.ERROR);
		renderAuthPage("two_fa_enable", responseStruct);
	}
}

async function requestOtp(responseStruct, email) {
	try {
		const response = await fetchWithDiffAuth('/api/users/setRecoverOTP/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ email })
		}, responseStruct);

		if (!response.ok) {
			displayMessage("Failed to request OTP'", MessageType.ERROR);
			renderAuthPage("two_fa_recover", responseStruct);
			return;
		}

		displayMessage("Recovery OTP sent to email", MessageType.SUCCESS);
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to send recovery OTP", MessageType.ERROR);
		renderAuthPage("two_fa_recover", responseStruct);
	}
}

async function checkRecoverOTP(responseStruct, otp_code) {
	try {
		const response = await fetchWithDiffAuth('/api/users/checkRecoverOTP/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ otp_code })
		}, responseStruct);

		if (!response.ok) {
			displayMessage("Invalid recovery code", MessageType.ERROR);
			renderAuthPage("two_fa_recover", responseStruct);
			return;
		}

		renderAuthPage("two_fa_enable", responseStruct);
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to verify recovery code", MessageType.ERROR);
		renderAuthPage("two_fa_recover", responseStruct);
	}
}