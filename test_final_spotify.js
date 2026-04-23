import spotify from 'spotify-url-info';
const { getTracks } = spotify(fetch);

const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

async function test() {
    try {
        console.log('Testing spotify-url-info with built-in fetch...');
        const tracks = await getTracks(url);
        console.log(`Success! Found ${tracks.length} tracks.`);
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err.message);
        process.exit(1);
    }
}

test();
