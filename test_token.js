import axios from 'axios';

async function test() {
    try {
        console.log('Fetching Spotify Home for Token...');
        const { data } = await axios.get('https://open.spotify.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        
        const match = data.match(/"accessToken":"([^"]+)"/);
        if (match) {
            console.log('FOUND TOKEN:', match[1].substring(0, 20) + '...');
            const token = match[1];
            
            // Try calling the official API for the playlist
            const playlistId = '37i9dQZF1DXcBWIGoYBM3M';
            console.log(`Calling Official API for Playlist ${playlistId}...`);
            const res = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('SUCCESS!');
            console.log('Playlist Name:', res.data.name);
            console.log('Tracks count:', res.data.tracks.total);
            console.log('Tracks in first page:', res.data.tracks.items.length);
        } else {
            console.log('Token not found in HTML.');
            // Check for __NEXT_DATA__
            if (data.includes('__NEXT_DATA__')) {
                const nextMatch = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
                const json = JSON.parse(nextMatch[1]);
                console.log('NextData accessToken:', json.props.pageProps.accessToken);
            }
        }
    } catch (err) {
        console.error('Failed:', err.message);
        if (err.response) console.log('Status:', err.response.status, err.response.data);
    }
}

test();
