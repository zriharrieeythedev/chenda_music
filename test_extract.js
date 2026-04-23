import axios from 'axios';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

try {
    console.log('Fetching Spotify HTML...');
    const { data } = await axios.get(testUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    
    // Look for initial data
    const match = data.match(/<script id="session" [^>]*>([\s\S]*?)<\/script>/);
    if (match) {
        console.log('Found session script!');
        // console.log(match[1].substring(0, 500));
    } else {
        const nextMatch = data.match(/<script id="initial-state" [^>]*>([\s\S]*?)<\/script>/);
        if (nextMatch) {
            console.log('Found initial-state script!');
        } else {
            console.log('No data script found in HTML.');
            // Let's check for other scripts
            const anyScript = data.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
            console.log(`Found ${anyScript?.length} scripts total.`);
        }
    }
} catch (err) {
    console.error('Fetch failed:', err.message);
}
