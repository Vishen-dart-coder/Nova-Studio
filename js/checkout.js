/* Checkout config. UPI ID empty = the pay button and ID are hidden.
   The amount and reference come from the link you send: /checkout?amount=15000&for=Website%20design%20deposit */
var CHECKOUT = { whatsapp: '917021242931', upi: '', payee: 'Nøva' };
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var amt = parseFloat(q.get('amount')), okAmt = isFinite(amt) && amt >= 1 && amt <= 1000000;
  var what = (q.get('for') || q.get('ref') || 'Project payment').slice(0, 120);
  var money = okAmt ? '₹' + amt.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';
  var d = {};
  function normUrl(v) {
    v = v.trim(); if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try { var u = new URL(v); if (!/^https?:$/.test(u.protocol) || !/\.[a-z]{2,}$/i.test(u.hostname)) return null; return u.origin + (u.pathname === '/' ? '' : u.pathname); } catch (e) { return null; }
  }
  function err(id, inp, msg) { $(id).textContent = msg || ''; $(inp).setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
  function show(step) { $('step-details').hidden = step !== 'details'; $('step-pay').hidden = step !== 'pay'; window.scrollTo(0, 0); var h = (step === 'pay' ? $('co-h2') : $('co-h1')); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }

  $('details-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('f-name').value.trim().replace(/\s+/g, ' '), url = normUrl($('f-url').value);
    var a = err('e-name', 'f-name', name.length < 2 ? 'Please enter your name.' : ''), b = err('e-url', 'f-url', url ? '' : 'Please enter a valid website address.');
    if (!a || !b) return;
    d.name = name; d.url = url;
    $('o-name').textContent = name.split(' ')[0]; $('o-url').textContent = url.replace(/^https?:\/\//, ''); $('o-for').textContent = what; $('o-amt').textContent = money || '—';
    $('pay-block').hidden = !okAmt; $('no-amount').hidden = okAmt;
    $('bad-wa').href = 'https://wa.me/' + CHECKOUT.whatsapp + '?text=' + encodeURIComponent('Hi, I need a payment link for ' + url + '.');
    if (okAmt && CHECKOUT.upi) {
      var up = 'upi://pay?pa=' + encodeURIComponent(CHECKOUT.upi) + '&pn=' + encodeURIComponent(CHECKOUT.payee) + '&am=' + amt.toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(what.slice(0, 50));
      $('upi-link').href = up; $('upi-link').hidden = false; $('upi-box').hidden = false; $('upi-id').textContent = CHECKOUT.upi;
    } else if (okAmt) { $('upi-missing').hidden = false; }
    show('pay');
  });
  $('edit-details').addEventListener('click', function () { show('details'); });
  $('upi-copy').addEventListener('click', function () {
    var b = this; try { navigator.clipboard.writeText(CHECKOUT.upi).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); }); } catch (e) {}
  });
  $('pay-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var utr = $('f-utr').value.trim();
    if (!err('e-utr', 'f-utr', /^[A-Za-z0-9]{6,30}$/.test(utr) ? '' : 'Enter the transaction reference from your UPI app (letters and numbers only).')) return;
    var notes = $('f-notes').value.trim();
    var msg = 'Payment confirmation\nName: ' + d.name + '\nWebsite: ' + d.url + '\nFor: ' + what + '\nAmount: ' + money + '\nUPI ref: ' + utr + (notes ? '\nNotes: ' + notes : '');
    window.open('https://wa.me/' + CHECKOUT.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
})();
