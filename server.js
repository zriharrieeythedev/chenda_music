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
    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1';
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    const strategies = [
        // Strategy 1: Embed URL
        {
            name: 'Embed',
            getFetchUrl: (u) => {
                const parts = u.split('?')[0].split('/');
                const id = parts[parts.length - 1];
                const type = u.includes('/album/') ? 'album' : (u.includes('/track/') ? 'track' : 'playlist');
                return `https://open.spotify.com/embed/${type}/${id}`;
            },
            ua: desktopUA
        },
        // Strategy 2: Main URL with Mobile UA
        {
            name: 'Main (Mobile)',
            getFetchUrl: (u) => u,
            ua: mobileUA
        }
    ];

    let lastError = null;

    for (const strategy of strategies) {
        try {
            const fetchUrl = strategy.getFetchUrl(url);
            console.log(`[Scraper] Trying ${strategy.name} strategy: ${fetchUrl}`);
            
            const { data } = await axios.get(fetchUrl, {
                headers: {
                    'User-Agent': strategy.ua,
                    'Referer': 'https://open.spotify.com/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                timeout: 8000
            });

            const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (match) {
                const json = JSON.parse(match[1]);
                // In main page, data is sometimes in props.pageProps.data or state
                const entity = json.props?.pageProps?.state?.data?.entity || json.props?.pageProps?.data?.entity;

                if (entity) {
                    console.log(`[Scraper] Success using ${strategy.name}`);
                    const isTrack = entity.type === 'track';
                    const tracks = isTrack ? [entity] : (entity.trackList || entity.tracks?.items?.map(i => i.track || i) || []);
                    const playlistCover = String(entity.coverArt?.sources?.[0]?.url || entity.images?.[0]?.url || 'https://placehold.co/600x600/121212/ffffff?text=No+Cover');
                    
                    return {
                        title: String(entity.title || entity.name || 'Unknown Item'),
                        description: String(entity.subtitle || entity.description || ''),
                        coverUrl: playlistCover,
                        tracks: tracks.map(t => ({
                            title: String(t.title || t.name || 'Unknown Title'),
                            artist: String(t.subtitle || t.artists?.[0]?.name || 'Unknown Artist'), 
                            albumArt: String(t.thumbnail?.sources?.[0]?.url || t.album?.images?.[0]?.url || playlistCover),
                            previewUrl: t.audioPreview?.url || t.preview_url,
                            duration: Number(t.duration || t.duration_ms || 0)
                        })).filter(t => t.title !== 'Unknown Title')
                    };
                }
            }
            
            // Final fallback: OpenGraph
            if (strategy.name === 'Main (Mobile)') {
                const titleMatch = data.match(/<meta property="og:title" content="([^"]+)"/);
                if (titleMatch && !titleMatch[1].includes("Page not found")) {
                    const imageMatch = data.match(/<meta property="og:image" content="([^"]+)"/);
                    const descMatch = data.match(/<meta property="og:description" content="([^"]+)"/);
                    return {
                        title: titleMatch[1],
                        description: descMatch ? descMatch[1] : "",
                        coverUrl: imageMatch ? imageMatch[1] : 'https://placehold.co/300x300/121212/ffffff?text=Spotify',
                        tracks: [{ title: titleMatch[1], artist: "Spotify Content", albumArt: imageMatch ? imageMatch[1] : '' }]
                    };
                }
            }
        } catch (err) {
            console.error(`[Scraper] ${strategy.name} failed:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("Could not parse Spotify data from any known location.");
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

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Backend Server running on http://localhost:${PORT}`);
    });
}

export default app;
