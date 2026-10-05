/* LSG · Module « Facturation » — factures clients, encaissements (total / partiel), relances WhatsApp & e-mail,
   création de facture, impression, export CSV. Données de démonstration (montants fictifs). */
(function () {
  'use strict';
  var E = ERP, S = E.store, U = E.ui, F = E.fmt, esc = E.esc, ic = E.icon;
  var MOD = 'facturation';
  var MODES = ['Virement bancaire', 'Chèque', 'Espèces', 'Mobile money'];
  var STATUTS = ['Émise', 'Partiellement payée', 'En retard', 'Payée'];
  var st = { q: '', statut: '', client: '' };

  var INV_CSS = '.lsg-inv{font-family:Arial,Helvetica,sans-serif;color:#0d1b2a;font-size:13px;position:relative}' +
    '.lsg-inv .hd{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #1db6ea;padding-bottom:14px;margin-bottom:18px;flex-wrap:wrap}' +
    '.lsg-inv .hd img{height:54px;background:#fff}.lsg-inv .hd small{display:block;color:#44536a;line-height:1.55}' +
    '.lsg-inv h1{font-size:22px;color:#0a3556;margin:0 0 4px;font-family:Sora,Arial,sans-serif}' +
    '.lsg-inv .parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0 18px}' +
    '.lsg-inv .box{border:1px solid #d5dde8;border-radius:8px;padding:10px 12px;line-height:1.55}.lsg-inv .box b{color:#0a3556}' +
    '.lsg-inv table{width:100%;border-collapse:collapse}.lsg-inv th,.lsg-inv td{padding:8px 10px;border-bottom:1px solid #e3e8ef;text-align:left;vertical-align:top}' +
    '.lsg-inv th{background:#f2f7fa;font-size:11px;text-transform:uppercase;color:#44536a}.lsg-inv .r{text-align:right;white-space:nowrap}' +
    '.lsg-inv tfoot td{font-weight:700;border-bottom:0}.lsg-inv .tot td{font-size:15px;color:#0a3556;border-top:2px solid #0a3556}' +
    '.lsg-inv .foot{margin-top:26px;font-size:11px;color:#7a879a;border-top:1px solid #d5dde8;padding-top:8px;line-height:1.5}' +
    '.lsg-inv .stamp{display:inline-block;border:2px solid #1e9e4a;color:#1e9e4a;border-radius:6px;padding:2px 10px;font-weight:700;transform:rotate(-4deg)}' +
    '@media (max-width:640px){.lsg-inv .parties{grid-template-columns:1fr}.lsg-inv table{font-size:12px}}';
  (function () {
    if (document.getElementById('lsg-fact-css')) return;
    var s = document.createElement('style'); s.id = 'lsg-fact-css';
    s.textContent = INV_CSS + '.lsg-paper{background:#fff;border:1px solid var(--line);border-radius:12px;padding:26px}' +
      '.lsg-fh{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.lsg-fh h2{font-size:21px}.lsg-fa{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}' +
      '.lsg-lrow{display:grid;grid-template-columns:minmax(0,1fr) 70px 120px 34px;gap:8px;margin-bottom:8px;align-items:center}' +
      '.lsg-ltot{text-align:right;font-weight:700;font-size:15px;padding:8px 2px}' +
      '@media (max-width:640px){.lsg-paper{padding:14px}.lsg-fa{margin-left:0;width:100%}.lsg-fa .btn{flex:1 1 45%}.lsg-lrow{grid-template-columns:1fr 60px 100px 34px}}';
    document.head.appendChild(s);
  })();

  /* ---------------------------------------------------------------- calculs */
  function all() { return S.all('factures'); }
  function user() { var u = E.session.user(); return u ? u.name : 'Système'; }
  function cli(id) { return S.get('clients', id); }
  function cliNom(id) { return E.clientName(id); }
  function tot(f) { return E.sum(f.lignes || [], function (l) { return (+l.qte || 0) * (+l.pu || 0); }); }
  function total(f) { return f.total != null ? f.total : tot(f); }
  function solde(f) { return Math.max(0, total(f) - (f.paye || 0)); }
  function statut(f) {
    if ((f.paye || 0) >= total(f)) return 'Payée';
    if (f.echeance && f.echeance < E.today()) return 'En retard';
    if ((f.paye || 0) > 0) return 'Partiellement payée';
    return 'Émise';
  }
  function retardJ(f) { return Math.max(0, E.daysBetween(f.echeance, E.today())); }
  function lastRelance(f) { var r = f.relances || []; return r.length ? r[r.length - 1] : null; }
  function relanceDue(f) { if (statut(f) !== 'En retard') return false; var l = lastRelance(f); return !l || E.daysBetween(l.date, E.today()) >= 7; }
  function siteUrl(p) { try { return new URL(p, location.href).href; } catch (e) { return p; } }
  function nextId(prefix, col) {
    var max = 0; S.all(col).forEach(function (x) { var n = parseInt(String(x.id).split('-').pop(), 10); if (n > max) max = n; });
    var id, n, guard = 0;
    do { id = S.next(prefix); n = parseInt(id.split('-').pop(), 10); guard++; } while ((n <= max || S.get(col, id)) && guard < 2000);
    return id;
  }
  function canGo(m) { var x = E.mod(m); return !!x && E.session.can(x); }

  /* ---------------------------------------------------------------- document facture */
  function docHtml(f) {
    var c = cli(f.client) || {}, logo = siteUrl('../assets/img/logo.png'), s = statut(f);
    return '<div class="lsg-inv"><div class="hd"><div style="display:flex;gap:12px;align-items:center"><img src="' + esc(logo) + '" alt="LSG"><div><b style="font-size:15px;color:#0a3556">Logistique Services Gabon</b><small>Transit – Douanes – Consignation<br>BP 217 Zone Fret Aéroportuaire, Libreville, Gabon<br>+241 11 44 27 27 · info.lsg@lsg-gabon.com</small></div></div>' +
      '<div style="text-align:right"><h1>FACTURE</h1><b class="mono" style="font-size:15px">' + esc(f.id) + '</b><small>Date : ' + F.date(f.date) + '<br>Échéance : ' + F.date(f.echeance) + '</small></div></div>' +
      '<div class="parties"><div class="box"><b>Facturé à</b><br>' + esc(c.nom || cliNom(f.client)) + '<br>' + esc(c.ville || '') + (c.email ? '<br>' + esc(c.email) : '') + '</div>' +
      '<div class="box"><b>Référence</b><br>' + (f.dossier ? 'Dossier de transit n° ' + esc(f.dossier) : 'Prestations diverses') + '<br>Condition : paiement à ' + (c.delai != null ? c.delai : '—') + ' jours<br>Statut : <b>' + esc(s) + '</b></div></div>' +
      '<table><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">Prix unitaire</th><th class="r">Montant</th></tr></thead><tbody>' +
      (f.lignes || []).map(function (l) { return '<tr><td>' + esc(l.l) + '</td><td class="r">' + F.num(l.qte) + '</td><td class="r">' + F.money(l.pu) + '</td><td class="r">' + F.money(l.qte * l.pu) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr class="tot"><td colspan="3" class="r">Total à payer</td><td class="r">' + F.money(total(f)) + '</td></tr>' +
      ((f.paye || 0) > 0 ? '<tr><td colspan="3" class="r" style="font-weight:400">Déjà réglé</td><td class="r" style="font-weight:400">− ' + F.money(f.paye) + '</td></tr><tr><td colspan="3" class="r">Reste dû</td><td class="r">' + F.money(solde(f)) + '</td></tr>' : '') + '</tfoot></table>' +
      (s === 'Payée' ? '<div style="margin-top:18px"><span class="stamp">PAYÉE</span></div>' : '') +
      '<div class="foot"><b>Document de démonstration</b> — montants et coordonnées clients fictifs, sans valeur comptable ni fiscale.<br>Logistique Services Gabon · BP 217 Zone Fret Aéroportuaire Libreville · WhatsApp +241 65 99 62 83</div></div>';
  }
  function printFacture(f) {
    var w = window.open('', '_blank');
    if (!w) { U.toast('Autorisez les fenêtres surgissantes pour imprimer.', 'err'); return; }
    w.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ' + esc(f.id) + '</title><style>body{margin:28px}' + INV_CSS + '</style></head><body>' + docHtml(f) + '</body></html>');
    w.document.close(); w.focus(); setTimeout(function () { try { w.print(); } catch (e) {} }, 400);
    E.log('Impression facture', f.id, MOD);
  }

  /* ---------------------------------------------------------------- paiement */
  function openPaiement(f) {
    var rest = solde(f);
    if (rest <= 0) { U.toast('Cette facture est déjà soldée.', 'err'); return; }
    var m = U.modal({ title: 'Enregistrer un paiement', sub: f.id + ' · ' + esc(cliNom(f.client)) + ' · reste dû ' + F.money(rest), size: 'sm',
      body: U.form([
        { name: 'montant', label: 'Montant encaissé (FCFA)', type: 'money', value: rest, required: true, min: 1, full: true, help: 'Saisir un montant inférieur au reste dû pour un paiement partiel.' },
        { name: 'date', label: 'Date de réception', type: 'date', value: E.today(), required: true },
        { name: 'mode', label: 'Mode de règlement', type: 'select', options: MODES },
        { name: 'ref', label: 'Référence (virement, chèque…)', full: true }
      ]),
      actions: [{ label: 'Annuler' },
        { label: 'Solde total', onClick: function (close, el) { el.querySelector('#f_montant').value = rest; } },
        { label: 'Enregistrer', cls: 'primary', icon: 'check', onClick: function (close, el) {
          var v = U.readForm(el); if (!v) return;
          var mt = Math.round(+v.montant);
          if (!(mt > 0)) { U.toast('Montant invalide.', 'err'); return; }
          if (mt > rest) { U.toast('Le montant dépasse le reste dû (' + F.money(rest) + ').', 'err'); return; }
          f.paye = (f.paye || 0) + mt; f.paiements = f.paiements || [];
          f.paiements.push({ date: v.date, montant: mt, mode: v.mode, ref: v.ref || '', par: user() }); S.save();
          E.log('Encaissement', f.id + ' · ' + F.money(mt) + ' (' + v.mode + ')' + (solde(f) > 0 ? ' — partiel' : ' — soldée'), MOD);
          if (solde(f) <= 0) E.notify('Facture soldée', f.id + ' · ' + cliNom(f.client), '#/facturation/' + f.id, 'green');
          U.toast(solde(f) > 0 ? 'Paiement partiel enregistré' : 'Facture soldée'); close(); E.rerender();
        } }] });
    return m;
  }

  /* ---------------------------------------------------------------- relance */
  function relanceTexte(f) {
    var c = cli(f.client) || {};
    return 'Bonjour,\n\nSauf erreur de notre part, la facture n° ' + f.id + ' du ' + F.date(f.date) + ' (' + F.money(total(f)) + '), échue le ' + F.date(f.echeance) + ', reste impayée à hauteur de ' + F.money(solde(f)) + ' (' + retardJ(f) + ' jours de retard).\n\n' +
      'Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais, ou de nous contacter si le paiement a déjà été effectué.\n\nCordialement,\nComptabilité — Logistique Services Gabon\n+241 11 44 27 27 · info.lsg@lsg-gabon.com';
  }
  function openRelance(f) {
    var c = cli(f.client) || {};
    function record(canal) {
      f.relances = f.relances || []; f.relances.push({ date: E.today(), canal: canal, par: user() }); S.save();
      E.log('Relance ' + canal, f.id + ' · ' + cliNom(f.client) + ' · ' + F.money(solde(f)), MOD); U.toast('Relance ' + canal + ' préparée'); E.rerender();
    }
    U.modal({ title: 'Relance de paiement', sub: f.id + ' · ' + esc(cliNom(f.client)) + ' · ' + F.money(solde(f)) + ' échus depuis ' + retardJ(f) + ' j', size: 'lg',
      body: '<div class="field full"><label for="rl_txt">Message (modifiable avant envoi)</label><textarea class="textarea" id="rl_txt" style="min-height:240px">' + esc(relanceTexte(f)) + '</textarea></div>' +
        '<p class="small muted" style="margin-bottom:0">Destinataire : ' + (c.tel ? 'WhatsApp +' + esc(c.tel) : 'aucun numéro WhatsApp enregistré (vous choisirez le contact dans WhatsApp)') + ' · ' + (c.email ? esc(c.email) : 'aucun e-mail enregistré') + '</p>',
      actions: [{ label: 'Annuler' },
        { label: 'WhatsApp', icon: 'send', onClick: function (close, el) {
          var t = el.querySelector('#rl_txt').value, tel = String(c.tel || '').replace(/\D/g, '');
          window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(t), '_blank', 'noopener'); close(); record('WhatsApp'); } },
        { label: 'E-mail', icon: 'mail', cls: 'primary', onClick: function (close, el) {
          var t = el.querySelector('#rl_txt').value;
          window.location.href = 'mailto:' + (c.email || '') + '?subject=' + encodeURIComponent('Relance — facture ' + f.id) + '&body=' + encodeURIComponent(t); close(); record('e-mail'); } }] });
  }

  /* ---------------------------------------------------------------- création */
  function lineRow(l) {
    l = l || { l: '', qte: 1, pu: 0 };
    return '<div class="lsg-lrow"><input class="input" data-k="l" placeholder="Désignation" value="' + esc(l.l) + '"><input class="input" data-k="qte" type="number" min="1" value="' + esc(l.qte) + '"><input class="input" data-k="pu" type="number" min="0" value="' + esc(l.pu) + '"><button type="button" class="btn icon ghost" data-del aria-label="Supprimer la ligne">' + ic('x') + '</button></div>';
  }
  function openCreate(clientId, dossierId) {
    var dos0 = dossierId ? S.get('dossiers', dossierId) : null;
    if (dos0 && !clientId) clientId = dos0.client;
    var cl = E.options('clients', 'nom'), c0 = cli(clientId || (cl[0] && cl[0].v)) || {};
    function dosOptions(cid) { return '<option value="">— Aucun —</option>' + S.all('dossiers').filter(function (d) { return d.client === cid; }).map(function (d) { return '<option value="' + esc(d.id) + '"' + (d.id === dossierId ? ' selected' : '') + '>' + esc(d.id + ' · ' + d.desc) + '</option>'; }).join(''); }
    var body = '<div class="form-grid"><div class="field"><label>Client *</label><select class="select" id="nf_client">' + cl.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === c0.id ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Dossier lié (facultatif)</label><select class="select" id="nf_dos">' + dosOptions(c0.id) + '</select></div>' +
      '<div class="field"><label>Date</label><input class="input" type="date" id="nf_date" value="' + E.today() + '"></div>' +
      '<div class="field"><label>Échéance</label><input class="input" type="date" id="nf_ech" value="' + E.addDays(E.today(), c0.delai != null ? c0.delai : 30) + '"></div>' +
      '<div class="field full"><label>Lignes de facturation *</label><div id="nf_lines">' + lineRow({ l: '', qte: 1, pu: 0 }) + '</div><div class="row"><button type="button" class="btn sm" id="nf_add">' + ic('plus') + 'Ajouter une ligne</button><span class="spacer"></span></div><div class="lsg-ltot">Total : <span id="nf_tot">0 FCFA</span></div></div></div>';
    var m = U.modal({ title: 'Nouvelle facture', sub: 'Facture de démonstration', size: 'lg', body: body,
      actions: [{ label: 'Annuler' }, { label: 'Créer la facture', cls: 'primary', icon: 'check', onClick: function (close, el) {
        var cid = el.querySelector('#nf_client').value, lines = [];
        E.$$('.lsg-lrow', el).forEach(function (r) { var l = r.querySelector('[data-k=l]').value.trim(), q = +r.querySelector('[data-k=qte]').value, p = +r.querySelector('[data-k=pu]').value; if (l && q > 0 && p >= 0) lines.push({ l: l, qte: q, pu: p }); });
        if (!cid) { U.toast('Choisissez un client.', 'err'); return; }
        if (!lines.length) { U.toast('Ajoutez au moins une ligne complète.', 'err'); return; }
        var date = el.querySelector('#nf_date').value, ech = el.querySelector('#nf_ech').value, dos = el.querySelector('#nf_dos').value;
        if (!date || !ech) { U.toast('Dates obligatoires.', 'err'); return; }
        if (ech < date) { U.toast('L\'échéance précède la date de facture.', 'err'); return; }
        var f = { id: nextId('FAC', 'factures'), client: cid, dossier: dos, date: date, echeance: ech, paye: 0, lignes: lines };
        f.total = tot(f); S.add('factures', f, 'FAC');
        if (dos) { var d = S.get('dossiers', dos); if (d && !d.facture) { d.facture = f.id; S.save(); } }
        E.log('Création de facture', f.id + ' · ' + cliNom(cid) + ' · ' + F.money(f.total), MOD);
        U.toast('Facture ' + f.id + ' créée'); close(); E.go('facturation/' + f.id);
      } }] });
    var el = m.el;
    function recalc() { var t = 0; E.$$('.lsg-lrow', el).forEach(function (r) { t += (+r.querySelector('[data-k=qte]').value || 0) * (+r.querySelector('[data-k=pu]').value || 0); }); el.querySelector('#nf_tot').textContent = F.money(t); }
    el.addEventListener('input', recalc);
    el.addEventListener('click', function (e) {
      if (e.target.closest('#nf_add')) { el.querySelector('#nf_lines').insertAdjacentHTML('beforeend', lineRow()); recalc(); }
      var del = e.target.closest('[data-del]');
      if (del) { var rows = E.$$('.lsg-lrow', el); if (rows.length > 1) { del.closest('.lsg-lrow').remove(); recalc(); } else U.toast('Une facture doit comporter au moins une ligne.', 'err'); }
    });
    el.querySelector('#nf_client').onchange = function (e) {
      var c = cli(e.target.value) || {}; el.querySelector('#nf_dos').innerHTML = dosOptions(c.id);
      el.querySelector('#nf_ech').value = E.addDays(el.querySelector('#nf_date').value || E.today(), c.delai != null ? c.delai : 30);
    };
    el.querySelector('#nf_date').onchange = function () { var c = cli(el.querySelector('#nf_client').value) || {}; el.querySelector('#nf_ech').value = E.addDays(el.querySelector('#nf_date').value || E.today(), c.delai != null ? c.delai : 30); };
    recalc();
  }

  /* ---------------------------------------------------------------- liste */
  function filtered() {
    var q = E.norm(st.q);
    return all().filter(function (f) {
      if (st.statut && statut(f) !== st.statut) return false;
      if (st.client && f.client !== st.client) return false;
      if (q && E.norm(f.id + ' ' + cliNom(f.client) + ' ' + (f.dossier || '')).indexOf(q) < 0) return false;
      return true;
    });
  }
  var COLS = [
    { label: 'Facture', render: function (f) { return '<b class="mono">' + esc(f.id) + '</b>'; } },
    { label: 'Client', render: function (f) { return esc(cliNom(f.client)); } },
    { label: 'Dossier', render: function (f) { return f.dossier ? '<span class="mono">' + esc(f.dossier) + '</span>' : ''; } },
    { label: 'Date', render: function (f) { return F.dateShort(f.date); } },
    { label: 'Échéance', render: function (f) { return statut(f) === 'En retard' ? '<span style="color:var(--red);font-weight:600">' + F.dateShort(f.echeance) + ' · ' + retardJ(f) + ' j</span>' : F.dateShort(f.echeance); } },
    { label: 'Total', num: true, render: function (f) { return F.money(total(f)); } },
    { label: 'Solde', num: true, render: function (f) { return F.money(solde(f)); } },
    { label: 'Statut', render: function (f) { return U.badge(statut(f)); } }
  ];
  function csvCols() {
    return [{ label: 'N°', key: 'id' }, { label: 'Client', csv: function (f) { return cliNom(f.client); } }, { label: 'Dossier', key: 'dossier' }, { label: 'Date', key: 'date' }, { label: 'Échéance', key: 'echeance' },
      { label: 'Total (FCFA)', csv: total }, { label: 'Encaissé (FCFA)', csv: function (f) { return f.paye || 0; } }, { label: 'Solde (FCFA)', csv: solde }, { label: 'Statut', csv: statut }, { label: 'Relances', csv: function (f) { return (f.relances || []).length; } }];
  }
  function drawBody() {
    var rows = filtered(), box = E.$('#fa-body'); if (!box) return;
    E.$('#fa-count').textContent = rows.length + ' facture' + (rows.length > 1 ? 's' : '');
    box.innerHTML = U.table(COLS, rows, { onRow: function (f) { E.go('facturation/' + f.id); }, empty: 'Aucune facture ne correspond à ces filtres.',
      footer: function (r) { return '<td colspan="5">Total affiché</td><td class="num">' + F.money(E.sum(r, total)) + '</td><td class="num">' + F.money(E.sum(r, solde)) + '</td><td></td>'; } });
  }
  function chartHtml() {
    var labels = [], keys = [], d = new Date(E.TODAY.getFullYear(), E.TODAY.getMonth() - 5, 1), i;
    for (i = 0; i < 6; i++) { keys.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); labels.push(E.MOIS[d.getMonth()]); d.setMonth(d.getMonth() + 1); }
    var fac = keys.map(function (k) { return E.sum(all().filter(function (f) { return String(f.date).slice(0, 7) === k; }), total); });
    var enc = keys.map(function (k) { return E.sum(all().filter(function (f) { return String(f.date).slice(0, 7) === k; }), function (f) { return f.paye || 0; }); });
    return U.bars({ labels: labels, money: true, height: 210, series: [{ name: 'Facturé', values: fac, color: '#0b78a8' }, { name: 'Encaissé', values: enc, color: '#1e9e4a' }] });
  }
  function renderList(view) {
    var rows = all(), mk = E.today().slice(0, 7);
    var fm = E.sum(rows.filter(function (f) { return String(f.date).slice(0, 7) === mk; }), total);
    var enc = E.sum(rows, function (f) { return f.paye || 0; }), encours = E.sum(rows, solde), ret = rows.filter(function (f) { return statut(f) === 'En retard'; });
    var don = STATUTS.map(function (s, i) { return { label: s, value: rows.filter(function (f) { return statut(f) === s; }).length, color: ['#0b78a8', '#e8780c', '#d93636', '#1e9e4a'][i] }; });
    function sel(name, label, opts, val) { return '<select class="select" data-f="' + name + '"><option value="">' + label + '</option>' + opts.map(function (o) { var v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; }
    view.innerHTML =
      '<div class="section-title"><div><h2>Facturation</h2><p>Factures clients, encaissements et relances · démonstration</p></div><span class="spacer"></span>' +
      '<button class="btn" id="fa-csv">' + ic('download') + 'Exporter CSV</button><button class="btn primary" id="fa-new">' + ic('plus') + 'Nouvelle facture</button></div>' +
      '<div class="grid g4" style="margin:14px 0">' +
      U.kpi({ label: 'Facturé ce mois', value: F.short(fm), unit: 'FCFA', icon: 'invoice', tone: 'blue', foot: F.month(E.today()) }) +
      U.kpi({ label: 'Encaissé', value: F.short(enc), unit: 'FCFA', icon: 'money', tone: 'green', foot: 'Sur l\'ensemble des factures' }) +
      U.kpi({ label: 'Encours clients', value: F.short(encours), unit: 'FCFA', icon: 'wallet', tone: 'orange', foot: 'Reste à encaisser' }) +
      U.kpi({ label: 'Factures en retard', value: ret.length, icon: 'alert', tone: ret.length ? 'red' : 'green', foot: F.money(E.sum(ret, solde)) + ' échus' }) + '</div>' +
      '<div class="grid g-2-1" style="margin-bottom:16px"><div class="card"><div class="card__h"><h3>Facturé et encaissé</h3><span class="sub">6 derniers mois, par date de facture</span></div><div class="card__b">' + chartHtml() + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Répartition par statut</h3></div><div class="card__b">' + U.donut(don, { center: rows.length, sub: 'factures' }) + '</div></div></div>' +
      '<div class="filters"><input class="input" id="fa-q" placeholder="Rechercher (n°, client, dossier…)" value="' + esc(st.q) + '" style="min-width:220px">' +
      sel('statut', 'Tous les statuts', STATUTS, st.statut) + sel('client', 'Tous les clients', E.options('clients', 'nom'), st.client) +
      '<span class="spacer"></span><span class="small muted" id="fa-count"></span></div><div class="card"><div class="card__b flush" id="fa-body"></div></div>';
    drawBody();
    E.$('#fa-q', view).oninput = function (e) { st.q = e.target.value; drawBody(); };
    E.$$('[data-f]', view).forEach(function (s) { s.onchange = function () { st[s.dataset.f] = s.value; drawBody(); }; });
    E.$('#fa-new', view).onclick = function () { openCreate(); };
    E.$('#fa-csv', view).onclick = function () { U.exportCSV('factures-lsg-' + E.today(), csvCols(), filtered()); E.log('Export CSV', 'factures', MOD); };
  }

  /* ---------------------------------------------------------------- fiche */
  function renderFiche(view, id) {
    var f = S.get('factures', id);
    if (!f) { view.innerHTML = '<div class="card"><div class="empty">Facture introuvable.<br><br><a class="btn" href="#/facturation">' + ic('back') + 'Retour à la facturation</a></div></div>'; return; }
    var s = statut(f), rel = f.relances || [], pay = f.paiements || [];
    view.innerHTML =
      '<div class="row no-print" style="margin-bottom:12px"><a class="btn ghost sm" href="#/facturation">' + ic('back') + 'Facturation</a></div>' +
      '<div class="card no-print" style="margin-bottom:16px"><div class="card__b"><div class="lsg-fh"><div><h2 class="mono" style="font-family:Sora,sans-serif">' + esc(f.id) + '</h2><div class="row" style="margin-top:4px">' + U.badge(s) + '<span class="muted small">' + esc(cliNom(f.client)) + ' · reste dû ' + F.money(solde(f)) + '</span></div></div>' +
      '<div class="lsg-fa"><button class="btn" data-a="print">' + ic('print') + 'Imprimer / PDF</button>' +
      (solde(f) > 0 ? '<button class="btn success" data-a="pay">' + ic('money') + 'Enregistrer un paiement</button>' : '') +
      (s === 'En retard' ? '<button class="btn accent" data-a="rel">' + ic('send') + 'Relancer le client</button>' : '') +
      (f.dossier && canGo('dossiers') && S.get('dossiers', f.dossier) ? '<button class="btn" data-a="dos">' + ic('box') + 'Dossier</button>' : '') +
      (canGo('clients') ? '<button class="btn" data-a="cli">' + ic('users') + 'Client</button>' : '') + '</div></div></div></div>' +
      '<div class="grid g-2-1"><div class="lsg-paper">' + docHtml(f) + '</div><div class="stack no-print">' +
      '<div class="card"><div class="card__h"><h3>Encaissements</h3><span class="sub">' + F.money(f.paye || 0) + ' / ' + F.money(total(f)) + '</span></div><div class="card__b">' + U.progress(total(f) ? (f.paye || 0) / total(f) * 100 : 0) +
      (pay.length ? '<div class="timeline" style="margin-top:14px">' + pay.slice().reverse().map(function (p) { return '<div class="tl-item done"><b>' + F.money(p.montant) + '</b><span>' + F.date(p.date) + ' · ' + esc(p.mode) + (p.ref ? ' · ' + esc(p.ref) : '') + '</span></div>'; }).join('') + '</div>' : '<p class="small muted" style="margin:12px 0 0">' + ((f.paye || 0) > 0 ? 'Paiement antérieur enregistré (détail non conservé).' : 'Aucun paiement enregistré.') + '</p>') + '</div></div>' +
      '<div class="card"><div class="card__h"><h3>Relances</h3><span class="sub">' + rel.length + '</span></div><div class="card__b">' +
      (rel.length ? '<div class="timeline">' + rel.slice().reverse().map(function (r) { return '<div class="tl-item done"><b>Relance ' + esc(r.canal) + '</b><span>' + F.date(r.date) + ' · ' + esc(r.par || '') + '</span></div>'; }).join('') + '</div>' : '<p class="small muted" style="margin:0">' + (s === 'En retard' ? 'Facture en retard : aucune relance envoyée pour le moment.' : 'Aucune relance (facture non échue ou soldée).') + '</p>') + '</div></div></div></div>';
    view.onclick = function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'print') printFacture(f); else if (a === 'pay') openPaiement(f); else if (a === 'rel') openRelance(f);
      else if (a === 'dos') E.go('dossiers/' + f.dossier); else if (a === 'cli') E.go('clients/' + f.client);
    };
  }

  function render(view, params) {
    if (params && params[0] === 'nouvelle') { renderList(view); setTimeout(function () { openCreate(params[1] && params[1].indexOf('LSG-') === 0 ? '' : params[1], params[1] && params[1].indexOf('LSG-') === 0 ? params[1] : ''); }, 30); }
    else if (params && params[0]) renderFiche(view, params[0]);
    else renderList(view);
  }

  /* ---------------------------------------------------------------- intégration */
  function search(q) {
    return all().filter(function (f) { return E.norm(f.id + ' ' + cliNom(f.client) + ' ' + (f.dossier || '')).indexOf(q) >= 0; })
      .map(function (f) { return { title: f.id + ' · ' + cliNom(f.client), sub: 'Facture · ' + statut(f) + ' · ' + F.money(total(f)), href: '#/facturation/' + f.id }; });
  }
  function pending(u) {
    var out = []; if (!u || (u.profile !== 'finance' && u.profile !== 'admin')) return out;
    all().filter(relanceDue).forEach(function (f) { out.push({ title: f.id + ' · relance à envoyer', sub: cliNom(f.client) + ' · ' + F.money(solde(f)) + ' échus depuis ' + retardJ(f) + ' j', date: f.echeance, href: '#/facturation/' + f.id, tone: retardJ(f) >= 30 ? 'red' : 'orange' }); });
    return out;
  }
  function summary() {
    var rows = all(), mk = E.today().slice(0, 7), ret = rows.filter(function (f) { return statut(f) === 'En retard'; });
    return [
      { label: 'Facturé ce mois', value: F.short(E.sum(rows.filter(function (f) { return String(f.date).slice(0, 7) === mk; }), total)), icon: 'invoice', tone: 'blue', foot: 'FCFA', href: '#/facturation' },
      { label: 'Encours clients', value: F.short(E.sum(rows, solde)), icon: 'wallet', tone: 'orange', foot: 'FCFA à encaisser', href: '#/facturation' },
      { label: 'Factures en retard', value: String(ret.length), icon: 'alert', tone: 'red', foot: F.money(E.sum(ret, solde)), href: '#/facturation' }
    ];
  }

  E.register({
    id: MOD, label: 'Facturation', title: 'Facturation', icon: 'invoice', group: 'Commercial & Finances', roles: ['finance'],
    seed: function () { return { factures: JSON.parse(JSON.stringify(window.LSG.factures)) }; },
    render: render, search: search, pending: pending, summary: summary,
    badge: function () { return all().filter(function (f) { return statut(f) === 'En retard'; }).length; }
  });
})();
