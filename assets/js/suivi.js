(function () {
  'use strict';
  var form = document.getElementById('track-form');
  var input = document.getElementById('track-input');
  var out = document.getElementById('track-result');
  if (!form) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(ref) {
    var q = ref.trim().toUpperCase();
    var d = window.LSG_load().filter(function (x) { return x.ref === q; })[0];
    if (!d) {
      out.innerHTML = '<p class="track__empty">Aucun dossier « ' + esc(q || '…') + ' » trouvé.<br>Vérifiez le numéro ou contactez-nous sur WhatsApp.</p>';
      return;
    }
    var steps = window.LSG_STEPS;
    var items = steps.map(function (s, i) {
      var cls = i < d.step ? 'is-done' : i === d.step ? 'is-current' : '';
      return '<li class="' + cls + '">' + s.label + (i === d.step && i < steps.length - 1 ? '<small>Étape en cours</small>' : '') + '</li>';
    }).join('');
    out.innerHTML = '<div class="track__top"><div><div class="track__ref">' + esc(d.ref) + '</div>' +
      '<div class="track__meta">' + esc(d.type) + ' · ' + esc(d.origine) + ' → ' + esc(d.agence) + '<br>' + esc(d.desc) + '</div></div>' +
      '<span class="badge' + (d.step === steps.length - 1 ? ' badge--done' : '') + '">' + steps[d.step].label + '</span></div>' +
      '<ol class="tl">' + items + '</ol>' +
      '<p class="track__note">Exemple fictif présenté à titre de démonstration.</p>';
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); show(input.value); });
  document.querySelectorAll('[data-demo]').forEach(function (b) {
    b.addEventListener('click', function () { input.value = b.dataset.demo; show(b.dataset.demo); });
  });
})();
