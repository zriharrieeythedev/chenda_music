import axios from 'axios';
import fs from 'fs';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

async function test() {
    try {
        console.log('Fetching Spotify HTML...');
        const { data } = await axios.get(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        
        fs.writeFileSync('spotify_dump.html', data);
        console.log('Saved HTML to spotify_dump.html');
        
        // Find JSON blocks
        const matches = data.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
        console.log(`Found ${matches?.length} JSON script tags.`);
        
        matches?.forEach((tag, i) => {
            if (tag.includes('track') && tag.includes('name')) {
                console.log(`Tag ${i} looks promising...`);
                // Extract content
                const content = tag.match(/>([\s\S]*?)<\/script>/)[1];
                try {
                    const json = JSON.parse(content);
                    if (json.tracks) {
                        console.log('FOUND TRACKS IN TAG', i);
                    }
                } catch (e) {}
            }
        });

    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

test();
