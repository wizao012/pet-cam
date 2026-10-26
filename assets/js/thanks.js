(() => {
  let sent = false;
  try {
    const receipt = JSON.parse(sessionStorage.getItem('mimamori-submission') || 'null');
    const age = Date.now() - receipt?.at;
    sent = location.hash === '#sent' && Boolean(receipt?.id) && age >= 0 && age < 30 * 60 * 1000;
  } catch (_) {}
  document.getElementById('thanks-sent').hidden = !sent;
  document.getElementById('thanks-direct').hidden = sent;
})();
