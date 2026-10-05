/* LSG — site public : interactions (menu, apparition, direct, suivi de dossier, escales, devis, visionneuse) */
(function () {
  'use strict';
  var doc = document;
  doc.documentElement.className += ' js';
  var LSG = window.LSG || null;
  var MAIL = 'info.lsg@lsg-gabon.com';
  var WA = '24165996283';

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n) { return '<svg class="ico" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function fmtDate(s) {
    if (!s) return '—';
    var d = new Date(String(s).length === 10 ? s + 'T12:00:00' : s);
    if (isNaN(d.getTime())) return esc(s);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtNum(n) { return Number(n || 0).toLocaleString('fr-FR'); }

  /* ---------- en-tête + menu mobile ---------- */
  var header = $('#header'), burger = $('#burger'), nav = $('#nav');
  var solidAlways = header && header.getAttribute('data-solid') === 'always';
  function onScroll() {
    if (!header) return;
    var s = solidAlways || window.scrollY > 40 || (nav && nav.classList.contains('is-open'));
    header.classList.toggle('is-solid', !!s);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('is-open');
    header.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    onScroll();
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      header.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      onScroll();
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) closeMenu(); });
  }

  /* lien actif selon la section visible (page d'accueil) */
  var navLinks = $$('.nav a.lnk[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          map[e.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = doc.getElementById(id); if (el) so.observe(el); });
  }

  /* ---------- apparition au défilement ---------- */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- carte « EN DIRECT » ---------- */
  var QUAI = { 'À quai': 1, 'Opérations': 1, 'En rade': 1 };
  function pillFor(st) {
    var c = { 'Annoncée': 'a', 'En rade': 'o', 'À quai': 'q', 'Opérations': 'q', 'Appareillée': 'd' }[st] || 'd';
    return '<span class="pill pill--' + c + '">' + esc(st) + '</span>';
  }
  function renderLive() {
    var box = $('#live');
    if (!box || !LSG) return;
    var esc_ = LSG.escales || [], dos = LSG.readDossiers ? LSG.readDossiers() : [];
    var quai = esc_.filter(function (e) { return QUAI[e.statut]; });
    var att = esc_.filter(function (e) { return e.statut === 'Annoncée'; });
    var cours = dos.filter(function (d) { return d.step < 5; });
    var set = function (id, v) { var el = $(id); if (el) el.textContent = v; };
    set('#live-quai', quai.length); set('#live-att', att.length); set('#live-dos', cours.length);
    var list = $('#live-list');
    if (list) {
      var rows = quai.concat(att).sort(function (a, b) { return (QUAI[a.statut] ? 0 : 1) - (QUAI[b.statut] ? 0 : 1); }).slice(0, 3);
      list.innerHTML = rows.map(function (e) {
        return '<li class="live__row">' + icon('ship') + '<div><b>' + esc(e.navire) + '</b><small>' + esc(e.port) + ' · ' + (QUAI[e.statut] ? 'départ prévu ' + fmtDate(e.etd) : 'arrivée prévue ' + fmtDate(e.eta)) + '</small></div>' + pillFor(e.statut) + '</li>';
      }).join('') || '<li class="live__row"><div><b>Aucune escale en cours</b></div></li>';
    }
  }

  /* ---------- suivi de dossier ---------- */
  function findDossier(q) {
    if (!LSG || !LSG.readDossiers) return null;
    var n = String(q || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!n) return null;
    var list = LSG.readDossiers(), i;
    for (i = 0; i < list.length; i++) if (String(list[i].id).toUpperCase() === n) return list[i];
    var m = n.match(/^(?:LSG-?)?(?:(\d{4})-?)?(\d{3,4})$/);
    if (m) {
      var suffix = ('0' + m[2]).slice(-4);
      for (i = 0; i < list.length; i++) if (String(list[i].id).slice(-4) === suffix && (!m[1] || list[i].id.indexOf(m[1]) > -1)) return list[i];
    }
    return null;
  }
  function renderDossier(d) {
    var steps = LSG.STEPS, cur = Math.max(0, Math.min(steps.length - 1, d.step | 0));
    var histo = d.histo || [];
    var items = steps.map(function (s, i) {
      var h = null;
      histo.forEach(function (x) { if (x.step === i) h = x; });
      var cls = i < cur ? 'done' : (i === cur ? (cur === steps.length - 1 ? 'done' : 'now') : '');
      return '<li class="' + cls + '"' + (i === cur ? ' aria-current="step"' : '') + '><i></i><b>' + esc(s) + '</b>' +
        (h ? '<small>' + fmtDate(h.at) + (h.note ? ' — ' + esc(h.note) : '') + '</small>' : (i > cur ? '<small>À venir</small>' : '')) + '</li>';
    }).join('');
    var done = cur === steps.length - 1;
    var cl = '';
    try { var c = LSG.readClients().filter(function (x) { return x.id === d.client; })[0]; if (c) cl = c.nom; } catch (e) {}
    return '<div class="dos__head"><span class="dos__id">' + esc(d.id) + '</span><span class="pill ' + (done ? 'pill--q' : 'pill--o') + '">' + esc(steps[cur]) + '</span></div>' +
      '<dl class="dos__meta">' +
      '<div><dt>Type</dt><dd>' + esc(d.type) + ' · ' + esc(d.sens) + '</dd></div>' +
      '<div><dt>Trajet</dt><dd>' + esc(d.origine) + ' → ' + esc(d.destination) + '</dd></div>' +
      '<div><dt>Marchandise</dt><dd>' + esc(d.desc) + '</dd></div>' +
      '<div><dt>Agence</dt><dd>' + esc(d.agence) + '</dd></div>' +
      '<div><dt>Titre de transport</dt><dd>' + esc(d.transport || '—') + '</dd></div>' +
      '<div><dt>Arrivée prévue</dt><dd>' + fmtDate(d.eta) + '</dd></div>' +
      (cl ? '<div><dt>Client</dt><dd>' + esc(cl) + '</dd></div>' : '') +
      '</dl><ol class="tl" aria-label="Étapes du dossier">' + items + '</ol>' +
      '<p class="demo-note">Dossier de démonstration. Pour un suivi réel, contactez votre agence LSG.</p>';
  }
  function trackInit(form) {
    var input = $('input', form), out = $(form.getAttribute('data-out'));
    if (!input || !out) return;
    function run(q) {
      if (!String(q).trim()) {
        out.innerHTML = '<div class="notfound" role="alert"><b>Saisissez un numéro de dossier.</b>Exemple : LSG-2026-0412.</div>';
        return;
      }
      var d = findDossier(q);
      out.innerHTML = d ? renderDossier(d) :
        '<div class="notfound" role="alert"><b>Dossier introuvable</b>Aucun dossier ne correspond à « ' + esc(q) + ' ». Vérifiez le numéro (format LSG-2026-0412) ou <a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Bonjour LSG, je cherche le dossier ' + q) + '" target="_blank" rel="noopener">écrivez-nous sur WhatsApp</a>.</div>';
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
    $$('[data-ex]', form.parentNode).forEach(function (b) {
      b.addEventListener('click', function () { input.value = b.getAttribute('data-ex'); run(input.value); });
    });
  }
  $$('form[data-track]').forEach(trackInit);
  window.LSGSite = { findDossier: findDossier, esc: esc };

  /* ---------- tableau des escales ---------- */
  function renderEscales() {
    var body = $('#escales-body');
    if (!body || !LSG) return;
    var filter = 'all', all = (LSG.escales || []).slice();
    var order = { 'Opérations': 0, 'À quai': 1, 'En rade': 2, 'Annoncée': 3, 'Appareillée': 4 };
    all.sort(function (a, b) { return (order[a.statut] - order[b.statut]) || (a.eta < b.eta ? -1 : 1); });
    function draw() {
      var rows = all.filter(function (e) { return filter === 'all' || e.port === filter || e.statut === filter; });
      body.innerHTML = rows.map(function (e) {
        var arm = ''; try { var c = LSG.readClients().filter(function (x) { return x.id === e.armateur; })[0]; if (c) arm = c.nom; } catch (x) {}
        return '<tr><td><b>' + esc(e.navire) + '</b><small>IMO ' + esc(e.imo) + '</small></td><td>' + esc(e.type) + '</td><td>' + esc(e.port) + '</td><td>' + fmtDate(e.eta) + '</td><td>' + fmtDate(e.etd) + '</td><td>' + esc(e.marchandise) + '<small>' + esc(arm) + '</small></td><td>' + pillFor(e.statut) + '</td></tr>';
      }).join('') || '<tr><td colspan="7">Aucune escale pour ce filtre.</td></tr>';
    }
    $$('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-filter');
        $$('[data-filter]').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        draw();
      });
    });
    draw();
  }

  /* ---------- formulaires de devis : mailto + WhatsApp ---------- */
  function formText(form) {
    var lines = [];
    $$('[name]', form).forEach(function (el) {
      var v = (el.value || '').trim();
      if (v) lines.push((el.getAttribute('data-label') || el.name) + ' : ' + v);
    });
    return lines.join('\n');
  }
  $$('form[data-quote]').forEach(function (form) {
    var subject = form.getAttribute('data-subject') || 'Demande de devis';
    var msg = $('.form__msg', form);
    function valid() {
      if (form.checkValidity()) return true;
      form.reportValidity();
      return false;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) return;
      var body = 'Bonjour,\n\n' + formText(form) + '\n\nMerci de me recontacter.';
      window.location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (msg) msg.textContent = 'Votre application de messagerie s\'ouvre avec la demande prête à envoyer.';
    });
    var wa = $('[data-wa]', form);
    if (wa) wa.addEventListener('click', function () {
      if (!valid()) return;
      var text = subject + '\n\n' + formText(form);
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  });

  /* ---------- visionneuse photo ---------- */
  var figs = $$('[data-lightbox]');
  if (figs.length) {
    var lb = doc.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Visionneuse photo');
    lb.innerHTML = '<button type="button" class="lb__x" aria-label="Fermer">' + icon('x') + '</button><button type="button" class="lb__p" aria-label="Photo précédente">' + icon('prev') + '</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="lb__n" aria-label="Photo suivante">' + icon('next') + '</button>';
    doc.body.appendChild(lb);
    var idx = 0, lastFocus = null, limg = $('img', lb), lcap = $('figcaption', lb);
    var show = function (i) {
      idx = (i + figs.length) % figs.length;
      var f = figs[idx], im = $('img', f), cap = $('figcaption', f);
      limg.src = im.getAttribute('src'); limg.alt = im.getAttribute('alt') || '';
      lcap.textContent = (cap ? cap.textContent : '') + (f.getAttribute('data-credit') ? ' · ' + f.getAttribute('data-credit') : '');
    };
    var open = function (i) { lastFocus = doc.activeElement; show(i); lb.classList.add('is-open'); $('.lb__x', lb).focus(); };
    var close = function () { lb.classList.remove('is-open'); if (lastFocus) lastFocus.focus(); };
    figs.forEach(function (f, i) {
      f.setAttribute('tabindex', '0'); f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Agrandir la photo : ' + ($('figcaption', f) ? $('figcaption', f).textContent : ''));
      f.addEventListener('click', function () { open(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    $('.lb__x', lb).addEventListener('click', close);
    $('.lb__p', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb__n', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    doc.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  renderLive();
  renderEscales();
  /* l'espace de gestion peut modifier les dossiers dans un autre onglet */
  window.addEventListener('storage', function () { renderLive(); });
})();
