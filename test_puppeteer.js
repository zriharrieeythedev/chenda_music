import puppeteer from 'puppeteer';

const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

async function test() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for the tracklist to appear
    try {
        await page.waitForSelector('[data-testid="tracklist-row"]', { timeout: 10000 });
        console.log('Tracklist found!');
        
        const tracks = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('[data-testid="tracklist-row"]'));
            return rows.map(row => {
                const titleNode = row.querySelector('[data-testid="internal-track-link"]');
                const title = titleNode ? titleNode.textContent.trim() : 'Unknown Title';
                
                // Artists are usually links to /artist/...
                const artistNodes = row.querySelectorAll('a[href*="/artist/"]');
                const artist = artistNodes.length > 0 
                    ? Array.from(artistNodes).map(a => a.textContent.trim()).join(', ') 
                    : 'Unknown Artist';
                
                const artNode = row.querySelector('img');
                const art = artNode ? artNode.src : '';
                
                return { title, artist, art };
            });
        });
        
        console.log(`Extracted ${tracks.length} tracks.`);
        console.log('First Track:', tracks[0]);
    } catch (err) {
        console.error('Error finding tracks:', err.message);
        // Let's dump the HTML if failed
        const html = await page.content();
        console.log('Length of HTML:', html.length);
    }
    
    await browser.close();
}

test();
