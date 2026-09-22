const { smartSearchEntries } = await import('../src/services/smartSearch.js');
const entries = [
  { title: 'Google', username: 'elad@example.com', url: 'https://accounts.google.com', notes: 'main' },
  { title: 'PayPal', username: 'other@example.com', url: 'paypal.com', notes: 'payments' },
  { title: 'Moodle', username: 'student', url: 'https://mw27.haifa.ac.il', notes: 'university' }
];
if (smartSearchEntries(entries, 'gogle')[0]?.title !== 'Google') throw new Error('fuzzy search failed');
if (smartSearchEntries(entries, 'haifa moodle')[0]?.title !== 'Moodle') throw new Error('service aliases failed');
if (smartSearchEntries(entries, 'payments')[0]?.title !== 'PayPal') throw new Error('notes search failed');
console.log('search smoke: OK');
