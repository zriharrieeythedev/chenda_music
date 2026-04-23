import axios from 'axios';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';
const embedUrl = testUrl.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');

try {
    const { data } = await axios.get(embedUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    
    const match = data.match(/<script id="(__NEXT_DATA__|initial-state|resource)" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
        console.log(`Found ${match[1]} script!`);
        // Save to file to inspect
    } else {
        const all = data.match(/<script [^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
        if (all) {
            console.log(`Found ${all.length} JSON scripts.`);
            console.log('Script tag 0 opening:', all[0].substring(0, 100));
        }
    }
} catch (err) {
    console.error('Fetch failed:', err.message);
}
