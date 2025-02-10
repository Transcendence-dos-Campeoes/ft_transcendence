function startOAuth() {
	const clientId = 'u-s4t2ud-a6f40a3d8815d6e54ce1c1ade89e13948ac4e875a56a593543068f6a77e7ddc4';
	const redirectUri = encodeURIComponent('https://transcendence_brabos/42');
	const scope = 'public';
	const responseType = 'code';

	const oauthUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

	window.location.href = oauthUrl;
}

// Handle the OAuth callback
window.onload = async function () {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');

	if (code) {
		try {
			const response = await fetch(`${window.location.origin}/api/users/oauth_callback/`, {
				method: 'POST', 
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code: code })
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Error:', errorData.error);
				return;
			}

			const data = await response.json();
			console.log('OAuth login successful:', data);

			// Store the access token and other data
			localStorage.setItem('access', data.access);
			localStorage.setItem('refresh', data.refresh);
			const accessTokenExpiry = new Date().getTime() + 90 * 60 * 1000; // 10 minutes for testing
			localStorage.setItem('access_token_expiry', accessTokenExpiry);
			localStorage.setItem('username', data.username);
			localStorage.setItem('email', data.email);

			// Redirect to the appropriate page based on 2FA status
			if (data.two_fa_enabled == false) {
				history.pushState({}, '', '/two_fa_enable');
				checkAndRunTwoFA();
			} else {
				history.pushState({}, '', '/two_fa_verify');
				checkAndRunTwoFA();
			}
		} catch (error) {
			console.error('Error:', error);
		}
	} else {
		console.error('Authorization code not found');
	}
};