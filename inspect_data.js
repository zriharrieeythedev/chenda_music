import axios from 'axios';
import fs from 'fs';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';
const embedUrl = testUrl.replace('open.spotify.com/playlist/', 'open.spotify.com/embed/playlist/');

axios.get(embedUrl, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
}).then(res => {
    const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    const nextData = JSON.parse(match[1]);
    // Save to file for inspection
    fs.writeFileSync('next_data.json', JSON.stringify(nextData, null, 2));
    console.log('Saved __NEXT_DATA__ to next_data.json');
    
    // Log top level keys
    console.log('Top level keys:', Object.keys(nextData.props.pageProps));
});
