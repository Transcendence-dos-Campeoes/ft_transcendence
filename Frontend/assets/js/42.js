function startOAuth() {
    const clientId = 'u-s4t2ud-a6f40a3d8815d6e54ce1c1ade89e13948ac4e875a56a593543068f6a77e7ddc4';
    const redirectUri = encodeURIComponent('https://localhost/42');
    const scope = 'public';
    const responseType = 'code';

    const oauthUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    
    window.location.href = oauthUrl;
}

// Handle the OAuth callback
window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        try {
            const response = await fetch('http://localhost:8000/api/users/oauth_callback/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: code })
            });

            const data = await response.json();
            if (response.ok) {
				console.log(data.username);
				console.log(data.access);
				console.log(data.email);
                // Store the access token and other data
                localStorage.setItem('access', data.access);
                localStorage.setItem('refresh', data.refresh);
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('email', data.email);

                // // Redirect to the home page or another page
                window.location.href = '/home';
            } else {
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        console.error('Authorization code not found');
    }
};