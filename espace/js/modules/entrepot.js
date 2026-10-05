/* LSG · Espace de gestion — module « Entrepôt sous douane »
   Lots sous douane (Libreville, Owendo) : KPI, alertes d'échéance, plan d'implantation par zones, liste filtrable,
   fiche lot avec historique des mouvements, entrées, sorties / bons d'enlèvement, déplacements, relances client.
   Données de démonstration (clients et marchandises fictifs). */
(function () {
  'use strict';
  var E = window.ERP; if (!E) return;
  var U = E.ui, F = E.fmt, S = E.store, esc = E.esc, sum = E.sum;

  /* ------------------------------------------------------------------ styles propres au module (préfixe .ops-) */
  if (!document.getElementById('ops-css-en')) {
    var st = document.createElement('style'); st.id = 'ops-css-en';
    st.textContent =
      '.ops-zones{display:flex;flex-direction:column;gap:12px;padding:14px 16px 16px}' +
      '.ops-zone-row{display:grid;grid-template-columns:62px 1fr;gap:10px;align-items:start}' +
      '.ops-zone-name{font-family:Sora,sans-serif;font-weight:700;font-size:13px;color:var(--navy-2);background:var(--grey-bg);border-radius:9px;padding:9px 0;text-align:center}' +
      '.ops-zone-name small{display:block;font:500 10px Inter,sans-serif;color:var(--ink-3)}' +
      '.ops-cells{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:6px}' +
      '.ops-cell{position:relative;border:1px dashed #cdd6e2;background:#fafcfe;border-radius:8px;min-height:46px;padding:4px 4px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--ink-3);cursor:pointer;line-height:1.25;font-family:inherit}' +
      '.ops-cell:hover{border-color:var(--navy-3);color:var(--navy-3);background:#f0f8fd}' +
      '.ops-cell.is-lot{border:1px solid var(--c);background:var(--c);color:#fff;border-style:solid}' +
      '.ops-cell.is-lot:hover{filter:brightness(1.08);color:#fff;background:var(--c)}' +
      '.ops-cell b{font-size:11.5px;font-weight:700}.ops-cell i{font-style:normal;opacity:.85}' +
      '.ops-cell em{position:absolute;right:3px;top:2px;font-style:normal;font-size:9px;font-weight:700;background:rgba(0,0,0,.28);border-radius:6px;padding:0 4px}' +
      '.ops-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);padding:0 16px 14px}' +
      '.ops-legend span{display:inline-flex;align-items:center;gap:5px}.ops-legend i{width:11px;height:11px;border-radius:3px;display:inline-block}' +
      '.ops-alert{display:flex;gap:12px;align-items:center;padding:10px 18px;border-bottom:1px solid var(--line-2);flex-wrap:wrap}.ops-alert:last-child{border-bottom:0}' +
      '.ops-alert__b{flex:1;min-width:180px}' +
      '.ops-occ{display:flex;flex-direction:column;gap:14px}.ops-occ b{font-size:13px}.ops-occ small{color:var(--ink-3);display:block;margin-bottom:4px}' +
      '.ops-big{display:flex;gap:14px;align-items:center;flex-wrap:wrap}' +
      '.ops-big__ic{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:var(--navy);color:#fff;flex:none}.ops-big__ic svg{width:26px}' +
      '.ops-big h2{font-size:21px;margin:0}.ops-big .sub{color:var(--ink-3);font-size:12.5px}' +
      '.ops-acts{display:flex;gap:8px;flex-wrap:wrap}' +
      '.ops-doc table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12.5px}' +
      '.ops-doc th,.ops-doc td{border:1px solid #cfd8e3;padding:6px 9px;text-align:left;vertical-align:top}' +
      '.ops-doc th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.04em}' +
      '.ops-doc .ops-logo{background:#fff;border:1px solid #e3e8ef;border-radius:8px;padding:4px 8px;display:inline-block}' +
      '.ops-sign{display:flex;gap:30px;margin-top:26px;flex-wrap:wrap}.ops-sign>div{flex:1;min-width:150px;font-size:12px}.ops-sign i{display:block;border-bottom:1px solid #6b7a90;height:46px}' +
      '@media (max-width:640px){.ops-big h2{font-size:18px}.ops-acts .btn{flex:1 1 140px}.ops-zone-row{grid-template-columns:1fr}.ops-zone-name{padding:5px 0;text-align:left;padding-left:10px}.ops-zone-name small{display:inline;margin-left:6px}.ops-cells{grid-template-columns:repeat(auto-fill,minmax(52px,1fr))}}' +
      '@media print{body.ops-print>*:not(.modal-back){display:none!important}body.ops-print .modal-back{display:block!important;position:static!important;background:none!important;padding:0!important}body.ops-print .modal{box-shadow:none!important;max-height:none!important;width:100%!important;max-width:none!important;border-radius:0!important}body.ops-print .modal__b{overflow:visible!important;max-height:none!important}body.ops-print .modal__h,body.ops-print .modal__f{display:none!important}body.ops-print .doc{border:0;padding:0}}';
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------------ référentiels */
  var SITES = ['Libreville', 'Owendo'];
  var ST_SD = 'Sous douane', ST_DE = 'Dédouané — à enlever', ST_SO = 'Sorti';
  var STATUTS = [ST_SD, ST_DE, ST_SO];
  var STONE = {}; STONE[ST_SD] = 'blue'; STONE[ST_DE] = 'green'; STONE[ST_SO] = 'grey';
  var SCOL = {}; SCOL[ST_SD] = '#2563eb'; SCOL[ST_DE] = '#1e9e4a'; SCOL[ST_SO] = '#94a3b8';
  var C_RED = '#d93636', C_ORA = '#e8780c';
  /* implantation fictive : zones et nombre d'emplacements par site */
  var PLAN = {
    'Libreville': [{ z: 'A', n: 12, l: 'Zone A', s: 'rayonnages' }, { z: 'B', n: 12, l: 'Zone B', s: 'palettes' }, { z: 'C', n: 12, l: 'Zone C', s: 'vrac / lourd' }],
    'Owendo': [{ z: 'A', n: 12, l: 'Zone A', s: 'rayonnages' }, { z: 'B', n: 12, l: 'Zone B', s: 'palettes' }, { z: 'C', n: 12, l: 'Zone C', s: 'vrac / lourd' }, { z: 'PARC', n: 8, l: 'Parc', s: 'conteneurs' }]
  };
  var state = { site: '', statut: '', client: '', q: '' };

  /* ------------------------------------------------------------------ utilitaires */
  function pad(n) { return String(n).padStart(2, '0'); }
  function user() { var u = E.session.user(); return u ? u.name : 'Système'; }
  function lots() { return S.all('lots'); }
  function actif(l) { return l.statut !== ST_SO; }
  function clientNom(id) { return E.clientName(id); }
  function client(id) { return S.get('clients', id); }
  function repaint() { var y = window.pageYOffset || 0; E.rerender(); window.scrollTo(0, y); }
  function isoAt(d) { return new Date(E.parseDate(d).getTime() + 8.5 * 36e5).toISOString(); }
  function slotKey(z, n) { return z + '-' + (z === 'PARC' ? n : pad(n)); }
  function normSlot(s) { var m = String(s || '').toUpperCase().match(/^([A-Z]+)\s*-?\s*(\d+)$/); return m ? slotKey(m[1], +m[2]) : String(s || '').toUpperCase(); }
  function slotsOf(site) { var out = []; (PLAN[site] || []).forEach(function (z) { for (var i = 1; i <= z.n; i++) out.push(slotKey(z.z, i)); }); return out; }
  function occupant(site, slot, ignoreId) { return lots().filter(function (l) { return actif(l) && l.site === site && l.id !== ignoreId && normSlot(l.emplacement) === normSlot(slot); }); }
  function freeSlots(site, ignoreId) { return slotsOf(site).filter(function (s) { return !occupant(site, s, ignoreId).length; }); }
  function slotOpts(site, ignoreId, current) {
    var f = freeSlots(site, ignoreId); if (current && f.indexOf(normSlot(current)) < 0 && f.indexOf(current) < 0) f.unshift(current);
    return f.map(function (s) { return { v: s, l: s }; });
  }
  function jours(l) { return actif(l) && l.echeance ? E.daysBetween(E.today(), l.echeance) : null; }
  /* niveau d'alerte : 3 = dépassée, 2 = < 3 j, 1 = ≤ 7 j, 0 = RAS */
  function niveau(l) { var d = jours(l); if (d == null) return 0; return d < 0 ? 3 : d < 3 ? 2 : d <= 7 ? 1 : 0; }
  function echBadge(l) {
    var d = jours(l); if (d == null) return '';
    if (d < 0) return U.badge('Dépassée de ' + (-d) + ' j', 'red');
    if (d === 0) return U.badge('Échéance aujourd\'hui', 'red');
    if (d < 3) return U.badge('J-' + d, 'red');
    if (d <= 7) return U.badge('J-' + d, 'orange');
    return '';
  }
  function statutBadge(s) { return U.badge(s, STONE[s] || 'grey'); }
  function cellColor(l) { var n = niveau(l); return n >= 2 ? C_RED : n === 1 ? C_ORA : SCOL[l.statut] || '#2563eb'; }
  function addMouv(l, type, detail, at) { l.mouv = l.mouv || []; l.mouv.push({ at: at || new Date().toISOString(), type: type, detail: detail, by: user() }); }
  function dossierOpts() { return S.all('dossiers').map(function (d) { return { v: d.id, l: d.id + ' — ' + clientNom(d.client) + ' — ' + d.desc }; }); }

  function prep(l) {
    var dirty = false, t = E.today();
    if (l.statut === ST_SO && !l.sortie) { l.sortie = E.addDays(t, -2); dirty = true; }
    if (!l.mouv || !l.mouv.length) {
      l.mouv = [{ at: isoAt(l.entree), type: 'Entrée', detail: 'Entrée en entrepôt — ' + l.site + ', emplacement ' + l.emplacement + '.', by: 'Entrepôt' }];
      if (l.statut !== ST_SD) l.mouv.push({ at: isoAt(E.addDays(l.entree, Math.min(3, Math.max(0, E.daysBetween(l.entree, t))))), type: 'Statut', detail: 'Statut : ' + ST_DE + '.', by: 'Pôle Douane' });
      if (l.statut === ST_SO) l.mouv.push({ at: isoAt(l.sortie), type: 'Sortie', detail: 'Enlèvement par le client (lot d\'exemple).', by: 'Entrepôt' });
      dirty = true;
    }
    return dirty;
  }
  function seed() { return { lots: E.clone(window.LSG.lots) }; }
  function init() { var d = false; lots().forEach(function (l) { if (prep(l)) d = true; }); if (d) S.save(); }

  /* ------------------------------------------------------------------ calculs */
  function inScope() { return lots().filter(function (l) { return !state.site || l.site === state.site; }); }
  function occupation(site) { var all = slotsOf(site), used = all.filter(function (s) { return occupant(site, s).length; }).length; return { used: used, cap: all.length, pct: all.length ? used / all.length * 100 : 0 }; }
  function aRelancer() { var t = E.today(); return lots().filter(function (l) { var d = jours(l); return d != null && d <= 7 && !(l.lastRelance && E.daysBetween(l.lastRelance, t) < 2); }); }
  function filtered() {
    var q = E.norm(state.q).trim();
    return lots().filter(function (l) {
      return (!state.site || l.site === state.site) && (!state.statut || l.statut === state.statut) && (!state.client || l.client === state.client) &&
        (!q || E.norm([l.id, l.desc, l.dossier, l.emplacement, clientNom(l.client)].join(' ')).indexOf(q) >= 0);
    }).sort(function (a, b) { if (actif(a) !== actif(b)) return actif(a) ? -1 : 1; return String(a.echeance) < String(b.echeance) ? -1 : 1; });
  }

  /* ------------------------------------------------------------------ vue principale */
  function render(view, params) {
    var p0 = params[0];
    if (p0) {
      var l = S.get('lots', p0);
      if (l) { prep(l); return renderDetail(view, l); }
      view.innerHTML = '<div class="card"><div class="empty">' + E.icon('alert') + '<div>Lot « ' + esc(p0) + ' » introuvable.</div><a class="btn" style="margin-top:12px" href="#/entrepot">Retour à l\'entrepôt</a></div></div>';
      return;
    }
    var all = lots().filter(actif), sc = all.filter(function (l) { return !state.site || l.site === state.site; });
    var proches = sc.filter(function (l) { return niveau(l) > 0; }).sort(function (a, b) { return String(a.echeance) < String(b.echeance) ? -1 : 1; });
    var sousD = sc.filter(function (l) { return l.statut === ST_SD; }).length;
    view.innerHTML =
      '<div class="row" style="margin-bottom:14px"><div class="section-title" style="margin:0"><h2>Entrepôt sous douane</h2><p>Libreville · Owendo — données de démonstration</p></div><span class="spacer"></span>' +
        '<div class="chips" id="en-site">' + [['', 'Tous les sites'], ['Libreville', 'Libreville'], ['Owendo', 'Owendo']].map(function (c) { return '<button class="chip' + (state.site === c[0] ? ' is-active' : '') + '" data-k="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<button class="btn" id="en-csv">' + E.icon('download') + 'Inventaire CSV</button><button class="btn" id="en-out">' + E.icon('truck') + 'Enregistrer une sortie</button><button class="btn primary" id="en-in">' + E.icon('plus') + 'Enregistrer une entrée</button></div>' +
      '<div class="grid g4" style="margin-bottom:16px">' +
        U.kpi({ label: 'Lots sous douane', value: sc.length, icon: 'layers', tone: 'blue', foot: sousD + ' en attente de dédouanement · ' + (sc.length - sousD) + ' à enlever' }) +
        U.kpi({ label: 'Colis en entrepôt', value: F.num(sum(sc, 'colis')), icon: 'box', tone: 'violet', foot: 'hors lots sortis' }) +
        U.kpi({ label: 'Poids total', value: F.num(sum(sc, 'poids') / 1000, 1), unit: 't', icon: 'target', tone: 'navy', foot: F.num(sum(sc, 'poids')) + ' kg' }) +
        U.kpi({ label: 'Échéances ≤ 7 jours', value: proches.length, icon: 'alert', tone: proches.length ? 'red' : 'green', foot: proches.filter(function (l) { return niveau(l) >= 2; }).length + ' critique(s) · dépassées incluses' }) +
      '</div>' +
      '<div class="grid g-1-2" style="margin-bottom:16px">' +
        '<div class="card"><div class="card__h"><h3>Occupation par site</h3><span class="sub">emplacements occupés</span></div><div class="card__b ops-occ">' +
          SITES.map(function (s) { var o = occupation(s); return '<div><b>' + esc(s) + '</b><small>' + o.used + ' / ' + o.cap + ' emplacements</small>' + U.progress(o.pct, o.pct > 85 ? 'red' : o.pct > 60 ? 'orange' : '') + '</div>'; }).join('') + '</div></div>' +
        '<div class="card"><div class="card__h"><h3>Alertes d\'échéance</h3><span class="sub">date limite d\'enlèvement / franchise</span><span class="spacer"></span>' + U.badge(proches.length + ' lot(s)', proches.length ? 'red' : 'green') + '</div>' +
          (proches.length ? proches.map(function (l) {
            return '<div class="ops-alert"><div class="list__icon tone-' + (niveau(l) >= 2 ? 'red' : 'orange') + '">' + E.icon('clock') + '</div><div class="ops-alert__b"><a href="#/entrepot/' + l.id + '" style="color:inherit"><b>' + esc(l.id) + '</b> · ' + esc(l.desc) + '</a><div class="small muted">' + esc(clientNom(l.client)) + ' · ' + esc(l.site) + ' ' + esc(l.emplacement) + ' · échéance ' + F.date(l.echeance) + '</div></div>' + echBadge(l) +
              '<button class="btn sm" data-rel="' + l.id + '">' + E.icon('send') + 'Relancer</button></div>';
          }).join('') : '<div class="empty">' + E.icon('check') + '<div>Aucune échéance à moins de 7 jours.</div></div>') + '</div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:16px"><div class="card__h"><h3>Plan d\'implantation</h3><span class="sub">cliquez sur un lot pour l\'ouvrir, sur un emplacement libre pour y entrer un lot</span></div>' + planHTML() +
        '<div class="ops-legend"><span><i style="background:' + SCOL[ST_SD] + '"></i>Sous douane</span><span><i style="background:' + SCOL[ST_DE] + '"></i>Dédouané — à enlever</span><span><i style="background:' + C_ORA + '"></i>Échéance ≤ 7 j</span><span><i style="background:' + C_RED + '"></i>Échéance &lt; 3 j ou dépassée</span><span><i style="border:1px dashed #9aa8bb;background:#fff"></i>Libre</span></div></div>' +
      '<div class="card"><div class="card__h"><h3>Lots</h3><span class="sub" id="en-count"></span></div><div class="card__b" style="padding-bottom:0"><div class="filters">' +
        '<input class="input" id="en-q" type="search" placeholder="Lot, client, dossier, emplacement…" value="' + esc(state.q) + '">' +
        '<select class="select" id="en-st"><option value="">Tous les statuts</option>' + STATUTS.map(function (s) { return '<option' + (state.statut === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="en-cl"><option value="">Tous les clients</option>' + clientsInLots().map(function (c) { return '<option value="' + c.id + '"' + (state.client === c.id ? ' selected' : '') + '>' + esc(c.nom) + '</option>'; }).join('') + '</select></div></div>' +
        '<div id="en-list"></div></div>';
    view.querySelector('#en-site').addEventListener('click', function (ev) { var b = ev.target.closest('.chip'); if (b) { state.site = b.dataset.k; repaint(); } });
    view.querySelector('#en-in').onclick = function () { entreeForm({}); };
    view.querySelector('#en-out').onclick = function () { sortieChoose(); };
    view.querySelector('#en-csv').onclick = exportInventaire;
    view.querySelector('#en-q').addEventListener('input', function (ev) { state.q = ev.target.value; paintList(view); });
    view.querySelector('#en-st').onchange = function (ev) { state.statut = ev.target.value; paintList(view); };
    view.querySelector('#en-cl').onchange = function (ev) { state.client = ev.target.value; paintList(view); };
    E.$$('[data-rel]', view).forEach(function (b) { b.onclick = function () { relanceForm(S.get('lots', b.dataset.rel)); }; });
    E.$$('[data-free]', view).forEach(function (b) { b.onclick = function () { entreeForm({ site: b.dataset.site, emplacement: b.dataset.free }); }; });
    paintList(view);
  }
  function clientsInLots() { var ids = {}; lots().forEach(function (l) { ids[l.client] = 1; }); return S.all('clients').filter(function (c) { return ids[c.id]; }); }

  function planHTML() {
    var sites = state.site ? [state.site] : SITES;
    return '<div class="grid ' + (sites.length > 1 ? 'g2 keep-1' : '') + '" style="gap:0">' + sites.map(function (site) {
      var o = occupation(site);
      return '<div><div style="padding:12px 16px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="list__icon tone-blue">' + E.icon('pin') + '</div><b>' + esc(site) + '</b><span class="spacer"></span>' + U.badge(o.used + ' / ' + o.cap + ' occupés', o.pct > 85 ? 'red' : o.pct > 60 ? 'orange' : 'blue') + '</div><div class="ops-zones">' +
        PLAN[site].map(function (z) {
          var cells = ''; for (var i = 1; i <= z.n; i++) {
            var k = slotKey(z.z, i), oc = occupant(site, k);
            if (oc.length) { var l = oc[0]; cells += '<a class="ops-cell is-lot" style="--c:' + cellColor(l) + '" href="#/entrepot/' + l.id + '" title="' + esc(l.id + ' · ' + clientNom(l.client) + ' · ' + l.desc + ' · ' + l.statut + ' · échéance ' + F.dateShort(l.echeance)) + '"><b>' + esc(l.id.replace(/^LOT-(2026-)?/, '')) + '</b><i>' + k + '</i>' + (oc.length > 1 ? '<em>+' + (oc.length - 1) + '</em>' : '') + '</a>'; }
            else cells += '<button class="ops-cell" data-free="' + k + '" data-site="' + esc(site) + '" title="Emplacement libre — enregistrer une entrée"><i>' + k + '</i></button>';
          }
          return '<div class="ops-zone-row"><div class="ops-zone-name">' + z.l + '<small>' + z.s + '</small></div><div class="ops-cells">' + cells + '</div></div>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
  }

  function listCols() {
    return [
      { key: 'id', label: 'Lot', render: function (l) { return '<span class="mono">' + esc(l.id) + '</span>'; } },
      { key: 'client', label: 'Client', render: function (l) { return '<b>' + esc(clientNom(l.client)) + '</b><div class="small muted">' + esc(l.desc) + '</div>'; }, csv: function (l) { return clientNom(l.client); } },
      { key: 'dossier', label: 'Dossier', render: function (l) { return l.dossier ? '<span class="mono">' + esc(l.dossier) + '</span>' : ''; } },
      { key: 'site', label: 'Site · empl.', render: function (l) { return esc(l.site) + ' <span class="mono">' + esc(l.emplacement) + '</span>'; }, csv: function (l) { return l.site + ' ' + l.emplacement; } },
      { key: 'colis', label: 'Colis', num: 1, render: function (l) { return F.num(l.colis); } },
      { key: 'poids', label: 'Poids (kg)', num: 1, render: function (l) { return F.num(l.poids); } },
      { key: 'entree', label: 'Entrée', render: function (l) { return F.dateShort(l.entree); }, csv: function (l) { return l.entree; } },
      { key: 'echeance', label: 'Échéance', render: function (l) { return '<span class="nowrap">' + F.dateShort(l.echeance) + '</span> ' + echBadge(l); }, csv: function (l) { return l.echeance; } },
      { key: 'statut', label: 'Statut', render: function (l) { return statutBadge(l.statut); } },
      { key: 'act', label: 'Action', render: function (l) { return actif(l) ? '<button class="btn sm" data-lrel="' + l.id + '">' + E.icon('send') + 'Relancer</button>' : '<span class="muted small">—</span>'; }, csv: function () { return ''; } }
    ];
  }
  function paintList(view) {
    var el = view.querySelector('#en-list'); if (!el) return;
    var list = filtered();
    view.querySelector('#en-count').textContent = list.length + ' lot(s)';
    el.innerHTML = U.table(listCols(), list, { onRow: function (l) { E.go('entrepot/' + l.id); }, empty: 'Aucun lot pour ce filtre' });
    E.$$('[data-lrel]', el).forEach(function (b) { b.onclick = function () { relanceForm(S.get('lots', b.dataset.lrel)); }; });
  }
  function exportInventaire() {
    var list = inScope().filter(actif).sort(function (a, b) { return a.site + a.emplacement < b.site + b.emplacement ? -1 : 1; });
    var cols = listCols().slice(0, 9).filter(function (c) { return c.key !== 'client' || true; });
    cols.splice(2, 0, { key: 'desc', label: 'Désignation' });
    U.exportCSV('inventaire-entrepot-' + (state.site ? state.site.toLowerCase() + '-' : '') + E.today(), cols, list);
    E.log('Inventaire entrepôt exporté (CSV)', list.length + ' lot(s)' + (state.site ? ' — ' + state.site : ''));
  }

  /* ------------------------------------------------------------------ entrée en entrepôt */
  function bindSite(m, ignoreId, current) {
    var sel = m.body.querySelector('#f_site'), emp = m.body.querySelector('#f_emplacement'); if (!sel || !emp) return;
    sel.onchange = function () { emp.innerHTML = slotOpts(sel.value, ignoreId, '').map(function (o) { return '<option>' + esc(o.v) + '</option>'; }).join(''); };
  }
  function entreeForm(pre) {
    var site = pre.site || 'Owendo', free = freeSlots(site), emp = pre.emplacement || free[0] || '';
    var m = U.formModal({
      title: 'Enregistrer une entrée', sub: 'Nouveau lot en entrepôt sous douane', size: 'lg', okLabel: 'Enregistrer l\'entrée',
      values: { site: site, emplacement: emp, statut: ST_SD, echeance: E.addDays(E.today(), 30) },
      fields: [
        { name: 'client', label: 'Client', type: 'select', options: E.options('clients', 'nom'), required: true },
        { name: 'dossier', label: 'Dossier lié (optionnel)', type: 'select', options: dossierOpts(), empty: '— Aucun dossier —' },
        { name: 'desc', label: 'Description de la marchandise', required: true, full: true, placeholder: 'Ex. 4 palettes — pièces détachées' },
        { name: 'colis', label: 'Nombre de colis', type: 'number', min: 1, required: true },
        { name: 'poids', label: 'Poids total (kg)', type: 'number', min: 0, required: true },
        { name: 'site', label: 'Site', type: 'select', options: SITES },
        { name: 'emplacement', label: 'Emplacement', type: 'select', options: slotOpts(site, null, emp) },
        { name: 'echeance', label: 'Échéance d\'enlèvement', type: 'date', required: true }
      ],
      onSubmit: function (v) {
        if (v.echeance < E.today()) { U.toast('L\'échéance ne peut pas être dans le passé.', 'err'); return false; }
        if (!v.emplacement) { U.toast('Aucun emplacement libre sur ce site.', 'err'); return false; }
        if (occupant(v.site, v.emplacement).length) { U.toast('L\'emplacement ' + v.emplacement + ' est déjà occupé.', 'err'); return false; }
        var l = { id: S.next('LOT'), dossier: v.dossier || '', client: v.client, desc: v.desc, entree: E.today(), site: v.site, emplacement: v.emplacement, colis: +v.colis, poids: +v.poids, statut: ST_SD, echeance: v.echeance };
        addMouv(l, 'Entrée', 'Entrée en entrepôt — ' + l.site + ', emplacement ' + l.emplacement + '.');
        S.add('lots', l, 'LOT');
        E.log('Entrée de lot ' + l.id, clientNom(l.client) + ' — ' + l.desc + ' (' + l.site + ' ' + l.emplacement + ')');
        E.notify('Nouveau lot en entrepôt', l.id + ' · ' + l.desc, '#/entrepot/' + l.id, 'green');
        U.toast('Lot ' + l.id + ' enregistré'); E.go('entrepot/' + l.id);
      }
    });
    bindSite(m, null);
    var dsel = m.body.querySelector('#f_dossier');
    if (dsel) dsel.onchange = function () {
      var d = S.get('dossiers', dsel.value); if (!d) return;
      var c = m.body.querySelector('#f_client'), ds = m.body.querySelector('#f_desc'), co = m.body.querySelector('#f_colis'), po = m.body.querySelector('#f_poids'), si = m.body.querySelector('#f_site');
      if (c) c.value = d.client; if (ds && !ds.value) ds.value = d.desc; if (co && !co.value && d.colis) co.value = d.colis; if (po && !po.value && d.poids) po.value = d.poids;
      if (si && SITES.indexOf(d.agence) >= 0 && si.value !== d.agence) { si.value = d.agence; si.onchange(); }
    };
  }

  /* ------------------------------------------------------------------ sortie / enlèvement */
  function sortieChoose() {
    var l = lots().filter(function (x) { return x.statut === ST_DE; });
    if (!l.length) { U.toast('Aucun lot dédouané à enlever pour le moment.', 'warn'); return; }
    U.formModal({ title: 'Enregistrer une sortie', sub: 'Choisissez le lot à enlever', size: 'sm', okLabel: 'Continuer',
      fields: [{ name: 'lot', label: 'Lot dédouané', type: 'select', required: true, full: true, options: l.map(function (x) { return { v: x.id, l: x.id + ' — ' + clientNom(x.client) + ' — ' + x.desc }; }) }],
      onSubmit: function (v) { setTimeout(function () { sortieForm(S.get('lots', v.lot)); }, 0); } });
  }
  function sortieForm(l) {
    if (!l) return;
    if (l.statut === ST_SO) { U.toast('Ce lot est déjà sorti.', 'warn'); return; }
    if (l.statut !== ST_DE) { U.toast('Le lot est encore sous douane : marquez-le « ' + ST_DE + ' » avant l\'enlèvement.', 'err'); return; }
    U.formModal({
      title: 'Sortie du lot ' + l.id, sub: esc(clientNom(l.client)) + ' · ' + esc(l.desc), okLabel: 'Valider la sortie et éditer le bon',
      values: { date: E.today() },
      fields: [
        { name: 'date', label: 'Date d\'enlèvement', type: 'date', required: true },
        { name: 'enleve', label: 'Enlevé par (nom / transporteur)', required: true },
        { name: 'vehicule', label: 'Immatriculation du véhicule', placeholder: 'Ex. GA-123-AB' },
        { name: 'note', label: 'Observation', type: 'textarea', full: true }
      ],
      onSubmit: function (v) {
        var cur = S.get('lots', l.id);
        cur.statut = ST_SO; cur.sortie = v.date; cur.enleve = v.enleve; cur.vehicule = v.vehicule || ''; cur.bon = S.next('BS');
        addMouv(cur, 'Sortie', 'Enlèvement par ' + v.enleve + (v.vehicule ? ' (' + v.vehicule + ')' : '') + ' — bon ' + cur.bon + (v.note ? ' — ' + v.note : ''), isoAt(v.date));
        S.save(); E.log('Sortie du lot ' + cur.id, cur.bon + ' — ' + clientNom(cur.client)); U.toast('Sortie enregistrée — bon ' + cur.bon);
        repaint(); setTimeout(function () { bonModal(cur); }, 60);
      }
    });
  }
  function bonModal(l) {
    if (!l.bon) { l.bon = S.next('BS'); S.save(); }
    var c = client(l.client), d = l.dossier ? S.get('dossiers', l.dossier) : null;
    var html = '<div class="doc ops-doc"><div class="doc__head"><div><span class="ops-logo"><img src="../assets/img/logo.png" alt="LSG" style="height:40px;display:block"></span><div class="small muted" style="margin-top:6px">Logistique Services Gabon — entrepôt sous douane ' + esc(l.site) + '<br>BP 217 Zone Fret Aéroportuaire, Libreville · +241 11 44 27 27</div></div>' +
      '<div style="text-align:right"><h4>Bon de sortie</h4><div>N° <b class="mono">' + esc(l.bon) + '</b></div><div class="small muted">Date : ' + F.date(l.sortie || E.today()) + '</div></div></div>' +
      '<table><tr><th style="width:24%">Lot</th><td>' + esc(l.id) + '</td><th style="width:20%">Dossier</th><td>' + esc(l.dossier || '—') + '</td></tr>' +
      '<tr><th>Client</th><td colspan="3">' + esc(clientNom(l.client)) + (c && c.contact ? ' — ' + esc(c.contact) : '') + '</td></tr>' +
      '<tr><th>Désignation</th><td colspan="3">' + esc(l.desc) + '</td></tr>' +
      '<tr><th>Colis</th><td>' + F.num(l.colis) + '</td><th>Poids</th><td>' + F.num(l.poids) + ' kg</td></tr>' +
      '<tr><th>Site · emplacement</th><td>' + esc(l.site) + ' · ' + esc(l.emplacement) + '</td><th>Entré le</th><td>' + F.date(l.entree) + '</td></tr>' +
      (d && d.transport ? '<tr><th>Titre de transport</th><td colspan="3">' + esc(d.transport) + '</td></tr>' : '') +
      '<tr><th>Enlevé par</th><td>' + esc(l.enleve || '—') + '</td><th>Véhicule</th><td>' + esc(l.vehicule || '—') + '</td></tr></table>' +
      '<p>La marchandise désignée ci-dessus, dédouanée, est remise au preneur qui reconnaît l\'avoir reçue en bon état apparent, sous réserve des mentions portées ci-dessous.</p><p>Réserves : ................................................................................................</p>' +
      '<div class="ops-sign"><div>Le responsable d\'entrepôt LSG<i></i></div><div>Le preneur (nom, signature)<i></i></div></div>' +
      '<p class="small muted" style="margin-top:16px">Document de démonstration — client, marchandise et références fictifs ; modèle à adapter aux procédures réelles de LSG.</p></div>';
    U.modal({ title: 'Bon de sortie ' + l.bon, size: 'lg', body: html, actions: [{ label: 'Fermer' }, { label: 'Imprimer', cls: 'primary', icon: 'print', onClick: function () {
      document.body.classList.add('ops-print'); E.log('Bon de sortie imprimé ' + l.bon, l.id);
      setTimeout(function () { try { window.print(); } finally { document.body.classList.remove('ops-print'); } }, 30);
    } }] });
  }

  /* ------------------------------------------------------------------ relance client (WhatsApp / e-mail) */
  function relanceMsg(l) {
    var c = client(l.client), d = jours(l), quand = d == null ? '' : d < 0 ? 'La date limite du ' + F.date(l.echeance) + ' est dépassée.' : d === 0 ? 'La date limite d\'enlèvement est aujourd\'hui.' : 'La date limite d\'enlèvement est fixée au ' + F.date(l.echeance) + ' (dans ' + d + ' jour' + (d > 1 ? 's' : '') + ').';
    var etat = l.statut === ST_DE ? 'est dédouanée et disponible à l\'enlèvement' : 'est en entrepôt sous douane (formalités de dédouanement à finaliser)';
    return 'Bonjour' + (c && c.contact ? ', ' + c.contact : '') + ',\n\nVotre marchandise (lot ' + l.id + ' — ' + l.desc + ', ' + l.colis + ' colis) ' + etat + ' à l\'entrepôt LSG de ' + l.site + '. ' + quand + '\nMerci de nous indiquer la date et l\'heure de passage de votre transporteur. Au-delà de l\'échéance, des frais d\'entreposage supplémentaires peuvent s\'appliquer.\n\nCordialement,\nLSG — Entrepôt ' + l.site + '\n+241 65 99 62 83';
  }
  function relanceForm(l) {
    if (!l) return;
    var c = client(l.client) || {}, d = l.dossier ? S.get('dossiers', l.dossier) : null, tel = c.tel || (d && d.tel) || '';
    U.formModal({
      title: 'Relancer le client pour enlèvement', sub: esc(clientNom(l.client)) + ' · ' + esc(l.id), okLabel: 'Ouvrir et envoyer',
      values: { canal: tel ? 'WhatsApp' : 'E-mail', tel: tel, email: c.email || '', message: relanceMsg(l) },
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
          var a = document.createElement('a'); a.href = 'mailto:' + v.email + '?subject=' + encodeURIComponent('Enlèvement de votre marchandise — lot ' + l.id) + '&body=' + encodeURIComponent(msg);
          document.body.appendChild(a); a.click(); a.remove();
        }
        var cur = S.get('lots', l.id); cur.lastRelance = E.today(); addMouv(cur, 'Relance', 'Relance client pour enlèvement (' + v.canal + ').'); S.save();
        E.log('Relance enlèvement (' + v.canal + ') · ' + l.id, clientNom(l.client)); U.toast('Relance préparée via ' + v.canal); E.renderBadges();
        if (/^#\/entrepot\//.test(location.hash)) repaint();
      }
    });
  }

  /* ------------------------------------------------------------------ fiche lot */
  function renderDetail(view, l) {
    var d = l.dossier ? S.get('dossiers', l.dossier) : null, nv = niveau(l), j = jours(l);
    view.innerHTML =
      '<div class="row" style="margin-bottom:14px"><a class="btn ghost" href="#/entrepot">' + E.icon('back') + 'Tous les lots</a></div>' +
      '<div class="card" style="margin-bottom:16px"><div class="card__b stack">' +
        '<div class="ops-big"><div class="ops-big__ic">' + E.icon('layers') + '</div><div style="flex:1;min-width:200px"><h2>' + esc(l.id) + ' — ' + esc(l.desc) + '</h2><div class="sub">' + esc(clientNom(l.client)) + ' · ' + esc(l.site) + ' · emplacement <span class="mono">' + esc(l.emplacement) + '</span></div></div>' + statutBadge(l.statut) + echBadge(l) + '</div>' +
        (nv >= 2 ? '<div class="alert tone-red">' + E.icon('alert') + '<div><b>' + (j < 0 ? 'Échéance dépassée de ' + (-j) + ' jour(s).' : 'Échéance dans ' + j + ' jour(s).') + '</b> Relancez le client pour organiser l\'enlèvement.</div></div>' : nv === 1 ? '<div class="alert tone-orange">' + E.icon('clock') + '<div>Échéance d\'enlèvement dans ' + j + ' jours (' + F.date(l.echeance) + ').</div></div>' : '') +
        '<div class="ops-acts">' +
          (l.statut === ST_SD ? '<button class="btn primary" id="l-ded">' + E.icon('check') + 'Marquer « Dédouané — à enlever »</button>' : '') +
          (l.statut === ST_DE ? '<button class="btn primary" id="l-out">' + E.icon('truck') + 'Enregistrer la sortie</button><button class="btn" id="l-back">' + E.icon('back') + 'Remettre sous douane</button>' : '') +
          (l.statut === ST_SO ? '<button class="btn primary" id="l-bon">' + E.icon('print') + 'Bon de sortie</button>' : '') +
          (actif(l) ? '<button class="btn" id="l-move">' + E.icon('pin') + 'Déplacer</button><button class="btn" id="l-rel">' + E.icon('send') + 'Relancer le client</button>' : '') +
          (d ? '<button class="btn" id="l-dos">' + E.icon('link') + 'Dossier ' + esc(d.id) + '</button>' : '') +
          '<button class="btn" id="l-edit">' + E.icon('edit') + 'Modifier</button><button class="btn danger" id="l-del">' + E.icon('trash') + 'Supprimer</button>' +
        '</div></div></div>' +
      '<div class="grid g-2-1">' +
        '<div class="card"><div class="card__h"><h3>Historique des mouvements</h3><span class="sub">' + l.mouv.length + ' événement(s)</span></div><div class="card__b"><div class="timeline">' +
          l.mouv.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).map(function (m, i) { return '<div class="tl-item ' + (i === 0 ? 'current' : 'done') + '"><b>' + esc(m.type) + '</b><span>' + F.datetime(m.at) + ' · ' + esc(m.by || '') + '<br>' + esc(m.detail) + '</span></div>'; }).join('') + '</div></div></div>' +
        '<div class="card"><div class="card__h"><h3>Détail du lot</h3></div><div class="card__b"><dl class="kv">' +
          '<dt>Client</dt><dd>' + esc(clientNom(l.client)) + '</dd><dt>Dossier</dt><dd>' + (d ? '<a href="#/dossiers/' + esc(d.id) + '" class="mono">' + esc(d.id) + '</a><div class="small muted">' + esc(d.transport || '') + '</div>' : '—') + '</dd>' +
          '<dt>Désignation</dt><dd>' + esc(l.desc) + '</dd><dt>Colis</dt><dd>' + F.num(l.colis) + '</dd><dt>Poids</dt><dd>' + F.num(l.poids) + ' kg</dd>' +
          '<dt>Site</dt><dd>' + esc(l.site) + '</dd><dt>Emplacement</dt><dd class="mono">' + esc(l.emplacement) + '</dd>' +
          '<dt>Entrée</dt><dd>' + F.date(l.entree) + '</dd><dt>Échéance</dt><dd>' + F.date(l.echeance) + '</dd>' +
          (l.statut === ST_SO ? '<dt>Sortie</dt><dd>' + F.date(l.sortie) + (l.enleve ? ' — ' + esc(l.enleve) : '') + '</dd>' + (l.bon ? '<dt>Bon de sortie</dt><dd class="mono">' + esc(l.bon) + '</dd>' : '') : '') +
        '</dl></div></div></div>';
    var $ = function (s) { return view.querySelector(s); }, b;
    if ((b = $('#l-ded'))) b.onclick = function () { setStatut(l, ST_DE); };
    if ((b = $('#l-back'))) b.onclick = function () { setStatut(l, ST_SD); };
    if ((b = $('#l-out'))) b.onclick = function () { sortieForm(l); };
    if ((b = $('#l-bon'))) b.onclick = function () { bonModal(l); };
    if ((b = $('#l-move'))) b.onclick = function () { moveForm(l); };
    if ((b = $('#l-rel'))) b.onclick = function () { relanceForm(l); };
    if ((b = $('#l-dos'))) b.onclick = function () { E.go('dossiers/' + d.id); };
    $('#l-edit').onclick = function () { editForm(l); };
    $('#l-del').onclick = function () {
      U.confirm('Supprimer le lot', 'Le lot <b>' + esc(l.id) + '</b> sera supprimé définitivement de la démonstration (l\'historique est perdu).', 'Supprimer', function () { S.remove('lots', l.id); E.log('Lot supprimé ' + l.id, l.desc); U.toast('Lot supprimé'); E.go('entrepot'); }, 'danger');
    };
  }
  function setStatut(l, s) {
    U.confirm('Changer le statut', 'Le lot <b>' + esc(l.id) + '</b> passera au statut « ' + esc(s) + ' ».', 'Confirmer', function () {
      l.statut = s; addMouv(l, 'Statut', 'Statut : ' + s + '.'); S.save(); E.log('Statut du lot ' + l.id + ' : ' + s, clientNom(l.client));
      if (s === ST_DE) E.notify('Lot dédouané', l.id + ' · ' + l.desc + ' — à enlever avant le ' + F.dateShort(l.echeance), '#/entrepot/' + l.id, 'green');
      U.toast(l.id + ' : ' + s); E.renderBadges(); repaint();
    });
  }
  function moveForm(l) {
    var m = U.formModal({
      title: 'Déplacer le lot ' + l.id, sub: 'Actuellement : ' + esc(l.site) + ' · ' + esc(l.emplacement), size: 'sm', okLabel: 'Déplacer',
      values: { site: l.site, emplacement: l.emplacement },
      fields: [{ name: 'site', label: 'Site', type: 'select', options: SITES }, { name: 'emplacement', label: 'Nouvel emplacement (libre)', type: 'select', options: slotOpts(l.site, l.id, l.emplacement) }],
      onSubmit: function (v) {
        if (v.site === l.site && normSlot(v.emplacement) === normSlot(l.emplacement)) { U.toast('Le lot est déjà à cet emplacement.', 'warn'); return false; }
        if (!v.emplacement || occupant(v.site, v.emplacement, l.id).length) { U.toast('Emplacement occupé ou indisponible.', 'err'); return false; }
        var from = l.site + ' ' + l.emplacement; l.site = v.site; l.emplacement = v.emplacement;
        addMouv(l, 'Déplacement', 'De ' + from + ' vers ' + l.site + ' ' + l.emplacement + '.'); S.save();
        E.log('Lot ' + l.id + ' déplacé', from + ' → ' + l.site + ' ' + l.emplacement); U.toast('Lot déplacé : ' + l.site + ' ' + l.emplacement); repaint();
      }
    });
    bindSite(m, l.id);
  }
  function editForm(l) {
    U.formModal({
      title: 'Modifier le lot ' + l.id, size: 'lg', okLabel: 'Enregistrer', values: l,
      fields: [
        { name: 'client', label: 'Client', type: 'select', options: E.options('clients', 'nom'), required: true },
        { name: 'dossier', label: 'Dossier lié', type: 'select', options: dossierOpts(), empty: '— Aucun dossier —' },
        { name: 'desc', label: 'Description', required: true, full: true },
        { name: 'colis', label: 'Colis', type: 'number', min: 1, required: true },
        { name: 'poids', label: 'Poids (kg)', type: 'number', min: 0, required: true },
        { name: 'echeance', label: 'Échéance d\'enlèvement', type: 'date', required: true }
      ],
      onSubmit: function (v) {
        var ch = [];
        if (v.echeance !== l.echeance) ch.push('échéance ' + F.dateShort(l.echeance) + ' → ' + F.dateShort(v.echeance));
        if (+v.colis !== +l.colis) ch.push('colis ' + l.colis + ' → ' + v.colis);
        if (+v.poids !== +l.poids) ch.push('poids ' + l.poids + ' → ' + v.poids + ' kg');
        l.client = v.client; l.dossier = v.dossier || ''; l.desc = v.desc; l.colis = +v.colis; l.poids = +v.poids; l.echeance = v.echeance;
        addMouv(l, 'Modification', 'Fiche modifiée' + (ch.length ? ' (' + ch.join(' ; ') + ')' : '') + '.'); S.save();
        E.log('Lot modifié ' + l.id, ch.join(' ; ')); U.toast('Lot mis à jour'); E.renderBadges(); repaint();
      }
    });
  }

  /* ------------------------------------------------------------------ enregistrement */
  E.register({
    id: 'entrepot', label: 'Entrepôt sous douane', title: 'Entrepôt sous douane', icon: 'layers', group: 'Opérations', roles: ['entrepot'],
    seed: seed, init: init, render: render,
    badge: function () { return lots().filter(function (l) { var d = jours(l); return d != null && d <= 3; }).length; },
    summary: function () {
      var a = lots().filter(actif), pr = a.filter(function (l) { return niveau(l) > 0; });
      return [
        { label: 'Lots sous douane', value: String(a.length), icon: 'layers', tone: 'blue', foot: F.num(sum(a, 'colis')) + ' colis · ' + F.num(sum(a, 'poids') / 1000, 1) + ' t', href: '#/entrepot' },
        { label: 'Échéances ≤ 7 jours', value: String(pr.length), icon: 'alert', tone: pr.length ? 'red' : 'green', foot: 'occupation ' + SITES.map(function (s) { return s + ' ' + F.pct(occupation(s).pct); }).join(' · '), href: '#/entrepot' }
      ];
    },
    pending: function () {
      return aRelancer().sort(function (a, b) { return String(a.echeance) < String(b.echeance) ? -1 : 1; }).map(function (l) {
        var j = jours(l);
        return { title: 'Relancer pour enlèvement · ' + l.id, sub: clientNom(l.client) + ' · ' + l.desc + ' · ' + (j < 0 ? 'échéance dépassée' : 'J-' + j), date: l.echeance, href: '#/entrepot/' + l.id, tone: j < 3 ? 'red' : 'orange' };
      });
    },
    search: function (q) {
      return lots().filter(function (l) { return E.norm([l.id, l.desc, l.dossier, l.emplacement, clientNom(l.client)].join(' ')).indexOf(q) >= 0; })
        .map(function (l) { return { title: l.id + ' · ' + l.desc, sub: clientNom(l.client) + ' · ' + l.site + ' ' + l.emplacement + ' · ' + l.statut, href: '#/entrepot/' + l.id }; });
    }
  });
})();
