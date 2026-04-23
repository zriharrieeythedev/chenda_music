import spotifyUrlInfo from 'spotify-url-info';
const { getData, getTracks } = spotifyUrlInfo(fetch);

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

try {
    console.log('Testing getData...');
    const data = await getData(testUrl);
    console.log('Success! Table name:', data.name);
    console.log('Tracks count:', data.tracks?.items?.length || data.tracks?.length);
} catch (err) {
    console.log('getData failed');
}

try {
    console.log('Testing getTracks...');
    const tracks = await getTracks(testUrl);
    console.log('Success! Tracks:', tracks.length);
} catch (err) {
    console.log('getTracks failed');
}
