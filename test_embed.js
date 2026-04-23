import axios from 'axios';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';
const embedUrl = testUrl.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');

try {
    console.log(`Fetching Spotify Embed: ${embedUrl}`);
    const { data } = await axios.get(embedUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    
    // Look for the JSON data in the script tag
    // It's usually in <script id="resource" type="application/json">...</script>
    const match = data.match(/<script id="resource" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
        console.log('Found resource script!');
        const json = JSON.parse(match[1]);
        console.log('Playlist Title:', json.name);
        console.log('Tracks count:', json.tracks.items.length);
        console.log('First track:', json.tracks.items[0].track.name);
    } else {
        console.log('No resource script found in Embed HTML.');
        // Check for other JSON scripts
        const scripts = data.match(/<script id="[^"]+" type="application\/json">([\s\S]*?)<\/script>/g);
        console.log(`Found ${scripts?.length} JSON scripts.`);
    }
} catch (err) {
    console.error('Fetch failed:', err.message);
}
