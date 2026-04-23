import axios from 'axios';

const testUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';
const id = testUrl.split('/').pop();
const embedUrl = `https://open.spotify.com/embed/playlist/${id}`;

async function test() {
    try {
        console.log(`Fetching: ${embedUrl}`);
        const { data, status } = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1'
            }
        });
        
        console.log('Status:', status);
        if (data.includes('__NEXT_DATA__')) {
            console.log('Found __NEXT_DATA__');
            const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            const json = JSON.parse(match[1]);
            fs.writeFileSync('next_debug.json', JSON.stringify(json, null, 2));
            console.log('PageProps keys:', Object.keys(json.props.pageProps));
            if (json.props.pageProps.state) {
                console.log('SUCCESS! Found state.');
            } else {
                console.log('Still getting 404 or empty state in NEXT_DATA');
                console.log('Title in PageProps:', json.props.pageProps.title);
            }
        } else {
            console.log('No NEXT_DATA found.');
            // console.log(data.substring(0, 1000));
        }

    } catch (err) {
        console.error('Fetch failed:', err.message);
        if (err.response) console.log('Response Status:', err.response.status);
    }
}

import fs from 'fs';
test();
