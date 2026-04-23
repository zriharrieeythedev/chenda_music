import axios from 'axios';

async function testFetchSpotifyPlaylist(url) {
    try {
        console.log(`Fetching: ${url}`);
        let fetchUrl = url;
        if (url.includes('open.spotify.com/playlist/')) {
            const playlistId = url.split('playlist/')[1].split('?')[0];
            fetchUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
        }

        const { data } = await axios.get(fetchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });

        const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (match) {
            const json = JSON.parse(match[1]);
            const entity = json.props?.pageProps?.state?.data?.entity;

            if (entity && entity.type === 'playlist') {
                const tracks = entity.trackList || [];
                console.log('Playlist Title:', entity.title);
                console.log('Tracks count:', tracks.length);
                if (tracks.length > 0) {
                    console.log('First track:', tracks[0].title);
                }
                return;
            } else {
                console.log('Entity not found or not a playlist. Entity structure:', JSON.stringify(json.props?.pageProps?.state?.data || {}, null, 2).substring(0, 500));
            }
        } else {
            console.log('__NEXT_DATA__ script not found');
            // Write data to file for inspection
            // import fs from 'fs';
            // fs.writeFileSync('spotify_dump.html', data);
        }
    } catch (error) {
        console.error("Scraping error:", error.message);
    }
}

testFetchSpotifyPlaylist('https://open.spotify.com/playlist/6TTntjkpJiwFyUtWHkCZcs?si=7c8a7bdf6d754ddf');
