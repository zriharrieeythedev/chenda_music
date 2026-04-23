import puppeteer from 'puppeteer';
import fs from 'fs';

const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM3M';

async function test() {
    console.log('Launching browser...');
    // Use headless: false to see if it bypasses some bot protection, or at least let us see what it's loading
    const browser = await puppeteer.launch({ 
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });
    const page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    try {
        await page.waitForSelector('[data-testid="tracklist-row"]', { timeout: 10000 });
        console.log('Tracklist found!');
        
        const tracks = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('[data-testid="tracklist-row"]'));
            return rows.map(row => {
                const titleNode = row.querySelector('[data-testid="internal-track-link"]');
                const title = titleNode ? titleNode.textContent.trim() : 'Unknown Title';
                
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
        fs.writeFileSync('tracks.json', JSON.stringify(tracks, null, 2));
    } catch (err) {
        console.error('Error finding tracks:', err.message);
        const html = await page.content();
        fs.writeFileSync('puppeteer_dump.html', html);
    }
    
    await browser.close();
}

test();
