const SERVICE_DEFS = [
  ['studyflow', 'StudyFlow', ['studyflow','study flow','מערכת שעות','לוח זמנים','student-schedule','es419.github.io/student-schedule']],
  ['pomoapp', 'Pomo', ['pomo','פומו','pomodoro','pomo focus','es419.github.io/pomo']],
  ['expenseapp', 'פנקס ההוצאות', ['פנקס ההוצאות','אפליקציית הוצאות','expense app','expense-app','es419.github.io/expense-app']],
  ['attendanceplus', 'נוכחות+', ['נוכחות+','student attendance','student-attendance-app','es419.github.io/student-attendance-app']],
  ['attendancework', 'נוכחות בעבודה', ['נוכחות בעבודה','attendance app','attendance-app']],
  ['vaultapp', 'Vault', ['personal vault','personal---vault','הכספת','vault app','es419.github.io/personal---vault']],
  ['haifa-moodle', 'Moodle · אוניברסיטת חיפה', ['moodle','moodle haifa','haifa moodle','מודל','מודל חיפה','מודל אוניברסיטת חיפה'], [/^mw\d+\.haifa\.ac\.il$/i]],
  ['gmail', 'Gmail', ['gmail','גימייל','ג׳ימייל',"ג'ימייל",'mail.google.com','gmail.com']],
  ['youtube', 'YouTube', ['youtube','יוטיוב','youtu.be','youtube.com']],
  ['googledrive', 'Google Drive', ['google drive','גוגל דרייב','דרייב של גוגל','drive.google.com']],
  ['google', 'Google', ['google','גוגל','google.com']],
  ['apple', 'Apple / iCloud', ['apple','אפל','icloud','אייקלאוד','איי קלאוד','apple.com','icloud.com']],
  ['byd', 'BYD', ['byd','בי וואי די','בי.ווי.די','byd auto','build your dreams','byd.com']],
  ['microsoft', 'Microsoft', ['microsoft','מיקרוסופט','outlook','אאוטלוק','hotmail','הוטמייל','office','אופיס','onedrive','וואן דרייב','live.com','outlook.com','microsoft.com','office.com']],
  ['instagram', 'Instagram', ['instagram','אינסטגרם','instagram.com']],
  ['facebook', 'Facebook', ['facebook','פייסבוק','facebook.com','fb.com']],
  ['whatsapp', 'WhatsApp', ['whatsapp','וואטסאפ','ווטסאפ','whatsapp.com']],
  ['telegram', 'Telegram', ['telegram','טלגרם','telegram.org','t.me']],
  ['x', 'X / Twitter', ['twitter','טוויטר','אקס','twitter.com','x.com']],
  ['tiktok', 'TikTok', ['tiktok','טיקטוק','tiktok.com']],
  ['snapchat', 'Snapchat', ['snapchat','סנאפצ׳ט','סנאפצט','snapchat.com']],
  ['pinterest', 'Pinterest', ['pinterest','פינטרסט','pinterest.com','pin.it']],
  ['reddit', 'Reddit', ['reddit','רדיט','reddit.com']],
  ['linkedin', 'LinkedIn', ['linkedin','לינקדאין','linkedin.com']],
  ['discord', 'Discord', ['discord','דיסקורד','discord.com','discord.gg']],
  ['twitch', 'Twitch', ['twitch','טוויץ׳','טוויץ','twitch.tv']],
  ['openai', 'ChatGPT / OpenAI', ['chatgpt','צ׳אט ג׳יפיטי','צאט גיפיטי','צאט ג׳יפיטי','openai','אופן איי','chatgpt.com','openai.com']],
  ['github', 'GitHub', ['github','גיטהאב','גיט האב','github.com']],
  ['gitlab', 'GitLab', ['gitlab','גיטלאב','gitlab.com']],
  ['bitbucket', 'Bitbucket', ['bitbucket','bitbucket.org']],
  ['figma', 'Figma', ['figma','פיגמה','figma.com']],
  ['canva', 'Canva', ['canva','קנבה','canva.com']],
  ['slack', 'Slack', ['slack','סלאק','slack.com']],
  ['trello', 'Trello', ['trello','טרלו','trello.com']],
  ['jira', 'Jira', ['jira','ג׳ירה','גירה','atlassian','אטלסיאן','atlassian.net']],
  ['asana', 'Asana', ['asana','אסאנה','asana.com']],
  ['notion', 'Notion', ['notion','נוטיון','נושן','notion.so']],
  ['zoom', 'Zoom', ['zoom','זום','zoom.us']],
  ['dropbox', 'Dropbox', ['dropbox','דרופבוקס','dropbox.com']],
  ['adobe', 'Adobe', ['adobe','אדובי','adobe.com','creative cloud','קריאייטיב קלאוד']],
  ['cloudflare', 'Cloudflare', ['cloudflare','קלאודפלייר','cloudflare.com']],
  ['aws', 'Amazon Web Services', ['aws','amazon web services','אמזון ווב סרוויסס','אמזון ווב סרוויסז','aws.amazon.com']],
  ['azure', 'Microsoft Azure', ['azure','אז׳ור','אזור','azure.microsoft.com','portal.azure.com']],
  ['netflix', 'Netflix', ['netflix','נטפליקס','netflix.com']],
  ['spotify', 'Spotify', ['spotify','ספוטיפיי','spotify.com']],
  ['disneyplus', 'Disney+', ['disney+','disney plus','disneyplus','דיסני פלוס','דיסני+','disneyplus.com']],
  ['primevideo', 'Prime Video', ['prime video','primevideo','פריים וידאו','אמזון פריים וידאו','primevideo.com']],
  ['maxstream', 'Max / HBO Max', ['hbo max','hbomax','max.com','max streaming']],
  ['soundcloud', 'SoundCloud', ['soundcloud','סאונדקלאוד','סאונד קלאוד','soundcloud.com']],
  ['amazon', 'Amazon', ['amazon','אמזון','amazon.com','amazon.co.uk','amazon.de','amazon.fr','amazon.it','amazon.es']],
  ['ebay', 'eBay', ['ebay','איביי','אי ביי','ebay.com']],
  ['aliexpress', 'AliExpress', ['aliexpress','אליאקספרס','עלי אקספרס','עליאקספרס','aliexpress.com']],
  ['temu', 'Temu', ['temu','טימו','temu.com']],
  ['shein', 'SHEIN', ['shein','שיין','shein.com']],
  ['paypal', 'PayPal', ['paypal','פייפאל','פיי פאל','paypal.com']],
  ['booking', 'Booking.com', ['booking','בוקינג','booking.com']],
  ['airbnb', 'Airbnb', ['airbnb','איירבנב','אייר בי אנ בי','airbnb.com']],
  ['uber', 'Uber', ['uber','אובר','uber.com']],
  ['wolt', 'Wolt', ['wolt','וולט','wolt.com']],
  ['steam', 'Steam', ['steam','סטים','steampowered','steamcommunity']],
  ['playstation', 'PlayStation', ['playstation','פלייסטיישן','פלייסטיישן','playstation.com','psn']],
  ['xbox', 'Xbox', ['xbox','אקסבוקס','xbox.com','xbox live']],
  ['epicgames', 'Epic Games', ['epic games','epicgames','אפיק גיימס','epicgames.com']],
  ['ea', 'EA', ['electronic arts','אלקטרוניק ארטס','אי איי','ea.com']],
  ['ubisoft', 'Ubisoft', ['ubisoft','יוביסופט','ubisoft.com']],
  ['nintendo', 'Nintendo', ['nintendo','נינטנדו','nintendo.com']],
  ['bit', 'bit', ['bit app','bitpay','bitpay.co.il','ביט']],
  ['paybox', 'PayBox', ['paybox','פייבוקס','פיי בוקס','payboxapp','payboxapp.com']],
  ['leumi', 'בנק לאומי', ['לאומי','leumi','leumi.co.il']],
  ['hapoalim', 'בנק הפועלים', ['הפועלים','bank hapoalim','poalim','bankhapoalim.co.il']],
  ['discount', 'בנק דיסקונט', ['דיסקונט','discount bank','discountbank.co.il']],
  ['mizrahi', 'מזרחי טפחות', ['מזרחי','טפחות','mizrahi','mizrahi-tefahot.co.il']],
  ['pepper', 'Pepper', ['pepper','פפר','pepper.co.il']],
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
