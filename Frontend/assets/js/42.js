function startOAuth() {
	const clientId = 'u-s4t2ud-a6f40a3d8815d6e54ce1c1ade89e13948ac4e875a56a593543068f6a77e7ddc4';
	const redirectUri = encodeURIComponent(`${window.location.origin}/42`);
	const scope = 'public';
	const responseType = 'code';

	const oauthUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

	window.location.href = oauthUrl;
}

async function handle42Callback() {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');
	const redirectURI = `${window.location.origin}/42`;

	if (code) {
		try {
			const response = await fetch(`${window.location.origin}/api/users/oauth_callback/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code: code, redirectURI: redirectURI })
			});

			if (!response.ok) {
				const errorData = await response.json();
				//console.error('Error:', errorData.error);
				return;
			}

			const data = await response.json();

			const responseStruct = {
				access: data.access,
				refresh: data.refresh,
				username: data.username,
				email: data.email
			};

			if (data.two_fa_enabled == false) {
				renderAuthPage("two_fa_enable", responseStruct);
			} else {
				renderAuthPage("two_fa_verify", responseStruct);
			}
		} catch (error) {
			//console.error('Error:', error);
		}
	} else {
		//console.error('Authorization code not found');
	}
};