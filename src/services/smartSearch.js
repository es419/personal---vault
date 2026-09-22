import { serviceSearchTerms } from './catalog.js';

export function normalizeSearch(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[^\p{L}\p{N}@._+-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function editDistanceAtMostOne(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (Math.min(a.length, b.length) < 4) return false;

  let i = 0; let j = 0; let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else { i += 1; j += 1; }
  }
  if (i < a.length || j < b.length) edits += 1;
  return edits <= 1;
}

function tokenMatches(token, word) {
  if (word.includes(token) || token.includes(word)) return true;
  return editDistanceAtMostOne(token, word);
}

function scoreEntry(entry, queryTokens) {
  const title = normalizeSearch(entry.title);
  const url = normalizeSearch(entry.url);
  const username = normalizeSearch(entry.username);
  const notes = normalizeSearch(entry.notes);
  const services = normalizeSearch(serviceSearchTerms(entry).join(' '));
  const all = `${title} ${url} ${username} ${notes} ${services}`.trim();
  const words = all.split(' ').filter(Boolean);

  let score = 0;
  for (const token of queryTokens) {
    const matchingWord = words.find((word) => tokenMatches(token, word));
    if (!matchingWord) return -1;
    if (title === token) score += 100;
    else if (title.startsWith(token)) score += 60;
    else if (title.includes(token)) score += 45;
    else if (url.includes(token)) score += 30;
    else if (username.includes(token)) score += 25;
    else if (services.includes(token)) score += 20;
    else if (notes.includes(token)) score += 10;
    else score += 5;
  }
  return score;
}

export function smartSearchEntries(entries, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return entries;
  const tokens = normalized.split(' ').filter(Boolean);
  return entries
    .map((entry, index) => ({ entry, index, score: scoreEntry(entry, tokens) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.entry);
}
