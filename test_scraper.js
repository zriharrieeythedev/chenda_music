import axios from 'axios';

const fetchSpotifyPlaylist = async (url) => {
    try {
        let embedUrl = url;
        if (url.includes('open.spotify.com/playlist/')) {
            embedUrl = url.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');
        }

        const { data } = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match) throw new Error('Could not find playlist data');

        const nextData = JSON.parse(match[1]);
        // The structure might vary slightly, let's be careful
        const playlistData = nextData.props.pageProps.state.data.entity;

        return playlistData.tracks.items.map((item, index) => {
            const track = item.track;
            return {
                title: track.name,
                artist: track.artists[0]?.name
            };
        });
    } catch (err) {
        throw err;
    }
};

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';
fetchSpotifyPlaylist(testUrl)
    .then(tracks => console.log(`Success! Found ${tracks.length} tracks.`))
    .catch(err => console.error('Failed:', err.message));
