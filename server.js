import express from 'express';
import cors from 'cors';
import axios from 'axios';
import ytSearch from 'yt-search';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Scrape Spotify playlist data directly from public URLs without API keys
async function fetchSpotifyPlaylist(url) {
    try {
        console.log(`Fetching: ${url}`);
        let fetchUrl = url;
        if (url.includes('open.spotify.com/playlist/')) {
            const playlistId = url.split('playlist/')[1].split('?')[0];
            // The embed URL is often easier to parse for track metadata without JS
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
                return {
                    title: entity.title || 'Unknown Playlist',
                    description: entity.subtitle || '',
                    coverUrl: entity.coverArt?.sources?.[0]?.url || 'https://placehold.co/300x300/121212/ffffff?text=No+Cover',
                    tracks: tracks.map(t => ({
                        title: t.title,
                        artist: t.subtitle, 
                        albumArt: t.thumbnail?.sources?.[0]?.url || 'https://placehold.co/150x150/121212/ffffff?text=No+Art',
                        previewUrl: t.audioPreview?.url
                    }))
                };
            }
        }
        
        // Fallback for metadata if full parsing fails
        const titleMatch = data.match(/<meta property="og:title" content="([^"]+)"/);
        const imageMatch = data.match(/<meta property="og:image" content="([^"]+)"/);
        
        if (titleMatch) {
            return {
                title: titleMatch[1],
                description: "Playlist loaded from Spotify",
                coverUrl: imageMatch ? imageMatch[1] : 'https://placehold.co/300x300/121212/ffffff?text=Playlist',
                tracks: [
                    { title: "No details parsed", artist: "Try another playlist", albumArt: 'https://placehold.co/150x150/121212/ffffff?text=Error' }
                ]
            };
        }

        throw new Error("Could not parse Spotify playlist data from URL");

    } catch (error) {
        console.error("Scraping error:", error.message);
        throw error;
    }
}

app.get('/api/playlist', async (req, res) => {
    const playlistUrl = req.query.url;
    if (!playlistUrl) {
        return res.status(400).json({ error: 'Playlist URL is required' });
    }

    try {
        const data = await fetchSpotifyPlaylist(playlistUrl);
        if (!data || !data.tracks || data.tracks.length === 0) {
           return res.status(404).json({ error: 'Playlist not found or is empty.' });
        }
        res.json(data);
    } catch (err) {
        console.error('Error fetching playlist:', err);
        res.status(500).json({ error: 'Failed to parse Spotify link. Please try a different public playlist URL.' });
    }
});

// Endpoint to search YouTube for a song and return a playable video ID
app.get('/api/search-audio', async (req, res) => {
    const { title, artist } = req.query;
    
    if (!title || !artist) {
        return res.status(400).json({ error: 'Title and artist are required' });
    }

    const query = `${title} ${artist} audio`;
    console.log(`Searching YouTube for: ${query}`);

    try {
        const r = await ytSearch(query);
        const videos = r.videos.slice(0, 3);
        
        if (videos.length > 0) {
            console.log(`Found YouTube video: ${videos[0].title} (${videos[0].videoId})`);
            res.json({
                videoId: videos[0].videoId,
                title: videos[0].title,
                duration: videos[0].duration.seconds,
                url: videos[0].url
            });
        } else {
            res.status(404).json({ error: 'No playable audio found' });
        }
    } catch (err) {
        console.error('YouTube search error:', err);
        res.status(500).json({ error: 'Failed to search audio' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
});
