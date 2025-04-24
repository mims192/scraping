import puppeteer from 'puppeteer';

const scrapeStocksToWatch = async () => {
  const browser = await puppeteer.launch({
    headless: new,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  try {
    await page.goto('https://www.moneycontrol.com/news/tags/stocks-to-watch.html', {
      waitUntil: 'networkidle2',
      timeout: 180000
    });

    console.log('Waiting for selector...');
    await page.waitForSelector('#newslist-0 h2 a', { timeout: 30000 });

    const articleUrl = await page.evaluate(() => {
      const firstAnchor = document.querySelector('#newslist-0 h2 a');
      return firstAnchor ? firstAnchor.href : null;
    });

    console.log(`Found Article: ${articleUrl}`);

    if (articleUrl) {
      const articlePage = await browser.newPage();
      await articlePage.goto(articleUrl);
      await articlePage.waitForSelector('p', { timeout: 30000 });

      const data = await articlePage.evaluate(() => {
        const allP = Array.from(document.querySelectorAll('p'));

        return allP.reduce((acc, p) => {
          const strong = p.querySelector('strong');
          const link = p.querySelector('a');
          const text = p.innerText.trim();

          if (strong && link && strong.innerText.trim().length > 0) {
            acc.push({
              title: strong.innerText.trim(),
              content: []
            });
          } else if (text && acc.length > 0) {
            acc[acc.length - 1].content.push({ point: text });
          }

          return acc;
        }, []);
      });

      if (!data || data.length === 0) {
        console.log("Failed to extract article content.");
      } else {
        console.log('Article Data:', data);
      }

      await articlePage.close();
    } else {
      console.log('No article found.');
    }
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
};

scrapeStocksToWatch();
