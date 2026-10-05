/* LSG · Espace de gestion — module « Consignation — escales »
   Escales de navires (Owendo, Port-Gentil) : tableau par onglets, carte des ports, planning de quai (Gantt),
   fiche escale (statuts avançables horodatés, checklist de services, frais d'escale, facture armateur,
   Statement of facts imprimable, notification à l'armateur). Données de démonstration (navires fictifs). */
(function () {
  'use strict';
  var E = window.ERP; if (!E) return;
  var U = E.ui, F = E.fmt, S = E.store, esc = E.esc, sum = E.sum;

  /* ------------------------------------------------------------------ styles propres au module (préfixe .ops-) */
  if (!document.getElementById('ops-css-cs')) {
    var st = document.createElement('style'); st.id = 'ops-css-cs';
    st.textContent =
      '.ops-ports{margin-bottom:16px}' +
      '.ops-port__map{margin:0 16px;border-radius:12px;overflow:hidden;border:1px solid var(--line)}' +
      '.ops-rade{position:relative;padding:34px 14px 14px;background:linear-gradient(180deg,#d9f0fb,#b6e2f6);min-height:84px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}' +
      '.ops-quai{position:relative;padding:34px 14px 14px;background:repeating-linear-gradient(90deg,#eef2f6 0 24px,#e6ebf1 24px 25px);border-top:5px solid var(--navy-2);min-height:84px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}' +
      '.ops-zone{position:absolute;left:12px;top:9px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--navy-2);opacity:.75}' +
      '.ops-free{font-size:12px;color:var(--ink-3);align-self:center}' +
      '.ops-ship{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--c,#94a3b8);border-radius:9px;padding:6px 10px;color:var(--ink);box-shadow:0 1px 3px rgba(13,27,42,.1);max-width:100%;transition:transform .1s}' +
      '.ops-ship:hover{transform:translateY(-1px);border-color:var(--c,#94a3b8)}' +
      '.ops-ship svg{width:16px;height:16px;color:var(--c,#94a3b8);flex:none}' +
      '.ops-ship b{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.ops-ship i{font-style:normal;font-size:11px;color:var(--ink-3);white-space:nowrap}' +
      '.ops-att{padding:12px 16px 14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
      '.ops-att>span{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3);margin-right:4px}' +
      '.ops-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);padding:0 16px 14px}' +
      '.ops-legend span{display:inline-flex;align-items:center;gap:5px}.ops-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}' +
      '.ops-big{display:flex;gap:14px;align-items:center;flex-wrap:wrap}' +
      '.ops-big__ic{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:var(--navy);color:#fff;flex:none}.ops-big__ic svg{width:26px}' +
      '.ops-big h2{font-size:21px;margin:0}.ops-big .sub{color:var(--ink-3);font-size:12.5px}' +
      '.ops-acts{display:flex;gap:8px;flex-wrap:wrap}' +
      '.ops-check{display:flex;align-items:center;gap:10px;padding:9px 18px;border-bottom:1px solid var(--line-2);cursor:pointer;font-size:13px}' +
      '.ops-check:last-child{border-bottom:0}.ops-check input{width:17px;height:17px;accent-color:var(--green);flex:none}' +
      '.ops-check.is-on span{color:var(--ink-3);text-decoration:line-through}' +
      '.ops-frais{width:100%;border-collapse:collapse;font-size:12.5px}' +
      '.ops-frais th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-3);padding:6px 6px;font-weight:600}' +
      '.ops-frais td{padding:4px 4px;vertical-align:middle}.ops-frais .input{padding:6px 8px;font-size:12.5px}' +
      '.ops-frais td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}' +
      '.ops-frais tfoot td{border-top:2px solid var(--navy);font-weight:700;padding-top:9px}' +
      '.ops-doc table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12.5px}' +
      '.ops-doc th,.ops-doc td{border:1px solid #cfd8e3;padding:6px 9px;text-align:left;vertical-align:top}' +
      '.ops-doc th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.04em}' +
      '.ops-doc h5{font-size:13px;margin:14px 0 2px;color:var(--navy);text-transform:uppercase;letter-spacing:.05em}' +
      '.ops-doc .ops-logo{background:#fff;border:1px solid #e3e8ef;border-radius:8px;padding:4px 8px;display:inline-block}' +
      '.ops-sign{display:flex;gap:30px;margin-top:26px;flex-wrap:wrap}.ops-sign>div{flex:1;min-width:150px;font-size:12px}.ops-sign i{display:block;border-bottom:1px solid #6b7a90;height:46px}' +
      '.ops-msg{white-space:pre-wrap}' +
      '@media (max-width:640px){.ops-big h2{font-size:18px}.ops-acts .btn{flex:1 1 140px}.ops-frais .hide-m{display:none}.ops-port__map{margin:0 12px}}' +
      '@media print{body.ops-print>*:not(.modal-back){display:none!important}body.ops-print .modal-back{display:block!important;position:static!important;background:none!important;padding:0!important}body.ops-print .modal{box-shadow:none!important;max-height:none!important;width:100%!important;max-width:none!important;border-radius:0!important}body.ops-print .modal__b{overflow:visible!important;max-height:none!important}body.ops-print .modal__h,body.ops-print .modal__f{display:none!important}body.ops-print .doc{border:0;padding:0}}';
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------------ référentiels */
  var CYCLE = ['Annoncée', 'En rade', 'À quai', 'Opérations', 'Appareillée'];
  var TONE = { 'Annoncée': 'grey', 'En rade': 'orange', 'À quai': 'violet', 'Opérations': 'navy', 'Appareillée': 'green' };
  var COL = { 'Annoncée': '#94a3b8', 'En rade': '#e8780c', 'À quai': '#7c3aed', 'Opérations': '#0b5a86', 'Appareillée': '#1e9e4a' };
  var PROG = { 'Annoncée': 0, 'En rade': 25, 'À quai': 50, 'Opérations': 75, 'Appareillée': 100 };
  var PORTS = ['Owendo', 'Port-Gentil'];
  var TYPES = ['Pétrolier', 'Gazier', 'Porte-conteneurs', 'Cargo'];
  var SERVICES = ['Déclaration d\'arrivée', 'Pilotage', 'Remorquage', 'Avitaillement', 'Manutention', 'Formalités douanières', 'Assistance équipage', 'Déclaration de départ'];
  var ONQUAY = ['À quai', 'Opérations'];
  var TABS = [
    { k: 'avenir', l: 'À venir', f: function (e) { return e.statut === 'Annoncée' || e.statut === 'En rade'; } },
    { k: 'cours', l: 'En cours', f: function (e) { return ONQUAY.indexOf(e.statut) >= 0; } },
    { k: 'terminees', l: 'Terminées', f: function (e) { return e.statut === 'Appareillée'; } },
    { k: 'toutes', l: 'Toutes', f: function () { return true; } }
  ];
  var state = { tab: 'cours', port: '', q: '' };

  /* ------------------------------------------------------------------ utilitaires */
  function pad(n) { return String(n).padStart(2, '0'); }
  function user() { var u = E.session.user(); return u ? u.name : 'Système'; }
  function nowLocal() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function tone(s) { return TONE[s] || 'grey'; }
  function badge(s) { return U.badge(s, tone(s)); }
  function client(id) { return S.get('clients', id); }
  function clientNom(id) { var c = client(id); return c ? c.nom : id || '—'; }
  function escales() { return S.all('escales'); }
  function onQuay(e) { return ONQUAY.indexOf(e.statut) >= 0; }
  function repaint() { var y = window.pageYOffset || 0; E.rerender(); window.scrollTo(0, y); }
  function lignes(e) { return e.lignes || []; }
  function fraisOf(e) { return e.lignes && e.lignes.length ? sum(e.lignes, function (l) { return (+l.qte || 0) * (+l.pu || 0); }) : (+e.frais || 0); }
  function monthKey(d) { return String(d || '').slice(0, 7); }
  function sejourJ(e) { return Math.max(0, E.daysBetween(e.eta, e.etd)); }

  /* Complète une escale du jeu d'exemple : historique des statuts et lignes de frais */
  function prep(e) {
    var dirty = false;
    if (!e.histo || !e.histo.length) {
      var idx = Math.max(0, CYCLE.indexOf(e.statut)), h = [{ statut: 'Annoncée', at: new Date(E.parseDate(e.eta).getTime() - 2 * 864e5 + 8 * 36e5).toISOString(), by: 'Pôle Consignation', note: 'Escale annoncée par l\'armateur.' }];
      if (idx > 0) h.push({ statut: e.statut, at: new Date(E.parseDate(e.eta).getTime() + 8 * 36e5).toISOString(), by: 'Pôle Consignation', note: 'Statut enregistré à la reprise du dossier.' });
      e.histo = h; dirty = true;
    }
    if (!e.lignes) {
      var tot = +e.frais || 0, parts = [['Pilotage', .12], ['Remorquage / lamanage', .18], ['Droits et débours portuaires', .4], ['Manutention et formalités', .18]], acc = 0;
      e.lignes = [];
      if (tot > 0) {
        parts.forEach(function (p) { var v = Math.round(tot * p[1] / 1000) * 1000; acc += v; e.lignes.push({ l: p[0], qte: 1, pu: v }); });
        e.lignes.push({ l: 'Honoraires de consignation', qte: 1, pu: tot - acc });
      }
      dirty = true;
    }
    if (!e.services) { e.services = []; dirty = true; }
    return dirty;
  }
  function seed() { return { escales: E.clone(window.LSG.escales) }; }
  function init() { var d = false; escales().forEach(function (e) { if (prep(e)) d = true; }); if (d) S.save(); }

  /* ------------------------------------------------------------------ calculs */
  function filtered() {
    var q = E.norm(state.q).trim();
    return escales().filter(function (e) {
      return (!state.port || e.port === state.port) && (!q || E.norm([e.id, e.navire, e.imo, e.type, e.marchandise, clientNom(e.armateur)].join(' ')).indexOf(q) >= 0);
    });
  }
  function kpis() {
    var all = escales(), t = E.today(), lim = E.addDays(t, 7), mk = monthKey(t);
    var quai = all.filter(onQuay), rade = all.filter(function (e) { return e.statut === 'En rade'; });
    var att = all.filter(function (e) { return e.statut === 'Annoncée' && e.eta <= lim; });
    var mois = all.filter(function (e) { return monthKey(e.eta) === mk; });
    return { quai: quai, rade: rade, att: att, mois: mois, frais: sum(mois, fraisOf) };
  }

  /* ------------------------------------------------------------------ vue principale */
  function render(view, params) {
    var p0 = params[0];
    if (p0) {
      var e = S.get('escales', p0);
      if (e) { prep(e); return renderDetail(view, e); }
      view.innerHTML = '<div class="card"><div class="empty">' + E.icon('alert') + '<div>Escale « ' + esc(p0) + ' » introuvable.</div><a class="btn" style="margin-top:12px" href="#/consignation">Retour aux escales</a></div></div>';
      return;
    }
    var k = kpis();
    view.innerHTML =
      '<div class="row" style="margin-bottom:14px"><div class="section-title" style="margin:0"><h2>Escales de navires</h2><p>Owendo · Port-Gentil — données de démonstration</p></div><span class="spacer"></span>' +
        '<button class="btn" id="cs-csv">' + E.icon('download') + 'Export CSV</button><button class="btn primary" id="cs-new">' + E.icon('plus') + 'Nouvelle escale</button></div>' +
      '<div class="grid g4" style="margin-bottom:16px">' +
        U.kpi({ label: 'Navires à quai', value: k.quai.length, icon: 'ship', tone: 'violet', foot: k.rade.length + ' en rade en attente de poste' }) +
        U.kpi({ label: 'Attendus sous 7 jours', value: k.att.length, icon: 'calendar', tone: 'blue', foot: 'escales annoncées' }) +
        U.kpi({ label: 'Frais d\'escale du mois', value: F.short(k.frais), unit: 'FCFA', icon: 'money', tone: 'green', foot: F.money(k.frais) }) +
        U.kpi({ label: 'Escales du mois', value: k.mois.length, icon: 'flag', tone: 'orange', foot: F.month(E.today()) }) +
      '</div>' +
      '<div class="grid g2 keep-1 ops-ports">' + PORTS.map(portCard).join('') + '</div>' +
      '<div class="card" style="margin-bottom:16px"><div class="card__h"><h3>Planning d\'occupation des quais</h3><span class="sub">ETA → ETD par navire · cliquez sur une barre pour ouvrir l\'escale</span></div>' + ganttHTML() + '</div>' +
      '<div class="card"><div class="card__h"><h3>Tableau des escales</h3><span class="spacer"></span>' +
        '<select class="select" id="cs-port" style="width:auto"><option value="">Tous les ports</option>' + PORTS.map(function (p) { return '<option' + (state.port === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
        '<input class="input" id="cs-q" type="search" placeholder="Navire, IMO, armateur…" value="' + esc(state.q) + '" style="width:220px;max-width:100%"></div>' +
        '<div style="padding:0 18px" id="cs-lt"></div></div>';
    view.querySelector('#cs-new').onclick = function () { escaleForm(null); };
    view.querySelector('#cs-csv').onclick = exportList;
    view.querySelector('#cs-port').onchange = function (ev) { state.port = ev.target.value; paintList(view); };
    view.querySelector('#cs-q').addEventListener('input', function (ev) { state.q = ev.target.value; paintList(view); });
    paintList(view);
  }

  function pill(e) {
    return '<a class="ops-ship" style="--c:' + COL[e.statut] + '" href="#/consignation/' + e.id + '" title="' + esc(e.navire + ' · ' + e.statut + ' · ' + F.dateShort(e.eta) + ' → ' + F.dateShort(e.etd)) + '">' + E.icon('ship') + '<b>' + esc(e.navire) + '</b><i>' + (e.statut === 'Annoncée' ? 'ETA ' + F.dateShort(e.eta) : esc(e.statut)) + '</i></a>';
  }
  function portCard(port) {
    var l = escales().filter(function (e) { return e.port === port; });
    var quai = l.filter(onQuay), rade = l.filter(function (e) { return e.statut === 'En rade'; });
    var att = l.filter(function (e) { return e.statut === 'Annoncée'; }).sort(function (a, b) { return a.eta < b.eta ? -1 : 1; });
    return '<div class="card"><div class="card__h"><div class="list__icon tone-blue">' + E.icon('pin') + '</div><h3>' + esc(port) + '</h3><span class="spacer"></span>' +
      U.badge(quai.length + ' à quai', 'violet') + U.badge(rade.length + ' en rade', 'orange') + U.badge(att.length + ' attendu' + (att.length > 1 ? 's' : ''), 'grey') + '</div>' +
      '<div style="padding-top:14px"><div class="ops-port__map">' +
        '<div class="ops-rade"><span class="ops-zone">Rade</span>' + (rade.length ? rade.map(pill).join('') : '<span class="ops-free">Aucun navire en rade</span>') + '</div>' +
        '<div class="ops-quai"><span class="ops-zone">Quai</span>' + (quai.length ? quai.map(pill).join('') : '<span class="ops-free">Quai libre</span>') + '</div></div></div>' +
      '<div class="ops-att"><span>Attendus</span>' + (att.length ? att.map(pill).join('') : '<span class="ops-free">Aucune arrivée annoncée</span>') + '</div></div>';
  }

  function ganttHTML() {
    var l = escales().filter(function (e) { return e.etd >= E.addDays(E.today(), -10); });
    if (!l.length) return '<div class="empty">Aucune escale à planifier.</div>';
    l.sort(function (a, b) { return a.port === b.port ? (a.eta < b.eta ? -1 : 1) : (a.port < b.port ? -1 : 1); });
    var from = l.reduce(function (m, e) { return e.eta < m ? e.eta : m; }, l[0].eta), to = l.reduce(function (m, e) { return e.etd > m ? e.etd : m; }, l[0].etd);
    from = E.addDays(from, -1); to = E.addDays(to, 3);
    var rows = l.map(function (e) {
      return { label: e.navire, sub: e.port + ' · ' + e.statut, start: e.eta, end: e.etd, progress: PROG[e.statut] || 0, cls: e.statut === 'En rade' ? 'warn' : undefined, onClick: function () { E.go('consignation/' + e.id); } };
    });
    return U.gantt({ title: 'Navire · port', rows: rows, from: from, to: to, unit: 'day', minWidth: 760 });
  }

  function paintList(view) {
    var base = filtered(), el = view.querySelector('#cs-lt'); if (!el) return;
    var tab = TABS.filter(function (t) { return t.k === state.tab; })[0] || TABS[0];
    var list = base.filter(tab.f).sort(function (a, b) { return tab.k === 'terminees' || tab.k === 'toutes' ? (a.eta < b.eta ? 1 : -1) : (a.eta < b.eta ? -1 : 1); });
    var cols = listCols();
    el.innerHTML = U.tabs(TABS.map(function (t) { return { k: t.k, l: t.l, n: base.filter(t.f).length }; }), state.tab, function (k) { state.tab = k; paintList(view); }) +
      '<div style="margin:0 -18px">' + U.table(cols, list, { onRow: function (e) { E.go('consignation/' + e.id); }, empty: 'Aucune escale pour ce filtre' }) + '</div>';
    E.$$('[data-adv]', el).forEach(function (b) { b.onclick = function () { var e = S.get('escales', b.dataset.adv); if (e) advanceForm(e); }; });
  }
  function listCols() {
    return [
      { key: 'id', label: 'Escale', render: function (e) { return '<span class="mono">' + esc(e.id) + '</span>'; } },
      { key: 'navire', label: 'Navire', render: function (e) { return '<b>' + esc(e.navire) + '</b><div class="small muted">' + esc(e.type) + ' · IMO ' + esc(e.imo) + '</div>'; }, csv: function (e) { return e.navire; } },
      { key: 'armateur', label: 'Armateur', render: function (e) { return esc(clientNom(e.armateur)); }, csv: function (e) { return clientNom(e.armateur); } },
      { key: 'port', label: 'Port' },
      { key: 'eta', label: 'ETA', render: function (e) { return '<span class="nowrap">' + F.dateShort(e.eta) + '</span>'; }, csv: function (e) { return e.eta; } },
      { key: 'etd', label: 'ETD', render: function (e) { return '<span class="nowrap">' + F.dateShort(e.etd) + '</span>'; }, csv: function (e) { return e.etd; } },
      { key: 'statut', label: 'Statut', render: function (e) { return badge(e.statut); } },
      { key: 'frais', label: 'Frais', num: 1, render: function (e) { return F.money(fraisOf(e)); }, csv: function (e) { return fraisOf(e); } },
      { key: 'act', label: 'Action', render: function (e) { var n = CYCLE[CYCLE.indexOf(e.statut) + 1]; return n ? '<button class="btn sm" data-adv="' + e.id + '">' + E.icon('arrow') + esc(n) + '</button>' : '<span class="muted small">Terminée</span>'; }, csv: function () { return ''; } }
    ];
  }
  function exportList() {
    var list = filtered().sort(function (a, b) { return a.eta < b.eta ? 1 : -1; });
    var cols = listCols().slice(0, 8).concat([{ key: 'marchandise', label: 'Marchandise' }, { key: 'tonnage', label: 'Tonnage (t)' }, { key: 'tirant', label: 'Tirant d\'eau (m)' }]);
    U.exportCSV('escales-lsg-' + E.today(), cols, list);
    E.log('Export CSV des escales', list.length + ' ligne(s)');
  }

  /* ------------------------------------------------------------------ création / modification */
  function escaleForm(e) {
    var edit = !!e;
    U.formModal({
      title: edit ? 'Modifier l\'escale ' + e.id : 'Nouvelle escale', sub: edit ? esc(e.navire) : 'Annonce d\'un navire — statut initial « Annoncée »', size: 'lg',
      okLabel: edit ? 'Enregistrer' : 'Créer l\'escale',
      values: edit ? e : { port: 'Owendo', type: 'Cargo', eta: E.addDays(E.today(), 3), etd: E.addDays(E.today(), 6) },
      fields: [
        { name: 'navire', label: 'Nom du navire', required: true, placeholder: 'MV Exemple …' },
        { name: 'imo', label: 'N° IMO', placeholder: '7 chiffres' },
        { name: 'type', label: 'Type de navire', type: 'select', options: TYPES },
        { name: 'armateur', label: 'Armateur (client)', type: 'select', options: E.options('clients', 'nom'), required: true },
        { name: 'port', label: 'Port', type: 'select', options: PORTS },
        { name: 'marchandise', label: 'Marchandise / opérations prévues', placeholder: 'Ex. brut — chargement' },
        { name: 'eta', label: 'ETA (arrivée prévue)', type: 'date', required: true },
        { name: 'etd', label: 'ETD (départ prévu)', type: 'date', required: true },
        { name: 'tonnage', label: 'Tonnage (t)', type: 'number', min: 0 },
        { name: 'tirant', label: 'Tirant d\'eau (m)', type: 'number', step: '0.1', min: 0 }
      ].concat(edit ? [] : [{ name: 'frais', label: 'Frais d\'escale estimés (FCFA)', type: 'money', min: 0, help: 'Optionnel — ventilé ensuite en lignes éditables.' }]),
      onSubmit: function (v) {
        if (v.etd < v.eta) { U.toast('L\'ETD doit être postérieure ou égale à l\'ETA.', 'err'); return false; }
        if (edit) {
          S.update('escales', e.id, { navire: v.navire, imo: v.imo, type: v.type, armateur: v.armateur, port: v.port, marchandise: v.marchandise, eta: v.eta, etd: v.etd, tonnage: +v.tonnage || 0, tirant: +v.tirant || 0 });
          E.log('Escale modifiée ' + e.id, v.navire); U.toast('Escale mise à jour'); repaint();
        } else {
          var n = { id: S.next('ESC'), navire: v.navire, imo: v.imo, armateur: v.armateur, type: v.type, port: v.port, eta: v.eta, etd: v.etd, statut: 'Annoncée', marchandise: v.marchandise, tonnage: +v.tonnage || 0, tirant: +v.tirant || 0, services: ['Déclaration d\'arrivée'], frais: +v.frais || 0 };
          prep(n); n.histo[0].by = user(); n.histo[0].at = new Date().toISOString(); n.histo[0].note = 'Escale créée dans l\'espace de gestion.';
          S.add('escales', n, 'ESC');
          E.log('Escale créée ' + n.id, n.navire + ' — ' + n.port); E.notify('Escale annoncée', n.navire + ' — ' + n.port + ' · ETA ' + F.dateShort(n.eta), '#/consignation/' + n.id, 'violet');
          U.toast('Escale ' + n.id + ' créée'); E.go('consignation/' + n.id);
        }
      }
    });
  }

  /* ------------------------------------------------------------------ statuts */
  function advanceForm(e) {
    var i = CYCLE.indexOf(e.statut), next = CYCLE[i + 1]; if (!next) { U.toast('Cette escale est déjà appareillée.', 'warn'); return; }
    U.formModal({
      title: 'Passer l\'escale en « ' + next + ' »', sub: esc(e.navire) + ' · ' + esc(e.port), size: 'sm', okLabel: 'Valider le statut',
      values: { at: nowLocal() },
      fields: [{ name: 'at', label: 'Date et heure constatées', type: 'datetime-local', required: true, full: true }, { name: 'note', label: 'Observation (optionnel)', type: 'textarea', full: true, placeholder: 'Ex. poste n° 3, pilote à bord…' }],
      onSubmit: function (v) {
        var d = new Date(v.at); if (isNaN(d)) { U.toast('Date invalide.', 'err'); return false; }
        var cur = S.get('escales', e.id); cur.histo = cur.histo || [];
        cur.histo.push({ statut: next, at: d.toISOString(), by: user(), note: v.note || '' });
        cur.statut = next;
        if (next === 'Appareillée' && cur.services.indexOf('Déclaration de départ') < 0) cur.services.push('Déclaration de départ');
        if (next === 'En rade' && cur.services.indexOf('Déclaration d\'arrivée') < 0) cur.services.push('Déclaration d\'arrivée');
        S.save();
        E.log('Escale ' + e.id + ' : ' + next, e.navire + (v.note ? ' — ' + v.note : ''));
        E.notify('Escale ' + next.toLowerCase(), e.navire + ' — ' + e.port, '#/consignation/' + e.id, tone(next) === 'grey' ? 'blue' : tone(next) === 'navy' ? 'blue' : tone(next));
        U.toast(e.navire + ' : ' + next); repaint();
      }
    });
  }
  function revertStatus(e) {
    var i = CYCLE.indexOf(e.statut); if (i <= 0) return;
    U.confirm('Revenir à l\'étape précédente', 'L\'escale <b>' + esc(e.navire) + '</b> repassera au statut « ' + esc(CYCLE[i - 1]) + ' ». L\'opération sera tracée dans l\'historique.', 'Revenir en arrière', function () {
      e.histo.push({ statut: CYCLE[i - 1], at: new Date().toISOString(), by: user(), note: 'Retour arrière (correction de saisie).' });
      e.statut = CYCLE[i - 1]; S.save(); E.log('Escale ' + e.id + ' : retour à ' + e.statut, e.navire); U.toast('Statut corrigé : ' + e.statut); repaint();
    }, 'danger');
  }

  /* ------------------------------------------------------------------ fiche escale */
  function renderDetail(view, e) {
    var idx = Math.max(0, CYCLE.indexOf(e.statut)), next = CYCLE[idx + 1], total = fraisOf(e), fac = e.facture ? S.get('factures', e.facture) : null;
    var done = SERVICES.filter(function (s) { return e.services.indexOf(s) >= 0; }).length;
    var autres = e.services.filter(function (s) { return SERVICES.indexOf(s) < 0; });
    view.innerHTML =
      '<div class="row" style="margin-bottom:14px"><a class="btn ghost" href="#/consignation">' + E.icon('back') + 'Toutes les escales</a></div>' +
      '<div class="card" style="margin-bottom:16px"><div class="card__b stack">' +
        '<div class="ops-big"><div class="ops-big__ic">' + E.icon('ship') + '</div><div style="flex:1;min-width:200px"><h2>' + esc(e.navire) + '</h2><div class="sub"><span class="mono">' + esc(e.id) + '</span> · ' + esc(e.type) + ' · ' + esc(e.port) + ' · armateur ' + esc(clientNom(e.armateur)) + '</div></div>' + badge(e.statut) + '</div>' +
        U.steps(CYCLE, idx, { finished: idx === CYCLE.length - 1 }) +
        '<div class="ops-acts">' +
          (next ? '<button class="btn primary" id="d-adv">' + E.icon('arrow') + 'Passer en « ' + esc(next) + ' »</button>' : '') +
          (idx > 0 ? '<button class="btn" id="d-rev">' + E.icon('back') + 'Étape précédente</button>' : '') +
          '<button class="btn" id="d-sof">' + E.icon('print') + 'Statement of facts</button>' +
          '<button class="btn" id="d-notif">' + E.icon('send') + 'Notifier l\'armateur</button>' +
          (fac ? '<button class="btn accent" id="d-fac">' + E.icon('invoice') + 'Voir la facture ' + esc(fac.id) + '</button>' : '<button class="btn accent" id="d-fac">' + E.icon('invoice') + 'Créer la facture armateur</button>') +
          '<button class="btn" id="d-edit">' + E.icon('edit') + 'Modifier</button>' +
          '<button class="btn danger" id="d-del">' + E.icon('trash') + 'Supprimer</button>' +
        '</div></div></div>' +
      '<div class="grid g-2-1">' +
        '<div class="stack">' +
          '<div class="card"><div class="card__h"><h3>Navire et escale</h3></div><div class="card__b"><dl class="kv">' +
            '<dt>Navire</dt><dd><b>' + esc(e.navire) + '</b></dd><dt>N° IMO</dt><dd class="mono">' + esc(e.imo || '—') + '</dd><dt>Type</dt><dd>' + esc(e.type) + '</dd>' +
            '<dt>Tonnage</dt><dd>' + (e.tonnage ? F.num(e.tonnage) + ' t' : '—') + '</dd><dt>Tirant d\'eau</dt><dd>' + (e.tirant ? F.num(e.tirant, 1) + ' m' : '—') + '</dd>' +
            '<dt>Armateur</dt><dd>' + esc(clientNom(e.armateur)) + (client(e.armateur) && client(e.armateur).contact ? '<div class="small muted">' + esc(client(e.armateur).contact) + '</div>' : '') + '</dd>' +
            '<dt>Port</dt><dd>' + esc(e.port) + '</dd><dt>ETA</dt><dd>' + F.date(e.eta) + '</dd><dt>ETD</dt><dd>' + F.date(e.etd) + ' <span class="muted small">(séjour prévu ' + sejourJ(e) + ' j)</span></dd>' +
            '<dt>Marchandise</dt><dd>' + esc(e.marchandise || '—') + '</dd></dl></div></div>' +
          '<div class="card"><div class="card__h"><h3>Suivi des statuts</h3><span class="sub">horodatage et responsable de chaque étape</span></div><div class="card__b"><div class="timeline">' +
            e.histo.map(function (h, i) { return '<div class="tl-item ' + (i === e.histo.length - 1 ? (e.statut === 'Appareillée' ? 'done' : 'current') : 'done') + '"><b>' + esc(h.statut) + '</b><span>' + F.datetime(h.at) + ' · ' + esc(h.by || '') + (h.note ? '<br>' + esc(h.note) : '') + '</span></div>'; }).join('') + '</div></div></div>' +
        '</div>' +
        '<div class="stack">' +
          '<div class="card"><div class="card__h"><h3>Services de l\'escale</h3><span class="spacer"></span>' + U.badge(done + ' / ' + SERVICES.length, done === SERVICES.length ? 'green' : 'blue') + '</div>' +
            '<div class="card__b" style="padding-bottom:6px">' + U.progress(done / SERVICES.length * 100) + '</div><div id="d-checks">' +
            SERVICES.concat(autres).map(function (s) { var on = e.services.indexOf(s) >= 0; return '<label class="ops-check' + (on ? ' is-on' : '') + '"><input type="checkbox" data-svc="' + esc(s) + '"' + (on ? ' checked' : '') + '><span>' + esc(s) + '</span></label>'; }).join('') + '</div></div>' +
          '<div class="card"><div class="card__h"><h3>Frais d\'escale</h3><span class="sub">débours et honoraires</span></div><div class="card__b" id="d-frais">' + fraisHTML(e, total) + '</div></div>' +
        '</div></div>';
    wireDetail(view, e);
  }
  function fraisHTML(e, total) {
    var rows = lignes(e).map(function (l, i) {
      return '<tr data-i="' + i + '"><td><input class="input" data-f="l" value="' + esc(l.l) + '" aria-label="Libellé"></td><td style="width:54px"><input class="input" data-f="qte" type="number" min="0" step="any" value="' + esc(l.qte) + '" aria-label="Quantité"></td><td style="width:104px"><input class="input" data-f="pu" type="number" min="0" step="any" value="' + esc(l.pu) + '" aria-label="Prix unitaire"></td><td class="num hide-m" data-t>' + F.num((+l.qte || 0) * (+l.pu || 0)) + '</td><td style="width:30px"><button class="btn sm ghost icon" data-del="' + i + '" title="Supprimer la ligne" aria-label="Supprimer la ligne">' + E.icon('x') + '</button></td></tr>';
    }).join('');
    return '<table class="ops-frais"><thead><tr><th>Libellé</th><th>Qté</th><th>P.U. (FCFA)</th><th class="hide-m num">Montant</th><th></th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="muted small" style="padding:10px 4px">Aucune ligne de frais. Ajoutez des débours ou des honoraires.</td></tr>') + '</tbody>' +
      '<tfoot><tr><td colspan="3">Total des frais d\'escale</td><td class="num" colspan="2" id="d-total">' + F.money(total) + '</td></tr></tfoot></table>' +
      '<div class="row" style="margin-top:10px"><button class="btn sm" id="d-addl">' + E.icon('plus') + 'Ajouter une ligne</button></div>';
  }
  function wireDetail(view, e) {
    var $ = function (s) { return view.querySelector(s); };
    var b;
    if ((b = $('#d-adv'))) b.onclick = function () { advanceForm(e); };
    if ((b = $('#d-rev'))) b.onclick = function () { revertStatus(e); };
    $('#d-sof').onclick = function () { sofModal(e); };
    $('#d-notif').onclick = function () { notifyForm(e); };
    $('#d-fac').onclick = function () { factureAction(e); };
    $('#d-edit').onclick = function () { escaleForm(e); };
    $('#d-del').onclick = function () {
      U.confirm('Supprimer l\'escale', 'L\'escale <b>' + esc(e.navire) + '</b> (' + esc(e.id) + ') sera supprimée définitivement de la démonstration. Une facture déjà créée n\'est pas supprimée.', 'Supprimer', function () { S.remove('escales', e.id); E.log('Escale supprimée ' + e.id, e.navire); U.toast('Escale supprimée'); E.go('consignation'); }, 'danger');
    };
    E.$$('[data-svc]', view).forEach(function (c) {
      c.onchange = function () {
        var s = c.dataset.svc, i = e.services.indexOf(s);
        if (c.checked && i < 0) e.services.push(s); else if (!c.checked && i >= 0) e.services.splice(i, 1);
        S.save(); E.log('Service ' + (c.checked ? 'réalisé' : 'décoché') + ' · ' + e.id, s + ' — ' + e.navire); repaint();
      };
    });
    var fr = $('#d-frais');
    function sync() {
      var ls = [];
      E.$$('tbody tr[data-i]', fr).forEach(function (tr) {
        var o = { l: tr.querySelector('[data-f=l]').value, qte: +tr.querySelector('[data-f=qte]').value || 0, pu: +tr.querySelector('[data-f=pu]').value || 0 };
        tr.querySelector('[data-t]').textContent = F.num(o.qte * o.pu); ls.push(o);
      });
      e.lignes = ls; e.frais = fraisOf(e); S.save();
      $('#d-total').textContent = F.money(e.frais);
    }
    fr.addEventListener('change', function (ev) { if (ev.target.matches('[data-f]')) { sync(); E.log('Frais d\'escale modifiés · ' + e.id, F.money(e.frais)); } });
    fr.addEventListener('input', function (ev) { if (ev.target.matches('[data-f]')) sync(); });
    fr.addEventListener('click', function (ev) {
      var d = ev.target.closest('[data-del]'), a = ev.target.closest('#d-addl');
      if (d) { sync(); e.lignes.splice(+d.dataset.del, 1); e.frais = fraisOf(e); S.save(); E.log('Ligne de frais supprimée · ' + e.id, e.navire); repaint(); }
      if (a) { sync(); e.lignes.push({ l: 'Nouvelle prestation', qte: 1, pu: 0 }); S.save(); repaint(); }
    });
  }

  /* ------------------------------------------------------------------ facture armateur */
  function factureAction(e) {
    var fac = e.facture ? S.get('factures', e.facture) : null;
    if (fac) { E.go('facturation/' + fac.id); return; }
    var ls = lignes(e).filter(function (l) { return (+l.qte || 0) * (+l.pu || 0) > 0; });
    if (!ls.length) { U.toast('Ajoutez au moins une ligne de frais avec un montant avant de facturer.', 'warn'); return; }
    var c = client(e.armateur), total = sum(ls, function (l) { return l.qte * l.pu; });
    U.confirm('Créer la facture armateur', 'Une facture de <b>' + F.money(total) + '</b> sera émise à <b>' + esc(clientNom(e.armateur)) + '</b> pour l\'escale ' + esc(e.id) + ' (' + ls.length + ' ligne(s)), puis ouverte dans le module Facturation.', 'Créer la facture', function () {
      var dos = S.all('dossiers').filter(function (d) { return String(d.transport || '').indexOf(e.id) >= 0; })[0];
      var f = { id: S.next('FAC'), client: e.armateur, dossier: dos ? dos.id : '', date: E.today(), echeance: E.addDays(E.today(), c && c.delai ? c.delai : 15), paye: 0, total: total, escale: e.id, lignes: ls.map(function (l) { return { l: l.l + ' — ' + e.navire, qte: +l.qte, pu: +l.pu }; }) };
      S.add('factures', f, 'FAC');
      e.facture = f.id; S.save();
      if (dos) { S.update('dossiers', dos.id, { facture: f.id }); }
      E.log('Facture armateur créée ' + f.id, e.id + ' — ' + F.money(total));
      E.notify('Facture armateur créée', f.id + ' · ' + clientNom(e.armateur) + ' · ' + F.money(total), '#/facturation/' + f.id, 'green');
      U.toast('Facture ' + f.id + ' créée'); E.go('facturation/' + f.id);
    });
  }

  /* ------------------------------------------------------------------ Statement of facts */
  function sofModal(e) {
    var c = client(e.armateur), fr = fraisOf(e);
    var html = '<div class="doc ops-doc"><div class="doc__head"><div><span class="ops-logo"><img src="../assets/img/logo.png" alt="LSG" style="height:40px;display:block"></span><div class="small muted" style="margin-top:6px">Logistique Services Gabon — BP 217 Zone Fret Aéroportuaire, Libreville<br>+241 11 44 27 27 · info.lsg@lsg-gabon.com</div></div>' +
      '<div style="text-align:right"><h4>Statement of facts</h4><div>Fiche d\'escale n° <b class="mono">' + esc(e.id) + '</b></div><div class="small muted">Édité le ' + F.date(E.today()) + '</div></div></div>' +
      '<h5>Navire</h5><table><tr><th style="width:22%">Navire</th><td>' + esc(e.navire) + '</td><th style="width:18%">N° IMO</th><td>' + esc(e.imo || '—') + '</td></tr>' +
      '<tr><th>Type</th><td>' + esc(e.type) + '</td><th>Tonnage</th><td>' + (e.tonnage ? F.num(e.tonnage) + ' t' : '—') + '</td></tr>' +
      '<tr><th>Tirant d\'eau</th><td>' + (e.tirant ? F.num(e.tirant, 1) + ' m' : '—') + '</td><th>Port</th><td>' + esc(e.port) + '</td></tr>' +
      '<tr><th>Armateur</th><td colspan="3">' + esc(clientNom(e.armateur)) + (c && c.contact ? ' — ' + esc(c.contact) : '') + '</td></tr>' +
      '<tr><th>ETA / ETD prévues</th><td colspan="3">' + F.date(e.eta) + ' → ' + F.date(e.etd) + '</td></tr>' +
      '<tr><th>Marchandise</th><td colspan="3">' + esc(e.marchandise || '—') + '</td></tr></table>' +
      '<h5>Chronologie des événements</h5><table><tr><th style="width:28%">Date et heure</th><th style="width:22%">Événement</th><th>Observation</th></tr>' +
      e.histo.map(function (h) { return '<tr><td>' + F.datetime(h.at) + '</td><td>' + esc(h.statut) + '</td><td>' + esc(h.note || '') + '</td></tr>'; }).join('') + '</table>' +
      '<h5>Services réalisés</h5><table><tr><th>Service</th><th style="width:18%">Réalisé</th></tr>' +
      SERVICES.map(function (s) { return '<tr><td>' + esc(s) + '</td><td>' + (e.services.indexOf(s) >= 0 ? 'Oui' : 'Non') + '</td></tr>'; }).join('') + '</table>' +
      '<h5>Frais d\'escale</h5><table><tr><th>Libellé</th><th style="width:10%">Qté</th><th style="width:20%">P.U. (FCFA)</th><th style="width:22%">Montant</th></tr>' +
      (lignes(e).length ? lignes(e).map(function (l) { return '<tr><td>' + esc(l.l) + '</td><td>' + F.num(l.qte) + '</td><td>' + F.num(l.pu) + '</td><td>' + F.money(l.qte * l.pu) + '</td></tr>'; }).join('') : '<tr><td colspan="4">Aucune ligne saisie</td></tr>') +
      '<tr><th colspan="3" style="text-align:right">Total</th><th>' + F.money(fr) + '</th></tr></table>' +
      '<div class="ops-sign"><div>Le commandant du navire<i></i></div><div>L\'agent consignataire LSG<i></i></div></div>' +
      '<p class="small muted" style="margin-top:16px">Document de démonstration — navire, armateur et montants fictifs ; modèle à adapter aux procédures réelles de LSG.</p></div>';
    U.modal({ title: 'Statement of facts — ' + e.navire, size: 'lg', body: html, actions: [{ label: 'Fermer' }, { label: 'Imprimer', cls: 'primary', icon: 'print', onClick: function () {
      document.body.classList.add('ops-print'); E.log('Statement of facts imprimé ' + e.id, e.navire);
      setTimeout(function () { try { window.print(); } finally { document.body.classList.remove('ops-print'); } }, 30);
    } }] });
  }

  /* ------------------------------------------------------------------ notification à l'armateur */
  function messageFor(e) {
    var c = client(e.armateur), who = c && c.contact ? ', ' + c.contact : '';
    var l = {
      'Annoncée': 'nous accusons réception de l\'annonce du ' + e.navire + ' à ' + e.port + ' (ETA ' + F.date(e.eta) + ', ETD ' + F.date(e.etd) + '). Merci de nous transmettre les documents du navire et vos instructions de service.',
      'En rade': 'le ' + e.navire + ' est en rade de ' + e.port + ' en attente d\'un poste à quai. Nous vous confirmons l\'heure d\'accostage dès attribution.',
      'À quai': 'le ' + e.navire + ' est à quai à ' + e.port + '. Les formalités d\'arrivée sont en cours et les opérations commenceront prochainement.',
      'Opérations': 'les opérations commerciales du ' + e.navire + ' sont en cours à ' + e.port + (e.marchandise ? ' (' + e.marchandise + ')' : '') + '. Départ prévu le ' + F.date(e.etd) + '.',
      'Appareillée': 'le ' + e.navire + ' a appareillé de ' + e.port + '. Le Statement of facts et la facture d\'escale vous parviendront prochainement.'
    }[e.statut];
    return 'Bonjour' + who + ',\n\nEscale ' + e.id + ' — ' + l + '\n\nCordialement,\nLSG — Pôle Consignation\n+241 65 99 62 83';
  }
  function notifyForm(e) {
    var c = client(e.armateur) || {};
    U.formModal({
      title: 'Notifier l\'armateur', sub: esc(clientNom(e.armateur)) + ' · ' + esc(e.navire), okLabel: 'Ouvrir et envoyer',
      values: { canal: c.tel ? 'WhatsApp' : 'E-mail', tel: c.tel || '', email: c.email || '', message: messageFor(e) },
      fields: [
        { name: 'canal', label: 'Canal', type: 'select', options: ['WhatsApp', 'E-mail'] },
        { name: 'tel', label: 'N° WhatsApp (indicatif sans +)', placeholder: '24165996283' },
        { name: 'email', label: 'Adresse e-mail', type: 'email' },
        { name: 'message', label: 'Message pré-rédigé (modifiable)', type: 'textarea', full: true }
      ],
      onSubmit: function (v) {
        var msg = String(v.message || '').trim(); if (!msg) { U.toast('Le message est vide.', 'err'); return false; }
        if (v.canal === 'WhatsApp') {
          var t = String(v.tel).replace(/\D/g, ''); if (t.length < 8) { U.toast('Indiquez un numéro WhatsApp valide.', 'err'); return false; }
          window.open('https://wa.me/' + t + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        } else {
          if (!/^\S+@\S+\.\S+$/.test(v.email || '')) { U.toast('Indiquez une adresse e-mail valide.', 'err'); return false; }
          var a = document.createElement('a'); a.href = 'mailto:' + v.email + '?subject=' + encodeURIComponent('Escale ' + e.id + ' — ' + e.navire) + '&body=' + encodeURIComponent(msg);
          document.body.appendChild(a); a.click(); a.remove();
        }
        E.log('Armateur notifié (' + v.canal + ') · ' + e.id, clientNom(e.armateur) + ' — statut ' + e.statut); U.toast('Message préparé via ' + v.canal);
      }
    });
  }

  /* ------------------------------------------------------------------ enregistrement */
  E.register({
    id: 'consignation', label: 'Consignation — escales', title: 'Consignation — escales de navires', icon: 'ship', group: 'Opérations', roles: ['consignation'],
    seed: seed, init: init, render: render,
    badge: function () { return escales().filter(onQuay).length; },
    summary: function () {
      var k = kpis();
      return [
        { label: 'Navires à quai', value: String(k.quai.length), icon: 'ship', tone: 'violet', foot: k.rade.length + ' en rade · ' + k.att.length + ' attendu(s) sous 7 j', href: '#/consignation' },
        { label: 'Frais d\'escale du mois', value: F.short(k.frais), icon: 'money', tone: 'green', foot: k.mois.length + ' escale(s) en ' + F.month(E.today()), href: '#/consignation' }
      ];
    },
    pending: function () {
      var out = [], t = E.today(), lim = E.addDays(t, 2);
      escales().forEach(function (e) {
        if (e.statut === 'Annoncée' && e.eta <= lim) out.push({ title: 'Escale imminente · ' + e.navire, sub: e.id + ' · ' + e.port + ' · ETA ' + F.dateShort(e.eta), date: e.eta, href: '#/consignation/' + e.id, tone: 'blue' });
        else if (onQuay(e) && e.etd < t) out.push({ title: 'Départ dépassé · ' + e.navire, sub: e.id + ' · ETD ' + F.dateShort(e.etd) + ' — statut à mettre à jour', date: e.etd, href: '#/consignation/' + e.id, tone: 'orange' });
        else if (e.statut === 'Appareillée' && !e.facture && fraisOf(e) > 0) out.push({ title: 'Facture armateur à créer · ' + e.navire, sub: e.id + ' · ' + F.money(fraisOf(e)), date: e.etd, href: '#/consignation/' + e.id, tone: 'orange' });
      });
      return out;
    },
    search: function (q) {
      return escales().filter(function (e) { return E.norm([e.id, e.navire, e.imo, clientNom(e.armateur), e.marchandise].join(' ')).indexOf(q) >= 0; })
        .map(function (e) { return { title: e.navire + ' · ' + e.id, sub: e.statut + ' · ' + e.port + ' · IMO ' + e.imo, href: '#/consignation/' + e.id }; });
    }
  });
})();
