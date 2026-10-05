/* LSG · Module « Clients » — annuaire, fiche client (dossiers, factures, encours, plafond), création / modification, export.
   Données de démonstration (clients fictifs). */
(function () {
  'use strict';
  var E = ERP, S = E.store, U = E.ui, F = E.fmt, esc = E.esc, ic = E.icon;
  var MOD = 'clients';
  var STEPS = window.LSG.STEPS;
  var TYPES = ['Importateur', 'Exportateur', 'Armateur', 'Industriel', 'Administration', 'Particulier'];
  var VILLES = ['Libreville', 'Owendo', 'Port-Gentil', 'Franceville', 'Autre'];
  var st = { q: '', type: '', risque: '' };

  (function () {
    if (document.getElementById('lsg-clients-css')) return;
    var s = document.createElement('style'); s.id = 'lsg-clients-css';
    s.textContent = '.lsg-cl-head{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.lsg-cl-head h2{font-size:21px}' +
      '.lsg-cl-actions{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}' +
      '.lsg-plaf{display:flex;flex-direction:column;gap:6px}.lsg-plaf .row b{font-family:Sora,sans-serif;font-size:18px}' +
      '@media (max-width:640px){.lsg-cl-actions{margin-left:0;width:100%}.lsg-cl-actions .btn{flex:1 1 45%}}';
    document.head.appendChild(s);
  })();

  function all() { return S.all('clients'); }
  function factsOf(id) { return S.all('factures').filter(function (f) { return f.client === id; }); }
  function dossiersOf(id) { return S.all('dossiers').filter(function (d) { return d.client === id; }); }
  function solde(f) { return Math.max(0, (f.total || 0) - (f.paye || 0)); }
  function encours(id) { return E.sum(factsOf(id), solde); }
  function pctPlafond(c) { return c.plafond ? encours(c.id) / c.plafond * 100 : 0; }
  function tonePct(p) { return p >= 100 ? 'red' : p >= 70 ? 'orange' : 'green'; }
  function colorPct(p) { return p >= 100 ? '#d93636' : p >= 70 ? '#e8780c' : '#1e9e4a'; }
  function canGo(m) { var x = E.mod(m); return !!x && E.session.can(x); }
  function factStatut(f) {
    if ((f.paye || 0) >= f.total) return 'Payée';
    if (f.echeance && f.echeance < E.today()) return 'En retard';
    if ((f.paye || 0) > 0) return 'Partiellement payée';
    return 'Émise';
  }
  function nextCid() {
    var max = 0; all().forEach(function (c) { var n = parseInt(String(c.id).replace(/\D/g, ''), 10); if (n > max) max = n; });
    return 'C-' + String(max + 1).padStart(2, '0');
  }

  /* ---------------------------------------------------------------- formulaire */
  function fields() {
    return [
      { name: 'nom', label: 'Raison sociale', required: true, full: true },
      { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
      { name: 'ville', label: 'Ville', type: 'select', options: VILLES, required: true },
      { name: 'contact', label: 'Contact (service ou personne)' },
      { name: 'tel', label: 'Téléphone / WhatsApp', placeholder: '241XXXXXXXX' },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'delai', label: 'Délai de paiement (jours)', type: 'number', min: 0, value: 30, required: true },
      { name: 'plafond', label: 'Plafond d\'encours (FCFA)', type: 'money', min: 0, value: 20000000, required: true }
    ];
  }
  function openForm(c) {
    U.formModal({ title: c ? 'Modifier le client' : 'Nouveau client', sub: c ? c.id : 'Fiche client de démonstration', fields: fields(), values: c || {}, okLabel: c ? 'Enregistrer' : 'Créer le client', size: 'lg',
      onSubmit: function (v) {
        v.tel = String(v.tel || '').replace(/\D/g, ''); v.delai = +v.delai || 0; v.plafond = +v.plafond || 0;
        if (c) {
          S.update('clients', c.id, v); E.log('Modification client', c.id + ' · ' + v.nom, MOD); U.toast('Client mis à jour'); E.rerender();
        } else {
          var n = Object.assign({ id: nextCid() }, v); S.add('clients', n);
          E.log('Création client', n.id + ' · ' + n.nom, MOD); U.toast('Client ' + n.id + ' créé'); setTimeout(function () { E.go('clients/' + n.id); }, 0);
        }
      } });
  }

  /* ---------------------------------------------------------------- liste */
  function filtered() {
    var q = E.norm(st.q);
    return all().filter(function (c) {
      if (st.type && c.type !== st.type) return false;
      if (st.risque === 'depasse' && pctPlafond(c) < 100) return false;
      if (st.risque === 'proche' && (pctPlafond(c) < 70)) return false;
      if (st.risque === 'encours' && encours(c.id) <= 0) return false;
      if (q && E.norm(c.nom + ' ' + c.type + ' ' + c.ville + ' ' + (c.contact || '') + ' ' + (c.email || '')).indexOf(q) < 0) return false;
      return true;
    });
  }
  var COLS = [
    { label: 'Client', render: function (c) { return '<b>' + esc(c.nom) + '</b><div class="small muted">' + esc(c.id) + ' · ' + esc(c.contact || '') + '</div>'; } },
    { label: 'Type', render: function (c) { return U.badge(c.type, 'blue'); } },
    { label: 'Ville', key: 'ville' },
    { label: 'Dossiers', num: true, render: function (c) { return dossiersOf(c.id).length; } },
    { label: 'Délai', num: true, render: function (c) { return c.delai + ' j'; } },
    { label: 'Encours', num: true, render: function (c) { return F.money(encours(c.id)); } },
    { label: 'Plafond utilisé', render: function (c) { var p = pctPlafond(c); return U.progress(Math.min(100, p), tonePct(p)); }, width: '170px' }
  ];
  function csvCols() {
    return [{ label: 'ID', key: 'id' }, { label: 'Raison sociale', key: 'nom' }, { label: 'Type', key: 'type' }, { label: 'Ville', key: 'ville' }, { label: 'Contact', key: 'contact' }, { label: 'Téléphone', key: 'tel' }, { label: 'E-mail', key: 'email' },
      { label: 'Délai (j)', key: 'delai' }, { label: 'Plafond (FCFA)', key: 'plafond' }, { label: 'Encours (FCFA)', csv: function (c) { return Math.round(encours(c.id)); } }, { label: 'Dossiers', csv: function (c) { return dossiersOf(c.id).length; } }];
  }
  function drawBody() {
    var rows = filtered(), box = E.$('#cl-body'); if (!box) return;
    E.$('#cl-count').textContent = rows.length + ' client' + (rows.length > 1 ? 's' : '');
    box.innerHTML = U.table(COLS, rows, { onRow: function (c) { E.go('clients/' + c.id); }, empty: 'Aucun client ne correspond à ces critères.' });
  }
  function renderList(view) {
    var rows = all(), enc = E.sum(rows, function (c) { return encours(c.id); }), proches = rows.filter(function (c) { return pctPlafond(c) >= 70; }).length;
    function sel(name, label, opts, val) { return '<select class="select" data-f="' + name + '"><option value="">' + label + '</option>' + opts.map(function (o) { var v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; }
    view.innerHTML =
      '<div class="section-title"><div><h2>Clients</h2><p>Importateurs, exportateurs, armateurs — fiches de démonstration</p></div><span class="spacer"></span>' +
      '<button class="btn" id="cl-csv">' + ic('download') + 'Exporter CSV</button><button class="btn primary" id="cl-new">' + ic('userplus') + 'Nouveau client</button></div>' +
      '<div class="grid g4" style="margin:14px 0">' +
      U.kpi({ label: 'Clients', value: rows.length, icon: 'users', tone: 'blue', foot: rows.filter(function (c) { return c.type === 'Armateur'; }).length + ' armateur(s)' }) +
      U.kpi({ label: 'Encours total', value: F.short(enc), unit: 'FCFA', icon: 'wallet', tone: 'orange', foot: 'Factures non soldées' }) +
      U.kpi({ label: 'Plafonds > 70 %', value: proches, icon: 'alert', tone: proches ? 'red' : 'green', foot: 'Clients à surveiller' }) +
      U.kpi({ label: 'Dossiers ouverts', value: S.all('dossiers').filter(function (d) { return d.step < 5; }).length, icon: 'box', tone: 'violet', foot: 'Tous clients confondus' }) + '</div>' +
      '<div class="filters"><input class="input" id="cl-q" placeholder="Rechercher un client…" value="' + esc(st.q) + '" style="min-width:220px">' +
      sel('type', 'Tous les types', TYPES, st.type) +
      sel('risque', 'Tous les encours', [{ v: 'encours', l: 'Avec encours' }, { v: 'proche', l: 'Plafond ≥ 70 %' }, { v: 'depasse', l: 'Plafond dépassé' }], st.risque) +
      '<span class="spacer"></span><span class="small muted" id="cl-count"></span></div><div class="card"><div class="card__b flush" id="cl-body"></div></div>';
    drawBody();
    E.$('#cl-q', view).oninput = function (e) { st.q = e.target.value; drawBody(); };
    E.$$('[data-f]', view).forEach(function (s) { s.onchange = function () { st[s.dataset.f] = s.value; drawBody(); }; });
    E.$('#cl-new', view).onclick = function () { openForm(); };
    E.$('#cl-csv', view).onclick = function () { U.exportCSV('clients-lsg-' + E.today(), csvCols(), filtered()); E.log('Export CSV', 'clients', MOD); };
  }

  /* ---------------------------------------------------------------- fiche */
  function renderFiche(view, id) {
    var c = S.get('clients', id);
    if (!c) { view.innerHTML = '<div class="card"><div class="empty">Client introuvable.<br><br><a class="btn" href="#/clients">' + ic('back') + 'Retour aux clients</a></div></div>'; return; }
    var ds = dossiersOf(id), fs = factsOf(id), enc = encours(id), p = pctPlafond(c), retard = fs.filter(function (f) { return factStatut(f) === 'En retard'; });
    var kv = function (rows) { return '<dl class="kv">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>'; };
    var msgTel = c.tel ? 'https://wa.me/' + String(c.tel).replace(/\D/g, '') + '?text=' + encodeURIComponent('Bonjour, ici LSG — Logistique Services Gabon. ') : '';
    view.innerHTML =
      '<div class="row" style="margin-bottom:12px"><a class="btn ghost sm" href="#/clients">' + ic('back') + 'Clients</a></div>' +
      '<div class="card"><div class="card__b"><div class="lsg-cl-head">' + U.avatar(c.nom) + '<div><h2>' + esc(c.nom) + '</h2><div class="row" style="margin-top:4px">' + U.badge(c.type, 'blue') + '<span class="muted small">' + esc(c.id) + ' · ' + esc(c.ville) + '</span></div></div>' +
      '<div class="lsg-cl-actions"><button class="btn" data-a="edit">' + ic('edit') + 'Modifier</button>' +
      (msgTel ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(msgTel) + '" data-a="wa">' + ic('send') + 'WhatsApp</a>' : '') +
      (c.email ? '<a class="btn" href="mailto:' + esc(c.email) + '">' + ic('mail') + 'E-mail</a>' : '') +
      (canGo('dossiers') ? '<button class="btn" data-a="dos">' + ic('box') + 'Nouveau dossier</button>' : '') +
      (canGo('facturation') ? '<button class="btn accent" data-a="fac">' + ic('invoice') + 'Nouvelle facture</button>' : '') + '</div></div></div></div>' +
      '<div class="grid g3" style="margin-top:16px">' +
      '<div class="card"><div class="card__h"><h3>Coordonnées</h3></div><div class="card__b">' + kv([
        ['Contact', esc(c.contact) || '—'], ['Téléphone', c.tel ? '+' + esc(c.tel) : '<span class="muted">non renseigné</span>'], ['E-mail', c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '—'], ['Ville', esc(c.ville)], ['Délai de paiement', c.delai + ' jours']]) + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Encours & plafond</h3></div><div class="card__b lsg-plaf">' + U.gauge(Math.min(100, p), 'du plafond utilisé', colorPct(p)) +
      '<div class="row"><span class="muted small">Encours</span><span class="spacer"></span><b>' + F.money(enc) + '</b></div>' +
      '<div class="row"><span class="muted small">Plafond</span><span class="spacer"></span><b style="font-size:14px">' + F.money(c.plafond) + '</b></div>' +
      '<div class="row"><span class="muted small">Disponible</span><span class="spacer"></span><b style="font-size:14px">' + F.money(Math.max(0, c.plafond - enc)) + '</b></div>' +
      (p >= 100 ? '<div class="alert tone-red">' + ic('alert') + '<div>Plafond dépassé : ne pas ouvrir de nouveau dossier sans validation.</div></div>' : retard.length ? '<div class="alert tone-orange">' + ic('alert') + '<div>' + retard.length + ' facture(s) en retard de paiement.</div></div>' : '') + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Activité</h3></div><div class="card__b">' + kv([
        ['Dossiers', ds.length + ' dont ' + ds.filter(function (d) { return d.step < 5; }).length + ' en cours'], ['Factures', fs.length + ' émise(s)'], ['Facturé au total', F.money(E.sum(fs, 'total'))], ['Encaissé', F.money(E.sum(fs, 'paye'))]]) + '</div></div></div>' +
      '<div class="grid g2" style="margin-top:16px">' +
      '<div class="card"><div class="card__h"><h3>Dossiers</h3><span class="sub">' + ds.length + '</span></div><div class="card__b flush">' + U.table([
        { label: 'Dossier', render: function (d) { return '<b class="mono">' + esc(d.id) + '</b>'; } },
        { label: 'Marchandise', render: function (d) { return esc(d.desc); } },
        { label: 'Étape', render: function (d) { return U.badge(STEPS[d.step], d.step === 5 ? 'green' : 'blue'); } }
      ], ds, { empty: 'Aucun dossier pour ce client.', onRow: canGo('dossiers') ? function (d) { E.go('dossiers/' + d.id); } : null }) + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Factures</h3><span class="sub">' + fs.length + '</span></div><div class="card__b flush">' + U.table([
        { label: 'Facture', render: function (f) { return '<b class="mono">' + esc(f.id) + '</b>'; } },
        { label: 'Échéance', render: function (f) { return F.dateShort(f.echeance); } },
        { label: 'Solde', num: true, render: function (f) { return F.money(solde(f)); } },
        { label: 'Statut', render: function (f) { return U.badge(factStatut(f)); } }
      ], fs, { empty: 'Aucune facture pour ce client.', onRow: canGo('facturation') ? function (f) { E.go('facturation/' + f.id); } : null }) + '</div></div></div>';
    view.onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'edit') openForm(c);
      else if (b.dataset.a === 'dos') E.go('dossiers/nouveau/' + c.id);
      else if (b.dataset.a === 'fac') E.go('facturation/nouvelle/' + c.id);
      else if (b.dataset.a === 'wa') E.log('Contact WhatsApp client', c.id, MOD);
    };
  }

  function render(view, params) { if (params && params[0]) renderFiche(view, params[0]); else renderList(view); }
  function search(q) {
    return all().filter(function (c) { return E.norm(c.nom + ' ' + c.type + ' ' + c.ville + ' ' + (c.contact || '')).indexOf(q) >= 0; })
      .map(function (c) { return { title: c.nom, sub: 'Client · ' + c.type + ' · encours ' + F.money(encours(c.id)), href: '#/clients/' + c.id }; });
  }

  E.register({
    id: MOD, label: 'Clients', title: 'Clients', icon: 'users', group: 'Commercial & Finances', roles: ['transit', 'finance'],
    render: render, search: search
  });
})();
