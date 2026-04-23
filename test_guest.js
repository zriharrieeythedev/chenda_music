import axios from 'axios';

async function testGuestToken() {
    try {
        console.log('Fetching Guest Token...');
        const tokenRes = await axios.get('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                // This might need a referer or cookie from the home page
                'Referer': 'https://open.spotify.com/'
            }
        });
        
        const token = tokenRes.data.accessToken;
        console.log('Got Guest Token:', token.substring(0, 20) + '...');

        const playlistId = '37i9dQZF1DXcBWIGoYBM3M';
        console.log(`Fetching Playlist ${playlistId} tracks...`);
        
        const res = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`Success! Found ${res.data.items.length} tracks.`);
        console.log('Track 1:', res.data.items[0].track.name);
    } catch (err) {
        console.error('Failed:', err.message);
        if (err.response) {
            console.log('Response status:', err.response.status);
            // console.log(err.response.data);
        }
    }
}

testGuestToken();
