(function () {
  'use strict';
  var STEPS = window.LSG_STEPS;
  var data = window.LSG_load();
  var $ = function (id) { return document.getElementById(id); };
  var current = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function save() { window.LSG_save(data); }
  function age(d) { return Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000); }
  function late(d) { return d.step < STEPS.length - 1 && age(d.date) > 10; }
  function fmt(d) { var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  // Indicateurs
  function kpis() {
    var open = data.filter(function (d) { return d.step < STEPS.length - 1; });
    var douane = data.filter(function (d) { return d.step === 2; });
    var done = data.filter(function (d) { return d.step === STEPS.length - 1; });
    var lates = data.filter(late);
    $('kpis').innerHTML =
      '<div class="kpi"><b>' + open.length + '</b><span>Dossiers en cours</span></div>' +
      '<div class="kpi"><b>' + douane.length + '</b><span>En déclaration douane</span></div>' +
      '<div class="kpi"><b>' + done.length + '</b><span>Livrés</span></div>' +
      '<div class="kpi' + (lates.length ? ' kpi--alert' : '') + '"><b>' + lates.length + '</b><span>En retard (&gt; 10 jours)</span></div>';
  }

  // Filtres
  var fs = $('f-step');
  STEPS.forEach(function (s, i) { var o = document.createElement('option'); o.value = i; o.textContent = s.label; fs.appendChild(o); });

  function rows() {
    var q = $('q').value.trim().toLowerCase(), t = $('f-type').value, s = fs.value;
    var list = data.filter(function (d) {
      return (!t || d.type === t) && (s === '' || String(d.step) === s) &&
        (!q || (d.ref + ' ' + d.client + ' ' + d.origine + ' ' + d.desc).toLowerCase().indexOf(q) !== -1);
    }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    $('empty').hidden = list.length > 0;
    $('rows').innerHTML = list.map(function (d) {
      var last = d.step === STEPS.length - 1, pct = Math.round((d.step / (STEPS.length - 1)) * 100);
      var cls = last ? 'st--done' : late(d) ? 'st--late' : '';
      return '<tr class="row" data-ref="' + esc(d.ref) + '">' +
        '<td><span class="ref">' + esc(d.ref) + '</span><div class="sub">' + fmt(d.date) + '</div></td>' +
        '<td>' + esc(d.client) + '<div class="sub">' + esc(d.desc) + '</div></td>' +
        '<td><span class="pill pill--' + esc(d.type) + '">' + esc(d.type) + '</span></td>' +
        '<td>' + esc(d.origine) + '<div class="sub">→ ' + esc(d.agence) + '</div></td>' +
        '<td><span class="st ' + cls + '"><i></i>' + STEPS[d.step].label + '</span></td>' +
        '<td><div class="bar2"><span style="width:' + pct + '%"></span></div></td>' +
        '<td><button class="go" data-adv="' + esc(d.ref) + '"' + (last ? ' disabled' : '') + '>' + (last ? 'Terminé' : 'Étape suivante') + '</button></td></tr>';
    }).join('');
    kpis();
  }

  function find(ref) { return data.filter(function (d) { return d.ref === ref; })[0]; }
  function advance(ref) {
    var d = find(ref);
    if (d && d.step < STEPS.length - 1) { d.step++; save(); rows(); if (current === ref) openDrawer(ref); }
  }

  // Fiche dossier
  function waMsg(d) {
    var link = location.href.replace(/gestion\.html.*$/, '') + '#suivi';
    return 'Bonjour, votre dossier ' + d.ref + ' (' + d.desc + ') est à l\'étape : ' + STEPS[d.step].label + '. Suivi : ' + link + ' — LSG, Logistique Services Gabon.';
  }
  function openDrawer(ref) {
    var d = find(ref); if (!d) return;
    current = ref;
    $('d-ref').textContent = d.ref;
    var tl = STEPS.map(function (s, i) {
      return '<li class="' + (i < d.step ? 'is-done' : i === d.step ? 'is-current' : '') + '">' + s.label + '</li>';
    }).join('');
    var tel = (d.tel || '').replace(/\D/g, '');
    var wa = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(waMsg(d));
    $('d-body').innerHTML =
      '<dl class="dl"><dt>Client</dt><dd>' + esc(d.client) + '</dd><dt>Type</dt><dd>' + esc(d.type) + '</dd>' +
      '<dt>Trajet</dt><dd>' + esc(d.origine) + ' → ' + esc(d.agence) + '</dd><dt>Marchandises</dt><dd>' + esc(d.desc) + '</dd>' +
      '<dt>Ouvert le</dt><dd>' + fmt(d.date) + '</dd></dl>' +
      '<ol class="tl">' + tl + '</ol><div class="acts">' +
      (d.step < STEPS.length - 1 ? '<button class="btn btn--gold" id="d-adv">Passer à : ' + STEPS[d.step + 1].label + '</button>' : '') +
      (tel ? '<a class="btn btn--wa" target="_blank" rel="noopener" href="' + wa + '">Prévenir le client sur WhatsApp</a>'
           : '<a class="btn btn--wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(waMsg(d)) + '">Envoyer le suivi sur WhatsApp</a>') +
      '<button class="btn btn--line" id="d-copy">Copier le n° de suivi</button></div>';
    var adv = $('d-adv'); if (adv) adv.onclick = function () { advance(ref); };
    $('d-copy').onclick = function () { try { navigator.clipboard.writeText(d.ref); this.textContent = 'Copié ✓'; } catch (e) {} };
    $('drawer').classList.add('on'); $('scrim').classList.add('on'); $('drawer').setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    current = null;
    $('drawer').classList.remove('on'); $('scrim').classList.remove('on'); $('drawer').setAttribute('aria-hidden', 'true');
  }

  $('rows').addEventListener('click', function (e) {
    var b = e.target.closest('[data-adv]');
    if (b) { e.stopPropagation(); advance(b.dataset.adv); return; }
    var tr = e.target.closest('tr.row'); if (tr) openDrawer(tr.dataset.ref);
  });
  $('d-close').onclick = closeDrawer; $('scrim').onclick = closeDrawer;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  ['q', 'f-type', 'f-step'].forEach(function (id) { $(id).addEventListener('input', rows); });

  // Nouveau dossier
  var modal = $('modal');
  $('btn-new').onclick = function () { $('new-form').reset(); if (modal.showModal) modal.showModal(); else modal.setAttribute('open', ''); };
  $('new-cancel').onclick = function () { modal.close(); };
  $('new-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(this);
    var nums = data.map(function (d) { return parseInt(d.ref.split('-')[2], 10) || 0; });
    var n = Math.max.apply(null, nums.concat([400])) + 1;
    var now = new Date(), iso = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
    data.push({ ref: 'LSG-' + now.getFullYear() + '-' + ('0000' + n).slice(-4), client: f.get('client'), type: f.get('type'), origine: f.get('origine'), desc: f.get('desc'), step: 0, date: iso, agence: f.get('agence'), tel: f.get('tel') || '' });
    save(); modal.close(); rows();
  });

  // Export CSV
  $('btn-csv').onclick = function () {
    var head = ['N° dossier', 'Client', 'Type', 'Origine', 'Agence', 'Marchandises', 'Étape', 'Ouvert le'];
    var lines = [head].concat(data.map(function (d) { return [d.ref, d.client, d.type, d.origine, d.agence, d.desc, STEPS[d.step].label, fmt(d.date)]; }))
      .map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines], { type: 'text/csv;charset=utf-8' }));
    a.download = 'dossiers-lsg.csv'; document.body.appendChild(a); a.click(); a.remove();
  };

  $('btn-reset').onclick = function () {
    try { localStorage.removeItem('lsgDemoDossiers'); } catch (e) {}
    data = window.LSG_load(); closeDrawer(); rows();
  };

  rows();
})();
