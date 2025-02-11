async function cancelRegistration() {
	const messageModal = new MessageModal(MessageType.INVITE);
	const result = await messageModal.show(
		"Are you sure you want to cancel your account registration? All your progress will be lost.",
		"Cancel Account Registration"
	);

	if (!result) return;

	try {
		const response = await fetchWithAuth('/api/users/delete/', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include'
		});

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


async function get_two_fa_qr() {
	try {
		const response = await fetchWithAuth('/api/users/twofa/enable/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		});

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

async function verifyOtpCode() {
	try {
		const otpCode = document.getElementById("otpCode").value;

		const response = await fetchWithAuth('/api/users/twofa/verify/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ otpCode })
		});

		if (response.ok) {
			renderPage("home");
		} else {
			displayMessage("Invalid OTP code", MessageType.ERROR);
		}
	} catch (error) {
		console.error("Error:", error);
		displayMessage("Failed to verify OTP", MessageType.ERROR);
	}
}

async function requestOtp() {
	const email = document.getElementById("emailInputRecover").value;
	try {
		const response = await fetchWithAuth('/api/users/setRecoverOTP/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ email })
		});

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

async function checkRecoverOTP() {
	const otp_code = document.getElementById("otpInputRecover").value;

	try {
		const response = await fetchWithAuth('/api/users/checkRecoverOTP/', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ otp_code })
		});

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