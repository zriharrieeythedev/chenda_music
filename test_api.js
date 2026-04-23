import axios from 'axios';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';
const playlistId = testUrl.split('/').pop().split('?')[0];

try {
    console.log(`Testing SpotifyDown API for ID: ${playlistId}`);
    const res = await axios.get(`https://api.spotifydown.com/metadata/playlist/${playlistId}`);
    console.log('Success!');
    console.log('Playlist Title:', res.data.title);
    // console.log('Tracks:', res.data.tracks);
} catch (err) {
    console.error('API Test failed:', err.message);
}
