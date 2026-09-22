const SERVICE_DEFS = [
  ['haifa-moodle', 'Moodle · אוניברסיטת חיפה', ['moodle','moodle haifa','haifa moodle','מודל','מודל חיפה','מודל אוניברסיטת חיפה'], [/^mw\d+\.haifa\.ac\.il$/i]],
  ['gmail', 'Gmail', ['gmail','mail.google.com','gmail.com']],
  ['youtube', 'YouTube', ['youtube','youtu.be','youtube.com']],
  ['googledrive', 'Google Drive', ['google drive','drive.google.com']],
  ['google', 'Google', ['google','google.com']],
  ['apple', 'Apple / iCloud', ['apple','icloud','apple.com','icloud.com']],
  ['microsoft', 'Microsoft', ['microsoft','outlook','hotmail','office','onedrive','live.com','outlook.com','microsoft.com','office.com']],
  ['instagram', 'Instagram', ['instagram','instagram.com']],
  ['facebook', 'Facebook', ['facebook','facebook.com','fb.com']],
  ['whatsapp', 'WhatsApp', ['whatsapp','whatsapp.com']],
  ['telegram', 'Telegram', ['telegram','telegram.org','t.me']],
  ['x', 'X / Twitter', ['twitter','twitter.com','x.com']],
  ['tiktok', 'TikTok', ['tiktok','tiktok.com']],
  ['snapchat', 'Snapchat', ['snapchat','snapchat.com']],
  ['pinterest', 'Pinterest', ['pinterest','pinterest.com','pin.it']],
  ['reddit', 'Reddit', ['reddit','reddit.com']],
  ['linkedin', 'LinkedIn', ['linkedin','linkedin.com']],
  ['discord', 'Discord', ['discord','discord.com','discord.gg']],
  ['twitch', 'Twitch', ['twitch','twitch.tv']],
  ['openai', 'ChatGPT / OpenAI', ['chatgpt','openai','chatgpt.com','openai.com']],
  ['github', 'GitHub', ['github','github.com']],
  ['gitlab', 'GitLab', ['gitlab','gitlab.com']],
  ['bitbucket', 'Bitbucket', ['bitbucket','bitbucket.org']],
  ['figma', 'Figma', ['figma','figma.com']],
  ['canva', 'Canva', ['canva','canva.com']],
  ['slack', 'Slack', ['slack','slack.com']],
  ['trello', 'Trello', ['trello','trello.com']],
  ['jira', 'Jira', ['jira','atlassian','atlassian.net']],
  ['asana', 'Asana', ['asana','asana.com']],
  ['notion', 'Notion', ['notion','notion.so']],
  ['zoom', 'Zoom', ['zoom','zoom.us']],
  ['dropbox', 'Dropbox', ['dropbox','dropbox.com']],
  ['adobe', 'Adobe', ['adobe','adobe.com','creative cloud']],
  ['cloudflare', 'Cloudflare', ['cloudflare','cloudflare.com']],
  ['aws', 'Amazon Web Services', ['aws','amazon web services','aws.amazon.com']],
  ['azure', 'Microsoft Azure', ['azure','azure.microsoft.com','portal.azure.com']],
  ['netflix', 'Netflix', ['netflix','netflix.com']],
  ['spotify', 'Spotify', ['spotify','spotify.com']],
  ['disneyplus', 'Disney+', ['disney+','disney plus','disneyplus','disneyplus.com']],
  ['primevideo', 'Prime Video', ['prime video','primevideo','primevideo.com']],
  ['maxstream', 'Max / HBO Max', ['hbo max','hbomax','max.com','max streaming']],
  ['soundcloud', 'SoundCloud', ['soundcloud','soundcloud.com']],
  ['amazon', 'Amazon', ['amazon','amazon.com','amazon.co.uk','amazon.de','amazon.fr','amazon.it','amazon.es']],
  ['ebay', 'eBay', ['ebay','ebay.com']],
  ['aliexpress', 'AliExpress', ['aliexpress','aliexpress.com']],
  ['temu', 'Temu', ['temu','temu.com']],
  ['shein', 'SHEIN', ['shein','shein.com']],
  ['paypal', 'PayPal', ['paypal','paypal.com']],
  ['booking', 'Booking.com', ['booking','booking.com']],
  ['airbnb', 'Airbnb', ['airbnb','airbnb.com']],
  ['uber', 'Uber', ['uber','uber.com']],
  ['wolt', 'Wolt', ['wolt','wolt.com']],
  ['steam', 'Steam', ['steam','steampowered','steamcommunity']],
  ['playstation', 'PlayStation', ['playstation','playstation.com','psn']],
  ['xbox', 'Xbox', ['xbox','xbox.com','xbox live']],
  ['epicgames', 'Epic Games', ['epic games','epicgames','epicgames.com']],
  ['ea', 'EA', ['electronic arts','ea.com']],
  ['ubisoft', 'Ubisoft', ['ubisoft','ubisoft.com']],
  ['nintendo', 'Nintendo', ['nintendo','nintendo.com']],
  ['bit', 'bit', ['bit app','bitpay','bitpay.co.il','ביט']],
  ['paybox', 'PayBox', ['paybox','payboxapp','payboxapp.com']],
  ['leumi', 'בנק לאומי', ['לאומי','leumi','leumi.co.il']],
  ['hapoalim', 'בנק הפועלים', ['הפועלים','bank hapoalim','poalim','bankhapoalim.co.il']],
  ['discount', 'בנק דיסקונט', ['דיסקונט','discount bank','discountbank.co.il']],
  ['mizrahi', 'מזרחי טפחות', ['מזרחי','טפחות','mizrahi','mizrahi-tefahot.co.il']],
  ['pepper', 'Pepper', ['pepper','pepper.co.il']],
  ['isracard', 'ישראכרט', ['ישראכרט','isracard','isracard.co.il']],
  ['cal', 'כאל', ['כאל','cal-online','cal-online.co.il']],
  ['maxcard', 'MAX', ['max card','max.co.il','מקס']]
];

const EXACT_TITLE = new Map([
  ['ea', 'ea'],
  ['bit', 'bit'],
  ['ביט', 'bit'],
  ['cal', 'cal'],
  ['כאל', 'cal'],
  ['max', 'maxcard'],
  ['מקס', 'maxcard']
]);

export const SERVICES = SERVICE_DEFS.map(([key, label, terms, domains = []]) => ({ key, label, terms, domains }));

function normalize(value) {
  return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function normalizeHost(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return '';
  try {
    const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function detectService(entry) {
  const title = normalize(entry?.title);
  const host = normalizeHost(entry?.url);
  const haystack = `${title} ${normalize(entry?.url)}`;
  const exactKey = EXACT_TITLE.get(title);
  if (exactKey) return SERVICES.find((item) => item.key === exactKey) || null;

  return SERVICES.find((service) => {
    if (service.domains.some((pattern) => pattern.test(host))) return true;
    return service.terms.some((term) => haystack.includes(term));
  }) || null;
}

export function serviceSearchTerms(entry) {
  const service = detectService(entry);
  return service ? [service.key, service.label, ...service.terms] : [];
}
