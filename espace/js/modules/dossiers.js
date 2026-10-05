/* LSG · Module « Dossiers de transit » — liste, kanban par étape, fiche dossier, checklist de documents,
   avancement, WhatsApp client, création de facture, impression. Données de démonstration. */
(function () {
  'use strict';
  var E = ERP, S = E.store, U = E.ui, F = E.fmt, esc = E.esc, ic = E.icon;
  var MOD = 'dossiers';
  var STEPS = window.LSG.STEPS, DOCS = window.LSG.DOCS;
  var STEP_TONE = ['grey', 'blue', 'violet', 'orange', 'yellow', 'green'];
  var TYPES = ['Aérien', 'Maritime', 'Express', 'Consignation'];
  var AGENCES = ['Libreville', 'Owendo', 'Port-Gentil'];
  var RESP = { 'Aérien': 'E-02', 'Maritime': 'E-03', 'Express': 'E-07', 'Consignation': 'E-05' };
  var st = { vue: 'liste', q: '', type: '', agence: '', step: '', sens: '' };

  /* styles propres au module */
  (function () {
    if (document.getElementById('lsg-dossiers-css')) return;
    var s = document.createElement('style'); s.id = 'lsg-dossiers-css';
    s.textContent =
      '.lsg-docs{display:flex;flex-direction:column}' +
      '.lsg-doc{display:flex;gap:12px;align-items:center;padding:11px 18px;border-bottom:1px solid var(--line-2);cursor:pointer}' +
      '.lsg-doc:last-child{border-bottom:0}.lsg-doc:hover{background:#f8fafd}' +
      '.lsg-doc input{width:18px;height:18px;accent-color:var(--green);flex:none;cursor:pointer}' +
      '.lsg-doc.ok span{color:var(--ink)}.lsg-doc span{color:var(--ink-2);flex:1}' +
      '.lsg-head{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}' +
      '.lsg-head h2{font-size:22px}.lsg-head .lsg-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}' +
      '.lsg-actions{display:flex;gap:8px;flex-wrap:wrap}' +
      '.lsg-route{display:flex;align-items:center;gap:8px;font-weight:600}.lsg-route svg{width:16px;color:var(--ink-3)}' +
      '.lsg-kcard-id{display:flex;gap:6px;align-items:center;justify-content:space-between}' +
      '.lsg-kcard .btn{align-self:flex-start}' +
      '.lsg-late{color:var(--red);font-weight:600}' +
      '@media (max-width:640px){.lsg-actions .btn{flex:1 1 46%}.kanban{grid-auto-columns:minmax(78vw,1fr)}}';
    document.head.appendChild(s);
  })();

  /* ---------------------------------------------------------------- utilitaires */
  function all() { return S.all('dossiers'); }
  function user() { var u = E.session.user(); return u ? u.name : 'Système'; }
  function isAdmin() { var u = E.session.user(); return !!u && u.profile === 'admin'; }
  function cli(id) { return S.get('clients', id); }
  function cliNom(id) { return E.clientName(id); }
  function manquants(d) { return DOCS.filter(function (x) { return !(d.docs && d.docs[x[0]]); }); }
  function isLate(d) { return !!d.eta && d.eta < E.today() && d.step < 5; }
  function stepBadge(d) { return U.badge(STEPS[d.step], STEP_TONE[d.step]); }
  function etaCell(d) { return isLate(d) ? '<span class="lsg-late">' + F.dateShort(d.eta) + ' · retard ' + E.daysBetween(d.eta, E.today()) + ' j</span>' : F.dateShort(d.eta); }
  function typeIcon(t) { return t === 'Maritime' || t === 'Consignation' ? 'ship' : t === 'Express' ? 'send' : 'globe'; }
  function siteUrl(p) { try { return new URL(p, location.href).href; } catch (e) { return p; } }
  function addHisto(d, step, note) { d.histo = d.histo || []; d.histo.push({ step: step, at: new Date().toISOString(), by: user(), note: note }); }
  function nextId(prefix, col) {
    var max = 0; S.all(col).forEach(function (x) { var n = parseInt(String(x.id).split('-').pop(), 10); if (n > max) max = n; });
    var id, n, guard = 0;
    do { id = S.next(prefix); n = parseInt(id.split('-').pop(), 10); guard++; } while ((n <= max || S.get(col, id)) && guard < 2000);
    return id;
  }
  function printDoc(title, body) {
    var w = window.open('', '_blank');
    if (!w) { U.toast('Autorisez les fenêtres surgissantes pour imprimer.', 'err'); return; }
    var css = 'body{font-family:Arial,Helvetica,sans-serif;color:#0d1b2a;margin:28px;font-size:13px}h1{font-size:20px;color:#0a3556;margin:0 0 4px}h2{font-size:14px;margin:22px 0 8px;color:#0a3556;border-bottom:1px solid #d5dde8;padding-bottom:4px}' +
      '.hd{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #1db6ea;padding-bottom:12px;margin-bottom:16px}.hd img{height:54px}.hd small{display:block;color:#44536a;line-height:1.5}' +
      'table{width:100%;border-collapse:collapse}td,th{padding:6px 8px;border-bottom:1px solid #e3e8ef;text-align:left;vertical-align:top}th{background:#f2f7fa;font-size:11px;text-transform:uppercase;color:#44536a}' +
      '.kv td:first-child{width:34%;color:#44536a}.foot{margin-top:28px;font-size:11px;color:#7a879a;border-top:1px solid #d5dde8;padding-top:8px}';
    w.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + css + '</style></head><body>' + body + '</body></html>');
    w.document.close(); w.focus(); setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
  }

  /* ---------------------------------------------------------------- actions métier */
  function advance(id, after) {
    var d = S.get('dossiers', id); if (!d) return;
    if (d.step >= 5) { U.toast('Ce dossier est déjà livré.', 'err'); return; }
    if (d.step === 0) {
      var m = manquants(d);
      if (m.length) { U.toast('Impossible de vérifier les documents : il manque ' + m.map(function (x) { return x[1].split(' (')[0].toLowerCase(); }).join(', ') + '.', 'err'); return; }
    }
    var ns = d.step + 1;
    d.step = ns; addHisto(d, ns, 'Étape « ' + STEPS[ns] + ' » atteinte.'); S.save();
    E.log('Avancement dossier', id + ' → ' + STEPS[ns], MOD);
    E.notify('Dossier ' + id, 'Passé à l\'étape « ' + STEPS[ns] + ' » — ' + cliNom(d.client), '#/dossiers/' + id, ns === 5 ? 'green' : 'blue');
    U.toast(id + ' : ' + STEPS[ns]);
    if (after) after(); else E.rerender();
  }
  function retreat(id) {
    var d = S.get('dossiers', id); if (!d || d.step <= 0) return;
    if (!isAdmin()) { U.toast('Seule la direction peut reculer une étape.', 'err'); return; }
    U.confirm('Reculer d\'une étape', 'Le dossier <b>' + esc(id) + '</b> repassera à l\'étape « ' + esc(STEPS[d.step - 1]) + ' ».', 'Reculer', function () {
      d.step -= 1; addHisto(d, d.step, 'Retour à l\'étape « ' + STEPS[d.step] + ' » (correction).'); S.save();
      E.log('Recul de dossier', id + ' → ' + STEPS[d.step], MOD); U.toast('Étape corrigée'); E.rerender();
    }, 'danger');
  }
  function toggleDoc(id, key, val) {
    var d = S.get('dossiers', id); if (!d) return;
    var lab = (DOCS.filter(function (x) { return x[0] === key; })[0] || [key, key])[1];
    d.docs = d.docs || {}; d.docs[key] = !!val;
    addHisto(d, d.step, (val ? 'Document reçu : ' : 'Document marqué manquant : ') + lab + '.'); S.save();
    E.log(val ? 'Document reçu' : 'Document retiré', id + ' · ' + lab, MOD); E.rerender();
  }
  function addNote(id) {
    var d = S.get('dossiers', id); if (!d) return;
    U.formModal({ title: 'Ajouter une note', sub: id, fields: [{ name: 'note', label: 'Note (visible dans l\'historique)', type: 'textarea', required: true }], okLabel: 'Ajouter',
      onSubmit: function (v) { addHisto(d, d.step, v.note); S.save(); E.log('Note de dossier', id, MOD); U.toast('Note ajoutée'); E.rerender(); } });
  }
  function whatsapp(id) {
    var d = S.get('dossiers', id); if (!d) return;
    var c = cli(d.client);
    function send(tel) {
      tel = String(tel).replace(/\D/g, '');
      var msg = 'Bonjour, ici LSG — Logistique Services Gabon.\nVotre dossier n° ' + d.id + ' (' + d.desc + ') est à l\'étape : « ' + STEPS[d.step] + ' ».\n' +
        (d.eta ? 'Arrivée prévue : ' + F.date(d.eta) + '.\n' : '') + 'Suivi en ligne : ' + siteUrl('../index.html#suivi') + '\nCordialement, l\'équipe LSG.';
      window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      addHisto(d, d.step, 'Client prévenu par WhatsApp (étape « ' + STEPS[d.step] + ' »).'); S.save();
      E.log('Message WhatsApp client', id, MOD); E.rerender();
    }
    var tel = d.tel || (c && c.tel);
    if (tel) return send(tel);
    U.formModal({ title: 'Numéro WhatsApp du client', sub: 'Aucun numéro enregistré pour ' + cliNom(d.client), okLabel: 'Ouvrir WhatsApp',
      fields: [{ name: 'tel', label: 'Numéro (indicatif inclus, ex. 241…)', required: true, placeholder: '241XXXXXXXX' }],
      onSubmit: function (v) { if (String(v.tel).replace(/\D/g, '').length < 8) { U.toast('Numéro invalide.', 'err'); return false; } d.tel = String(v.tel).replace(/\D/g, ''); S.save(); send(d.tel); } });
  }
  function lignesFor(d) {
    var t = d.type, l = [];
    if (t === 'Aérien') l = [['Transit aérien — ' + d.desc, 1, 1100000], ['Dédouanement', 1, 450000], ['Livraison porte à porte', 1, 100000]];
    else if (t === 'Maritime') l = d.sens === 'Export'
      ? [['Transit maritime export — ' + d.desc, 1, 1450000], ['Déclaration d\'exportation', 1, 600000], ['Manutention portuaire', 1, 450000]]
      : [['Transit maritime — ' + d.desc, 1, 1450000], ['Dédouanement', 1, 900000], ['Camionnage', 1, 380000]];
    else if (t === 'Express') l = [['Transit express et dédouanement', 1, 380000], ['Livraison porte à porte', 1, 120000]];
    else l = [['Assistance escale — formalités', 1, 3200000], ['Frais d\'agence', 1, 1800000]];
    return l.map(function (x) { return { l: x[0], qte: x[1], pu: x[2] }; });
  }
  function createInvoice(id) {
    var d = S.get('dossiers', id); if (!d) return;
    if (d.facture && S.get('factures', d.facture)) { E.go('facturation/' + d.facture); return; }
    var c = cli(d.client), delai = c && c.delai != null ? c.delai : 30;
    U.confirm('Créer la facture', 'Une facture sera créée pour <b>' + esc(cliNom(d.client)) + '</b> à partir du dossier <b>' + esc(id) + '</b> (lignes pré-remplies, modifiables dans l\'espace Facturation).', 'Créer la facture', function () {
      var f = { id: nextId('FAC', 'factures'), client: d.client, dossier: d.id, date: E.today(), echeance: E.addDays(E.today(), delai), paye: 0, lignes: lignesFor(d) };
      f.total = f.lignes.reduce(function (a, x) { return a + x.qte * x.pu; }, 0);
      S.add('factures', f, 'FAC');
      d.facture = f.id; addHisto(d, d.step, 'Facture ' + f.id + ' créée.'); S.save();
      E.log('Facture créée depuis dossier', f.id + ' ← ' + id, MOD);
      E.notify('Facture à vérifier', f.id + ' · ' + cliNom(d.client) + ' · ' + F.money(f.total), '#/facturation/' + f.id, 'orange');
      U.toast('Facture ' + f.id + ' créée'); E.go('facturation/' + f.id);
    });
  }
  function printFiche(id) {
    var d = S.get('dossiers', id); if (!d) return;
    var logo = siteUrl('../assets/img/logo.png');
    var kv = [['Client', cliNom(d.client)], ['Type / sens', d.type + ' · ' + d.sens], ['Trajet', d.origine + ' → ' + d.destination], ['Agence', d.agence], ['Description', d.desc], ['Colis / poids', d.colis + ' colis · ' + F.num(d.poids) + ' kg'], ['Valeur déclarée', F.money(d.valeur)], ['Titre de transport', d.transport], ['Ouvert le', F.date(d.ouvert)], ['Arrivée prévue (ETA)', F.date(d.eta)], ['Responsable', E.empName(d.responsable)], ['Étape actuelle', STEPS[d.step]]];
    var body = '<div class="hd"><div><img src="' + esc(logo) + '" alt="LSG"></div><div style="text-align:right"><b>Logistique Services Gabon</b><small>BP 217 Zone Fret Aéroportuaire, Libreville<br>+241 11 44 27 27 · info.lsg@lsg-gabon.com</small></div></div>' +
      '<h1>Fiche dossier ' + esc(d.id) + '</h1><div>Édité le ' + F.date(E.today()) + '</div>' +
      '<h2>Informations</h2><table class="kv">' + kv.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td><b>' + esc(r[1]) + '</b></td></tr>'; }).join('') + '</table>' +
      '<h2>Documents</h2><table>' + DOCS.map(function (x) { return '<tr><td style="width:30px">' + (d.docs && d.docs[x[0]] ? '☑' : '☐') + '</td><td>' + esc(x[1]) + '</td><td>' + (d.docs && d.docs[x[0]] ? 'Fourni' : 'Manquant') + '</td></tr>'; }).join('') + '</table>' +
      '<h2>Historique</h2><table><tr><th>Date</th><th>Étape</th><th>Par</th><th>Note</th></tr>' + (d.histo || []).slice().reverse().map(function (h) { return '<tr><td>' + esc(F.datetime(h.at)) + '</td><td>' + esc(STEPS[h.step]) + '</td><td>' + esc(h.by) + '</td><td>' + esc(h.note) + '</td></tr>'; }).join('') + '</table>' +
      '<div class="foot">Document de démonstration — données fictives. Logistique Services Gabon · Transit – Douanes – Consignation.</div>';
    printDoc('Fiche dossier ' + d.id, body);
    E.log('Impression fiche dossier', id, MOD);
  }

  /* ---------------------------------------------------------------- création */
  function openCreate(clientId) {
    var cl = E.options('clients', 'nom');
    var m = U.formModal({ title: 'Nouveau dossier de transit', sub: 'Le numéro de suivi est attribué automatiquement', size: 'lg', okLabel: 'Créer le dossier',
      fields: [
        { name: 'client', label: 'Client', type: 'select', options: cl, required: true, value: clientId || '' },
        { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
        { name: 'sens', label: 'Sens', type: 'select', options: ['Import', 'Export'], required: true },
        { name: 'agence', label: 'Agence', type: 'select', options: AGENCES, required: true },
        { name: 'origine', label: 'Origine', required: true, placeholder: 'ex. Paris (CDG)' },
        { name: 'destination', label: 'Destination', required: true, placeholder: 'ex. Libreville' },
        { name: 'desc', label: 'Description de la marchandise', required: true, full: true },
        { name: 'colis', label: 'Nombre de colis', type: 'number', value: 1, min: 0 },
        { name: 'poids', label: 'Poids (kg)', type: 'number', value: 0, min: 0 },
        { name: 'valeur', label: 'Valeur déclarée (FCFA)', type: 'money', value: 0, min: 0 },
        { name: 'transport', label: 'N° LTA / connaissement', placeholder: 'ex. LTA 057-0000 0000' },
        { name: 'eta', label: 'Arrivée prévue (ETA)', type: 'date', required: true, value: E.addDays(E.today(), 7) },
        { name: 'tel', label: 'WhatsApp du client (optionnel)', placeholder: '241XXXXXXXX', help: 'Laissé vide : le numéro de la fiche client sera utilisé.' }
      ],
      onSubmit: function (v, close) {
        var c = cli(v.client), id = nextId('LSG', 'dossiers');
        var docs = {}; DOCS.forEach(function (x) { docs[x[0]] = false; });
        var d = { id: id, client: v.client, type: v.type, sens: v.sens, origine: v.origine, destination: v.destination, agence: v.agence, desc: v.desc, colis: +v.colis || 0, poids: +v.poids || 0, valeur: +v.valeur || 0, transport: v.transport || '', step: 0, ouvert: E.today(), eta: v.eta, docs: docs, responsable: RESP[v.type] || 'E-02', tel: String(v.tel || (c && c.tel) || '').replace(/\D/g, ''),
          histo: [{ step: 0, at: new Date().toISOString(), by: user(), note: 'Dossier ouvert.' }] };
        S.add('dossiers', d, 'LSG');
        E.log('Création de dossier', id + ' · ' + cliNom(v.client), MOD);
        E.notify('Nouveau dossier', id + ' — ' + cliNom(v.client) + ' · ' + v.type, '#/dossiers/' + id, 'blue');
        U.toast('Dossier ' + id + ' créé'); setTimeout(function () { E.go('dossiers/' + id); }, 0);
      } });
    return m;
  }

  /* ---------------------------------------------------------------- liste & kanban */
  function filtered() {
    var q = E.norm(st.q);
    return all().filter(function (d) {
      if (st.type && d.type !== st.type) return false;
      if (st.agence && d.agence !== st.agence) return false;
      if (st.sens && d.sens !== st.sens) return false;
      if (st.step !== '' && String(d.step) !== String(st.step)) return false;
      if (q && E.norm(d.id + ' ' + cliNom(d.client) + ' ' + d.desc + ' ' + d.transport + ' ' + d.origine + ' ' + d.destination).indexOf(q) < 0) return false;
      return true;
    });
  }
  var COLS = [
    { label: 'Dossier', render: function (d) { return '<b class="mono">' + esc(d.id) + '</b>'; } },
    { label: 'Client', render: function (d) { return esc(cliNom(d.client)); } },
    { label: 'Type', render: function (d) { return U.badge(d.type + ' · ' + d.sens, d.sens === 'Export' ? 'violet' : 'blue'); } },
    { label: 'Trajet', render: function (d) { return esc(d.origine) + ' → ' + esc(d.destination); } },
    { label: 'Étape', render: stepBadge },
    { label: 'ETA', render: etaCell },
    { label: 'Agence', key: 'agence' }
  ];
  function csvCols() {
    return [{ label: 'N°', key: 'id' }, { label: 'Client', csv: function (d) { return cliNom(d.client); } }, { label: 'Type', key: 'type' }, { label: 'Sens', key: 'sens' }, { label: 'Origine', key: 'origine' }, { label: 'Destination', key: 'destination' }, { label: 'Agence', key: 'agence' },
      { label: 'Description', key: 'desc' }, { label: 'Colis', key: 'colis' }, { label: 'Poids (kg)', key: 'poids' }, { label: 'Valeur (FCFA)', key: 'valeur' }, { label: 'Transport', key: 'transport' }, { label: 'Étape', csv: function (d) { return STEPS[d.step]; } },
      { label: 'Ouvert le', key: 'ouvert' }, { label: 'ETA', key: 'eta' }, { label: 'En retard', csv: function (d) { return isLate(d) ? 'Oui' : 'Non'; } }, { label: 'Facture', csv: function (d) { return d.facture || ''; } }];
  }
  function kanbanHtml(rows) {
    return '<div class="kanban">' + STEPS.map(function (s, i) {
      var items = rows.filter(function (d) { return d.step === i; });
      return '<div class="kcol"><div class="kcol__h"><span class="badge plain ' + U.TONES[STEP_TONE[i]] + '">' + (i + 1) + '</span>' + esc(s) + '<span class="n">' + items.length + '</span></div>' +
        (items.length ? items.map(function (d) {
          return '<div class="kcard lsg-kcard" data-go="' + esc(d.id) + '"><div class="lsg-kcard-id"><b class="mono">' + esc(d.id) + '</b>' + (isLate(d) ? '<span class="badge tone-red plain">Retard</span>' : '') + '</div>' +
            '<div>' + esc(cliNom(d.client)) + '</div><div class="small muted">' + esc(d.desc) + '</div>' +
            '<div class="meta">' + ic(typeIcon(d.type)).replace('<svg ', '<svg width="13" height="13" ') + esc(d.type) + ' · ' + esc(d.sens) + ' · ETA ' + F.dateShort(d.eta) + '</div>' +
            (i < 5 ? '<button class="btn sm" data-adv="' + esc(d.id) + '">Étape suivante ' + ic('arrow') + '</button>' : '') + '</div>';
        }).join('') : '<div class="small muted center" style="padding:14px 0">Aucun dossier</div>') + '</div>';
    }).join('') + '</div>';
  }
  function drawBody() {
    var rows = filtered(), box = E.$('#ds-body'); if (!box) return;
    E.$('#ds-count').textContent = rows.length + ' dossier' + (rows.length > 1 ? 's' : '');
    if (st.vue === 'kanban') box.innerHTML = kanbanHtml(rows);
    else box.innerHTML = '<div class="card"><div class="card__b flush">' + U.table(COLS, rows, { onRow: function (d) { E.go('dossiers/' + d.id); }, empty: 'Aucun dossier ne correspond à ces filtres.' }) + '</div></div>';
  }
  function renderList(view) {
    view.onclick = null;
    var rows = all(), enCours = rows.filter(function (d) { return d.step < 5; });
    function sel(name, label, opts, val) { return '<select class="select" data-f="' + name + '"><option value="">' + label + '</option>' + opts.map(function (o) { var v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; }
    view.innerHTML =
      '<div class="section-title"><div><h2>Dossiers de transit</h2><p>Suivi des marchandises de la réception à la livraison · démonstration</p></div><span class="spacer"></span>' +
      '<button class="btn" id="ds-csv">' + ic('download') + 'Exporter CSV</button><button class="btn primary" id="ds-new">' + ic('plus') + 'Nouveau dossier</button></div>' +
      '<div class="grid g4" style="margin:14px 0">' +
      U.kpi({ label: 'Dossiers en cours', value: enCours.length, icon: 'box', tone: 'blue', foot: rows.length + ' dossiers au total' }) +
      U.kpi({ label: 'En douane', value: rows.filter(function (d) { return d.step === 2; }).length, icon: 'shield', tone: 'violet', foot: 'Déclaration déposée' }) +
      U.kpi({ label: 'En retard d\'ETA', value: rows.filter(isLate).length, icon: 'alert', tone: 'red', foot: 'Arrivée prévue dépassée' }) +
      U.kpi({ label: 'Livrés', value: rows.filter(function (d) { return d.step === 5; }).length, icon: 'check', tone: 'green', foot: 'Dossiers clôturés' }) + '</div>' +
      '<div class="filters"><input class="input" id="ds-q" placeholder="Rechercher (n°, client, marchandise…)" value="' + esc(st.q) + '" style="min-width:220px">' +
      sel('type', 'Tous les types', TYPES, st.type) + sel('sens', 'Import / export', ['Import', 'Export'], st.sens) + sel('agence', 'Toutes les agences', AGENCES, st.agence) +
      sel('step', 'Toutes les étapes', STEPS.map(function (s, i) { return { v: i, l: s }; }), st.step) +
      '<span class="spacer"></span><span class="small muted" id="ds-count"></span>' +
      '<div class="chips"><button class="chip' + (st.vue === 'liste' ? ' is-active' : '') + '" data-vue="liste">Liste</button><button class="chip' + (st.vue === 'kanban' ? ' is-active' : '') + '" data-vue="kanban">Kanban par étape</button></div></div>' +
      '<div id="ds-body"></div>';
    drawBody();
    E.$('#ds-q', view).oninput = function (e) { st.q = e.target.value; drawBody(); };
    E.$$('[data-f]', view).forEach(function (s) { s.onchange = function () { st[s.dataset.f] = s.value; drawBody(); }; });
    E.$$('[data-vue]', view).forEach(function (b) { b.onclick = function () { st.vue = b.dataset.vue; E.$$('[data-vue]', view).forEach(function (x) { x.classList.toggle('is-active', x === b); }); drawBody(); }; });
    E.$('#ds-new', view).onclick = function () { openCreate(); };
    E.$('#ds-csv', view).onclick = function () { U.exportCSV('dossiers-lsg-' + E.today(), csvCols(), filtered()); E.log('Export CSV', 'dossiers', MOD); };
    E.$('#ds-body', view).addEventListener('click', function (e) {
      var a = e.target.closest('[data-adv]'); if (a) { e.stopPropagation(); advance(a.dataset.adv); return; }
      var c = e.target.closest('[data-go]'); if (c) E.go('dossiers/' + c.dataset.go);
    });
  }

  /* ---------------------------------------------------------------- fiche dossier */
  function renderFiche(view, id) {
    var d = S.get('dossiers', id);
    if (!d) { view.innerHTML = '<div class="card"><div class="empty">Dossier introuvable.<br><br><a class="btn" href="#/dossiers">' + ic('back') + 'Retour aux dossiers</a></div></div>'; return; }
    var c = cli(d.client), mq = manquants(d), late = isLate(d), fac = d.facture && S.get('factures', d.facture);
    var histo = (d.histo || []).slice().reverse();
    var kv = function (rows) { return '<dl class="kv">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>'; };
    view.innerHTML =
      '<div class="row no-print" style="margin-bottom:12px"><a class="btn ghost sm" href="#/dossiers">' + ic('back') + 'Dossiers</a></div>' +
      '<div class="card"><div class="card__b"><div class="lsg-head"><div style="flex:1;min-width:240px"><h2 class="mono" style="font-family:Sora,sans-serif">' + esc(d.id) + '</h2>' +
      '<div class="lsg-meta">' + stepBadge(d) + U.badge(d.type, 'blue') + U.badge(d.sens, d.sens === 'Export' ? 'violet' : 'grey') + U.badge(d.agence, 'navy') + (late ? U.badge('ETA dépassée', 'red') : '') + '</div>' +
      '<div style="margin-top:10px">' + esc(d.desc) + '</div></div>' +
      '<div class="lsg-actions">' +
      (d.step < 5 ? '<button class="btn primary" data-a="adv">' + ic('arrow') + 'Étape suivante</button>' : '') +
      '<button class="btn" data-a="wa" style="border-color:#bfe7cd;color:#0f7a3a">' + ic('send') + 'Prévenir le client sur WhatsApp</button>' +
      '<button class="btn accent" data-a="fac">' + ic('invoice') + (fac ? 'Voir la facture ' + esc(fac.id) : 'Créer la facture') + '</button>' +
      '<button class="btn" data-a="note">' + ic('edit') + 'Ajouter une note</button>' +
      '<button class="btn" data-a="print">' + ic('print') + 'Imprimer la fiche</button>' +
      (isAdmin() && d.step > 0 ? '<button class="btn danger" data-a="back">Reculer d\'une étape</button>' : '') + '</div></div></div></div>' +
      '<div class="card" style="margin-top:16px"><div class="card__h"><h3>Progression</h3><span class="sub">' + esc(STEPS[d.step]) + ' · étape ' + (d.step + 1) + ' sur ' + STEPS.length + '</span></div><div class="card__b">' + U.steps(STEPS, d.step, { finished: d.step === 5 }) + '</div></div>' +
      '<div class="grid g-2-1" style="margin-top:16px">' +
        '<div class="stack">' +
          '<div class="card"><div class="card__h"><h3>Informations du dossier</h3></div><div class="card__b">' + kv([
            ['Client', c ? '<a href="#/clients/' + esc(c.id) + '">' + esc(c.nom) + '</a>' : esc(cliNom(d.client))],
            ['Trajet', '<span class="lsg-route">' + esc(d.origine) + ic('arrow') + esc(d.destination) + '</span>'],
            ['Mode de transport', esc(d.type) + ' · ' + esc(d.sens)],
            ['Titre de transport', esc(d.transport) || '—'],
            ['Colis / poids', d.colis + ' colis · ' + F.num(d.poids) + ' kg'],
            ['Valeur déclarée', F.money(d.valeur)],
            ['Ouvert le', F.date(d.ouvert)],
            ['Arrivée prévue (ETA)', etaCell(d).replace('lsg-late', 'lsg-late') + ''],
            ['Responsable', esc(E.empName(d.responsable))],
            ['WhatsApp client', d.tel ? '+' + esc(d.tel) : '<span class="muted">non renseigné</span>'],
            ['Facture', fac ? '<a href="#/facturation/' + esc(fac.id) + '">' + esc(fac.id) + '</a> · ' + F.money(fac.total) : '<span class="muted">pas encore facturé</span>']
          ]) + '</div></div>' +
          '<div class="card"><div class="card__h"><h3>Documents à fournir</h3><span class="sub">' + (DOCS.length - mq.length) + ' / ' + DOCS.length + ' reçus</span><span class="spacer"></span>' + (mq.length ? U.badge(mq.length + ' manquant' + (mq.length > 1 ? 's' : ''), 'orange') : U.badge('Complet', 'green')) + '</div>' +
          '<div class="card__b flush"><div class="lsg-docs">' + DOCS.map(function (x) { var ok = d.docs && d.docs[x[0]]; return '<label class="lsg-doc' + (ok ? ' ok' : '') + '"><input type="checkbox" data-doc="' + x[0] + '"' + (ok ? ' checked' : '') + '><span>' + esc(x[1]) + '</span>' + (ok ? U.badge('Fourni', 'green') : U.badge('Manquant', 'orange')) + '</label>'; }).join('') + '</div></div>' +
          (d.step === 0 ? '<div class="card__b small muted" style="border-top:1px solid var(--line-2)">' + ic('info').replace('<svg ', '<svg width="14" height="14" style="vertical-align:-2px;margin-right:4px" ') + 'Tous les documents doivent être fournis pour passer à l\'étape « ' + esc(STEPS[1]) + ' ».</div>' : '') + '</div>' +
        '</div>' +
        '<div class="card"><div class="card__h"><h3>Historique</h3><span class="sub">' + histo.length + ' événement' + (histo.length > 1 ? 's' : '') + '</span></div><div class="card__b"><div class="timeline">' +
          histo.map(function (h, i) { return '<div class="tl-item ' + (i === 0 ? 'current' : 'done') + '"><b>' + esc(STEPS[h.step]) + '</b><span>' + esc(F.datetime(h.at)) + ' · ' + esc(h.by) + '</span><div class="small" style="margin-top:2px">' + esc(h.note) + '</div></div>'; }).join('') + '</div></div></div>' +
      '</div>';
    view.onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'adv') advance(id); else if (a === 'back') retreat(id); else if (a === 'note') addNote(id);
      else if (a === 'wa') whatsapp(id); else if (a === 'fac') createInvoice(id); else if (a === 'print') printFiche(id);
    };
    E.$$('[data-doc]', view).forEach(function (cb) { cb.onchange = function () { toggleDoc(id, cb.dataset.doc, cb.checked); }; });
  }

  function render(view, params) {
    if (params && params[0] === 'nouveau') { renderList(view); setTimeout(function () { openCreate(params[1]); }, 30); }
    else if (params && params[0]) renderFiche(view, params[0]);
    else renderList(view);
  }

  /* ---------------------------------------------------------------- intégration */
  function search(q) {
    return all().filter(function (d) { return E.norm(d.id + ' ' + cliNom(d.client) + ' ' + d.desc + ' ' + d.transport).indexOf(q) >= 0; })
      .map(function (d) { return { title: d.id + ' · ' + cliNom(d.client), sub: d.type + ' · ' + STEPS[d.step], href: '#/dossiers/' + d.id }; });
  }
  function summary() {
    var rows = all();
    return [
      { label: 'Dossiers en cours', value: String(rows.filter(function (d) { return d.step < 5; }).length), icon: 'box', tone: 'blue', foot: rows.filter(function (d) { return d.step === 5; }).length + ' livrés', href: '#/dossiers' },
      { label: 'En douane', value: String(rows.filter(function (d) { return d.step === 2; }).length), icon: 'shield', tone: 'violet', foot: 'Déclaration déposée', href: '#/dossiers' },
      { label: 'En retard d\'ETA', value: String(rows.filter(isLate).length), icon: 'alert', tone: 'red', foot: 'Dossiers non livrés', href: '#/dossiers' }
    ];
  }

  E.register({
    id: MOD, label: 'Dossiers de transit', title: 'Dossiers de transit', icon: 'box', group: 'Opérations', roles: ['transit', 'douane'],
    seed: function () { return { dossiers: JSON.parse(JSON.stringify(window.LSG.dossiers)) }; },
    render: render, search: search, summary: summary,
    badge: function () { return all().filter(isLate).length; }
  });
})();
