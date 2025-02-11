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
		renderPage("two_fa_recover");
	});
}

function attach2FAEnableFormListener(responseStruct) {
	console.log("cao");
	const form = document.getElementById("twoFaEnableForm");
	const cancelBtn = document.getElementById("cancel");

	if (!form) {
		console.error("Form not found");
		return;
	}

	form.addEventListener("submit", async function (event) {
		event.preventDefault();
		const code = document.getElementById("otpCode").value;
		await verifyOtpCode(responseStruct, code);
	});

	cancelBtn.addEventListener("click", async function () {
		await cancelRegistration(responseStruct);
	});
}


async function cancelRegistration(responseStruct) {
	const messageModal = new MessageModal(MessageType.INVITE);
	const result = await messageModal.show(
		"Are you sure you want to cancel your account registration? All your progress will be lost.",
		"Cancel Account Registration"
	);

	if (!result) return;

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
			renderPage("home");
		} else {
			displayMessage("Invalid OTP code", MessageType.ERROR);
		}
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to verify OTP", MessageType.ERROR);
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
			const errorData = await response.json();
			throw new Error(errorData.message || 'Failed to request OTP');
		}

		displayMessage("Recovery OTP sent to email", MessageType.SUCCESS);
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to send recovery OTP", MessageType.ERROR);
	}
}

async function checkRecoverOTP(responseStruct, otp_code) {
	try {
		const response = await fetchWithAuth('/api/users/checkRecoverOTP/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ otp_code })
		}, responseStruct);

		if (!response.ok) {
			displayMessage("Invalid recovery code", MessageType.ERROR);
			return;
		}

		renderPage("two_fa_re_enable")
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to verify recovery code", MessageType.ERROR);
	}
}