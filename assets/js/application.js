(() => {
  'use strict';
  const form = document.getElementById('gift-form');
  if (!form) return;
  const config = window.MIMAMORI_CONFIG;
  // Capture only the documented campaign fields; do not forward arbitrary queries.
  const params = new URLSearchParams(location.search);
  for (const key of config.PARAM_KEYS) {
    const field = document.getElementById('trk-' + key);
    if (field) field.value = (params.get(key) || '').slice(0,512);
  }
  document.getElementById('trk-lp_path').value = location.pathname;
  try {
    const ref = new URL(document.referrer);
    // Strip query/hash to avoid forwarding personal data from another page.
    document.getElementById('trk-referrer').value = ref.origin + ref.pathname;
  } catch (_) {}
  const submitButton = form.querySelector('[type="submit"]');
  const consent = document.getElementById('apply-consent');
  let sending = false, submitted = false;
  const submissionId = window.crypto?.randomUUID?.() || ('lead-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const fields = Object.fromEntries(['name','phone','email','region','postal','address','internet'].map(k => [k, document.getElementById('apply-' + k)]));
  const normalize = s => s.normalize('NFKC').trim();
  const digits = s => normalize(s).replace(/[-ー−‐–—\s]/g, '');
  function phoneError(value) {
    let number = digits(value);
    if (number.startsWith('+81')) number = '0' + number.slice(3);
    if (!/^0\d{9,10}$/.test(number)) return '日本国内の電話番号を、正しい桁数で入力してください。';
    if (!window.libphonenumber || !window.libphonenumber.isValidPhoneNumber(number, 'JP')) return '電話番号の市外局番・番号形式をご確認ください。';
    const tail = number.slice(-8);
    if (/^(\d)\1{7}$/.test(tail) || ['12345678','87654321','01234567','98765432'].includes(tail)) return '連絡が取れる電話番号を入力してください。連続・同一数字のダミーパターンは使用できません。';
    return '';
  }
  function validate(key) {
    const field = fields[key], value = normalize(field.value);
    let message = value ? '' : 'この項目をご入力ください。';
    if (value && key === 'phone') message = phoneError(value);
    if (value && key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'メールアドレスの形式をご確認ください。';
    if (value && key === 'postal' && !/^\d{7}$/.test(digits(value))) message = '郵便番号を7桁で入力してください。';
    if (key === 'region' && !['愛知県','岐阜県','三重県','静岡県'].includes(value)) message = 'お住まいのご地域を選択してください';
    if (key === 'address' && value && value === lastAutoAddress) message = '番地などの詳しい住所を追記してください';
    if (key === 'internet' && !['未利用', 'フレッツ光', 'BIGLOBE光', 'ドコモ光', 'auひかり', 'SoftBank 光', '@TCOM 光', 'NURO 光', 'コミュファ光', 'J:COM', 'SoftBank Air', 'その他光回線'].includes(value)) message = '現在利用中のネット回線を選択してください。';
    document.getElementById(key + '-error').textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }
  let timer, controller, requestId = 0, lastAutoAddress = '';
  const postalStatus = document.getElementById('postal-status');
  const choices = document.getElementById('postal-choices');
  const choice = document.getElementById('address-choice');
  function setAddress(address) {
    fields.address.value = address;
    lastAutoAddress = address;
    const region = ['愛知県','岐阜県','三重県','静岡県'].find(r => address.startsWith(r));
    fields.region.value = region || '';
    postalStatus.textContent = region ? '住所を入力しました。番地・建物名・部屋番号を追記してください' : '対象の4県以外の住所です。お住まいの地域をご確認ください';
  }
  async function lookup() {
    const postal = digits(fields.postal.value);
    if (!/^\d{7}$/.test(postal)) return;
    const id = ++requestId, original = fields.address.value;
    const abort = new AbortController(); controller = abort;
    const timeout = setTimeout(() => abort.abort(), 8000);
    postalStatus.textContent = '住所を検索しています…';
    try {
      const response = await fetch('https://zipcloud.ibsnet.co.jp/api/search?zipcode=' + encodeURIComponent(postal), {signal:abort.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if (!response.ok) throw Error('lookup');
      const data = await response.json();
      if (id !== requestId) return;
      if (data.status !== 200) throw Error('lookup');
      if (!data.results?.length) { postalStatus.textContent = '住所が見つかりません。郵便番号を確認するか住所を手入力してください'; return; }
      const addresses = [...new Set(data.results.map(r => r.address1 + r.address2 + r.address3))];
      if (fields.address.value !== original || (original.trim() && original !== lastAutoAddress)) {
        postalStatus.textContent = '入力済みの住所を保持しています。検索結果：' + addresses.join(' / '); return;
      }
      if (addresses.length === 1) setAddress(addresses[0]);
      else {
        choice.replaceChildren(new Option('町域を選択してください',''), ...addresses.map(a => new Option(a,a)));
        choices.hidden = false; postalStatus.textContent = '該当する町域を選択してください';
      }
    } catch (_) { if (id === requestId) postalStatus.textContent = '住所を取得できませんでした。住所を手入力してください'; }
    finally { clearTimeout(timeout); }
  }
  fields.postal.addEventListener('input', () => {
    clearTimeout(timer); controller?.abort(); requestId++;
    choices.hidden = true; postalStatus.textContent = '';
    timer = setTimeout(lookup, 450);
  });
  choice.addEventListener('change', () => { if(choice.value) setAddress(choice.value); });
  for (const [key,field] of Object.entries(fields)) {
    field.addEventListener('blur', () => { if(field.value) validate(key); });
    field.addEventListener('input', () => {
      document.getElementById('form-status').textContent = '';
      if (field.getAttribute('aria-invalid') === 'true') validate(key);
    });
  }
  consent.addEventListener('change', () => {
    document.getElementById('consent-error').textContent = '';
    consent.setAttribute('aria-invalid', 'false');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || submitted) return;
    const invalid = Object.keys(fields).filter(key => !validate(key));
    const status = document.getElementById('form-status');
    if (invalid.length) { status.textContent = '入力内容をご確認ください。'; fields[invalid[0]].focus(); return; }
    if (!consent.checked) {
      document.getElementById('consent-error').textContent = 'プライバシーポリシーをご確認のうえ、同意してください。';
      consent.setAttribute('aria-invalid', 'true'); consent.focus(); return;
    }
    if (config?.LOCAL_ONLY !== false) { status.textContent = '入力内容を確認しました。デザイン確認のため送信していません。'; status.focus(); return; }
    if (!config?.ZAPIER_WEBHOOK_URL) { status.textContent = '送信設定を確認できません。時間をおいて再度お試しください。'; return; }
    sending = true;
    submitButton.disabled = true; submitButton.textContent = '送信中…';
    form.setAttribute('aria-busy', 'true'); status.textContent = '送信しています。この画面を閉じずにお待ちください。';
    const payload = new FormData(form);
    for (const key of ['name','email','address','internet']) payload.set(key, normalize(fields[key].value));
    let phone = digits(fields.phone.value);
    if (phone.startsWith('+81')) phone = '0' + phone.slice(3);
    payload.set('tel', phone);
    payload.set('region', fields.region.value);
    payload.set('postal', digits(fields.postal.value));
    payload.set('submitted_at', new Date().toISOString());
    payload.set('submission_id', submissionId);
    // Forward only documented campaign parameters, not arbitrary query values or hash.
    const source = new URL(location.origin + location.pathname);
    const original = new URLSearchParams(location.search);
    for (const key of config.PARAM_KEYS) if (original.has(key)) source.searchParams.set(key, original.get(key).slice(0,512));
    payload.set('source_url', source.href);
    payload.set('privacy_consent', 'accepted');
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 20000);
    try {
      // PDF-compatible opaque POST. This cannot verify Zapier's receipt/HTTP status.
      await fetch(config.ZAPIER_WEBHOOK_URL, {method:'POST',mode:'no-cors',body:payload,credentials:'omit',referrerPolicy:'no-referrer',signal:abort.signal});
      submitted = true;
      try { sessionStorage.setItem('mimamori-submission', JSON.stringify({at:Date.now(),id:submissionId})); } catch (_) {}
      submitButton.textContent = '送信しました'; status.textContent = '送信が完了しました。画面を移動します。';
      let moved = false;
      const goToThanks = () => { if (!moved) { moved = true; location.assign(config.THANKS_PAGE + '#sent'); } };
      // Allow the GTM conversion tags time to dispatch before navigation. No PII in dataLayer.
      setTimeout(goToThanks, 1800);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event:'form_submit_cv',eventCallback:goToThanks,eventTimeout:1500});
    } catch (_) {
      status.textContent = '送信結果を確認できませんでした。通信環境をご確認ください。すでに届いている場合もあるため、再送は一度だけお試しください。';
      status.focus(); submitButton.disabled = false; submitButton.textContent = 'プレゼントを申し込む';
    } finally {
      clearTimeout(timeout); sending = false; form.removeAttribute('aria-busy');
    }
  });
  addEventListener('pageshow', event => {
    if (event.persisted && submitted) {
      submitButton.disabled = true;
      document.getElementById('form-status').textContent = 'この画面からのお申し込みは送信済みです。';
    }
  });
})();
