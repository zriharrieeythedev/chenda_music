import play from 'play-dl';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

async function test() {
    try {
        console.log('Testing play-dl with Spotify URL...');
        // play-dl needs some initialization for spotify if we want full features, 
        // but for basic metadata it might work.
        const data = await play.spotify(testUrl);
        console.log('Success!');
        console.log('Type:', data.type);
        console.log('Name:', data.name);
        
        // play-dl usually fetches one page of tracks (about 100)
        const tracks = await data.all_tracks();
        console.log(`Found ${tracks.length} tracks.`);
        if (tracks.length > 0) {
            console.log('First track:', tracks[0].name, 'by', tracks[0].artists.map(a => a.name).join(', '));
        }
    } catch (err) {
        console.error('play-dl test failed:', err.message);
    }
}

test();
