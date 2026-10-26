// Paste into Code by Zapier / Run JavaScript
const data = inputData;
const result = {};
for (const key of ['name', 'kana', 'region', 'building', 'internet', 'tel', 'email', 'postal', 'address', 'privacy_consent', 'submission_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'placement', 'keyword', 'matchtype', 'gclid', 'fbclid', 'lpv', 'lp_path', 'source_url', 'referrer']) result[key] = data[key] || '';
const date = new Date(data.submitted_at);
result.submitted_at = Number.isNaN(date.getTime()) ? (data.submitted_at || '') : date.toLocaleString('sv-SE', {timeZone:'Asia/Tokyo'});
return result;
