import fs from 'fs';

async function fastScan() {
  const anchors = [
    94284814, 94079551, 94170817, 94280712, 94105292,
    94329102, 94333994, 93904133, 94133944, 94142915,
    94298201, 94229044, 94299092, 94200630, 94163506,
    94271811, 94307938, 94170783, 94000807, 94232664,
    94509449, 94392963, 94513375, 94492587, 94307232,
    94174065, 94119263, 94453609, 94328636, 94509568,
    93950644, 93950747, 93906644, 93906487, 93958315
  ];

  const existingFile = './scanned_jabar_jobs.json';
  let found: any[] = [];
  if (fs.existsSync(existingFile)) {
    try {
      found = JSON.parse(fs.readFileSync(existingFile, 'utf8'));
    } catch (e) {}
  }

  const existingIds = new Set(found.map((x) => x.id));
  const queue: number[] = [];

  for (const anchor of anchors) {
    for (let offset = -20; offset <= 20; offset++) {
      if (offset === 0) continue;
      const id = anchor + offset;
      if (!existingIds.has(id)) {
        queue.push(id);
      }
    }
  }

  const uniqueQueue = [...new Set(queue)];
  console.log(`Scanning queue of ${uniqueQueue.length} job IDs...`);

  const concurrency = 6;
  let idx = 0;

  async function worker() {
    while (idx < uniqueQueue.length && found.length < 12) {
      const id = uniqueQueue[idx++];
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://id.jobstreet.com/id/job/${id}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        clearTimeout(timeout);
        if (!res.ok) continue;

        const text = await res.text();
        const mState = text.match(/"state":\s*"([^"]+)"/);
        const mExpired = text.match(/"isExpired":\s*(true|false)/);

        if (mState && mState[1] === 'Jawa Barat' && mExpired && mExpired[1] === 'false') {
          const s = text.match(/<script data-automation="server-state">([\s\S]*?)<\/script>/i);
          if (s) {
            const reduxIdx = s[1].indexOf('window.SEEK_REDUX_DATA');
            const appConfigIdx = s[1].indexOf('window.SEEK_APP_CONFIG');
            if (reduxIdx !== -1 && appConfigIdx !== -1) {
              const rStr = s[1]
                .slice(reduxIdx + 'window.SEEK_REDUX_DATA = '.length, appConfigIdx)
                .trim()
                .replace(/;$/, '');
              const redux = JSON.parse(rStr);
              const job = redux.jobdetails?.result?.job;
              if (job && !job.isExpired && job.advertiser?.name && job.title) {
                const item = {
                  id,
                  title: job.title,
                  companyName: job.advertiser?.name || '',
                  location: job.location?.label || '',
                  sourceUrl: `https://id.jobstreet.com/id/job/${id}`,
                };
                if (!found.some((x) => x.id === item.id)) {
                  found.push(item);
                  fs.writeFileSync(existingFile, JSON.stringify(found, null, 2));
                  console.log(`[FOUND ${found.length}] ${item.companyName} - ${item.title} (${item.location})`);
                }
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(`Scan done. Total found: ${found.length}`);
}

fastScan().catch(console.error);
