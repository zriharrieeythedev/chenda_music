import axios from 'axios';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

try {
    const { data } = await axios.get(testUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    
    // Look for any large JSON blocks
    const scripts = data.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
    scripts.forEach((s, i) => {
        if (s.length > 5000) {
            console.log(`Script ${i} is long (${s.length} chars)`);
            if (s.includes('track') && s.includes('artist')) {
                console.log(`Script ${i} might contain track data!`);
                // console.log(s.substring(0, 500));
            }
        }
    });

} catch (err) {
    console.error('Fetch failed:', err.message);
}
