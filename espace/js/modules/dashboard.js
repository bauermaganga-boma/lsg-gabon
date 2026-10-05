/* Tableau de bord LSG : indicateurs transversaux (dossiers, escales, entrepôt, facturation), alertes et activité. */
(function () {
  var E = ERP, ui = E.ui, fmt = E.fmt, esc = E.esc;
  var STEPS = window.LSG.STEPS;

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function greeting() { var hr = new Date().getHours(); return hr < 12 ? 'Bonjour' : hr < 18 ? 'Bon après-midi' : 'Bonsoir'; }
  function solde(f) { return (f.total || 0) - (f.paye || 0); }
  function late(f) { return solde(f) > 0 && E.parseDate(f.echeance) < E.TODAY; }
  function heroStat(v, unit, label) { return '<div><div style="font:700 26px Sora,sans-serif;letter-spacing:-.02em">' + v + (unit ? '<small style="font-size:13px;color:#9fd3ea;margin-left:4px">' + unit + '</small>' : '') + '</div><div style="font-size:12px;color:#9fd3ea">' + label + '</div></div>'; }

  function render(view) {
    var u = E.session.user();
    var dossiers = E.store.all('dossiers'), escales = E.store.all('escales'), lots = E.store.all('lots'), factures = E.store.all('factures');
    var enCours = dossiers.filter(function (d) { return d.step < 5; });
    var retardDossiers = enCours.filter(function (d) { return d.eta && E.parseDate(d.eta) < E.TODAY && d.step < 3; });
    var aQuai = escales.filter(function (e) { return e.statut === 'À quai' || e.statut === 'Opérations'; });
    var attendus = escales.filter(function (e) { return e.statut === 'Annoncée' || e.statut === 'En rade'; });
    var lotsActifs = lots.filter(function (l) { return l.statut !== 'Sorti'; });
    var lotsAlerte = lotsActifs.filter(function (l) { return E.daysBetween(E.today(), l.echeance) <= 7; });
    var encours = E.sum(factures, solde), enRetard = factures.filter(late);
    var pend = E.pendingAll();

    /* Dossiers par étape + par type */
    var parEtape = STEPS.map(function (_, i) { return dossiers.filter(function (d) { return d.step === i; }).length; });
    var types = ['Aérien', 'Maritime', 'Express', 'Consignation'], cols = ['#0b78a8', '#0a3556', '#1db6ea', '#e23a3a'];
    var parType = types.map(function (t, i) { return { label: t, value: dossiers.filter(function (d) { return d.type === t; }).length, color: cols[i] }; }).filter(function (x) { return x.value; });

    /* Facturé / encaissé sur 6 mois */
    var mois = [], fact = [], enc = [];
    for (var k = 5; k >= 0; k--) {
      var d0 = new Date(E.TODAY.getFullYear(), E.TODAY.getMonth() - k, 1);
      mois.push(E.MOIS[d0.getMonth()]);
      var f = factures.filter(function (x) { var p = E.parseDate(x.date); return p.getMonth() === d0.getMonth() && p.getFullYear() === d0.getFullYear(); });
      fact.push(E.sum(f, 'total')); enc.push(E.sum(f, 'paye'));
    }

    var alertes = [];
    retardDossiers.forEach(function (d) { alertes.push({ tone: 'red', icon: 'clock', title: d.id + ' — ETA dépassée', sub: E.clientName(d.client) + ' · ' + STEPS[d.step], href: '#/dossiers/' + d.id }); });
    lotsAlerte.forEach(function (l) { var j = E.daysBetween(E.today(), l.echeance); alertes.push({ tone: j < 3 ? 'red' : 'orange', icon: 'box', title: l.id + (j < 0 ? ' — échéance dépassée' : ' — échéance dans ' + j + ' j'), sub: E.clientName(l.client) + ' · ' + l.site, href: '#/entrepot/' + l.id }); });
    enRetard.forEach(function (f) { alertes.push({ tone: 'orange', icon: 'invoice', title: f.id + ' — facture échue', sub: E.clientName(f.client) + ' · solde ' + fmt.money(solde(f)), href: '#/facturation/' + f.id }); });

    view.innerHTML =
      '<div class="card" style="background:linear-gradient(120deg,#06182b 0%,#0a3556 60%,#0b78a8 120%);color:#fff;border:0;overflow:hidden;position:relative;margin-bottom:16px">' +
        '<div style="position:absolute;inset:0;background:url(../assets/img/hero-grues.jpg) right center/cover;opacity:.28;mask-image:linear-gradient(90deg,transparent 20%,#000 85%);-webkit-mask-image:linear-gradient(90deg,transparent 20%,#000 85%)"></div>' +
        '<div class="card__b" style="position:relative;padding:22px 24px;display:flex;gap:20px;align-items:center;flex-wrap:wrap">' +
          '<div style="flex:1;min-width:240px"><div style="color:#9fd3ea;font-size:12.5px">' + esc(cap(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))) + '</div>' +
          '<h2 style="font-size:24px;margin:4px 0 6px">' + greeting() + ', ' + esc(u.civilite || u.name) + '</h2>' +
          '<div style="color:#d6e9f4">' + (alertes.length ? '<b style="color:#6fd3f6">' + alertes.length + ' point' + (alertes.length > 1 ? 's' : '') + ' d\'attention</b> à traiter aujourd\'hui.' : 'Tout est à jour.') + '</div></div>' +
          '<div style="display:flex;gap:28px;flex-wrap:wrap">' + heroStat(enCours.length, '', 'Dossiers en cours') + heroStat(aQuai.length, '', 'Navires à quai') + heroStat(lotsActifs.length, '', 'Lots sous douane') + '</div>' +
        '</div></div>' +

      '<div class="grid g4" style="margin-bottom:16px">' +
        '<a href="#/dossiers" style="color:inherit">' + ui.kpi({ label: 'Dossiers en cours', value: enCours.length, icon: 'box', tone: 'blue', foot: retardDossiers.length ? '<span style="color:var(--red)">' + retardDossiers.length + ' en retard d\'ETA</span>' : 'aucun retard' }) + '</a>' +
        '<a href="#/consignation" style="color:inherit">' + ui.kpi({ label: 'Navires à quai', value: aQuai.length, icon: 'ship', tone: 'violet', foot: attendus.length + ' attendu(s)' }) + '</a>' +
        '<a href="#/entrepot" style="color:inherit">' + ui.kpi({ label: 'Lots sous douane', value: lotsActifs.length, icon: 'layers', tone: 'orange', foot: lotsAlerte.length ? '<span style="color:var(--red)">' + lotsAlerte.length + ' échéance(s) proche(s)</span>' : 'aucune alerte' }) + '</a>' +
        '<a href="#/facturation" style="color:inherit">' + ui.kpi({ label: 'Encours clients', value: fmt.short(encours), unit: 'FCFA', icon: 'wallet', tone: enRetard.length ? 'red' : 'green', foot: enRetard.length + ' facture(s) échue(s)' }) + '</a>' +
      '</div>' +

      '<div class="grid g-2-1" style="margin-bottom:16px">' +
        '<div class="card"><div class="card__h"><h3>Dossiers par étape</h3><span class="sub">' + dossiers.length + ' dossiers</span></div><div class="card__b">' + ui.bars({ labels: STEPS.map(function (s) { return s.replace('Déclaration en douane', 'Déclaration').replace('Documents vérifiés', 'Documents'); }), series: [{ name: 'Dossiers', values: parEtape, color: '#0b78a8' }], height: 210 }) + '</div></div>' +
        '<div class="card"><div class="card__h"><h3>Par type de flux</h3></div><div class="card__b">' + ui.donut(parType, { center: dossiers.length, sub: 'dossiers', size: 140 }) + '</div></div>' +
      '</div>' +

      '<div class="grid g-2-1" style="margin-bottom:16px">' +
        '<div class="card"><div class="card__h"><h3>Facturé et encaissé</h3><span class="sub">6 derniers mois, FCFA</span></div><div class="card__b">' + ui.bars({ labels: mois, series: [{ name: 'Facturé', values: fact, color: '#0a3556' }, { name: 'Encaissé', values: enc, color: '#1db6ea' }], height: 210, money: true }) + '</div></div>' +
        '<div class="card"><div class="card__h"><h3>Alertes</h3><span class="sub">' + alertes.length + ' à traiter</span></div><div class="card__b flush">' +
          (alertes.length ? '<div class="list">' + alertes.slice(0, 7).map(function (a) { return '<a class="list__item" href="' + a.href + '" style="color:inherit"><div class="list__icon ' + ui.TONES[a.tone] + '">' + E.icon(a.icon) + '</div><div class="list__body"><b>' + esc(a.title) + '</b><div class="small muted">' + esc(a.sub) + '</div></div></a>'; }).join('') + '</div>' : '<div class="empty">' + E.icon('check') + '<br>Aucune alerte.</div>') +
        '</div></div>' +
      '</div>' +

      '<div class="grid g2" style="margin-bottom:16px">' +
        '<div class="card"><div class="card__h"><h3>Navires — vue du jour</h3><a class="btn sm spacer-l" href="#/consignation" style="margin-left:auto">Consignation ' + E.icon('arrow') + '</a></div>' + navires(escales) + '</div>' +
        '<div class="card"><div class="card__h"><h3>Activité récente</h3></div><div class="card__b flush"><div class="list">' + activity(dossiers) + '</div></div></div>' +
      '</div>' +

      '<div class="grid g3">' + quick() + '</div>';
  }

  function navires(escales) {
    var rows = escales.filter(function (e) { return e.statut !== 'Appareillée'; }).sort(function (a, b) { return a.eta < b.eta ? -1 : 1; });
    return ui.table([
      { label: 'Navire', render: function (e) { return '<b>' + esc(e.navire) + '</b><div class="small muted">' + esc(e.type) + '</div>'; } },
      { label: 'Port', key: 'port' },
      { label: 'ETA', render: function (e) { return fmt.dateShort(e.eta); } },
      { label: 'Statut', render: function (e) { return ui.badge(e.statut, { 'Annoncée': 'violet', 'En rade': 'orange', 'À quai': 'blue', 'Opérations': 'green' }[e.statut] || 'grey'); } }
    ], rows, { empty: 'Aucun navire en cours', onRow: function (e) { E.go('consignation/' + e.id); } });
  }

  function activity(dossiers) {
    var a = E.audit().slice(0, 6);
    if (!a.length) {
      var ev = [];
      dossiers.forEach(function (d) { (d.histo || []).forEach(function (h) { ev.push({ at: h.at, user: h.by || 'Pôle Transit', action: STEPS[h.step] + ' — ' + d.id, detail: h.note }); }); });
      a = ev.sort(function (x, y) { return x.at < y.at ? 1 : -1; }).slice(0, 6);
    }
    return a.map(function (x) { return '<div class="list__item">' + ui.avatar(x.user, null, true) + '<div class="list__body"><b>' + esc(x.action) + '</b><div class="small muted">' + esc(x.detail) + '</div><div class="small muted">' + esc(x.user) + ' · ' + fmt.ago(x.at) + '</div></div></div>'; }).join('');
  }

  function quick() {
    var Q = [
      ['dossiers', 'box', 'Ouvrir un dossier de transit', 'Aérien, maritime, express : documents, douane, livraison.'],
      ['consignation', 'ship', 'Suivre les escales', 'Navires attendus, à quai, services et frais d\'escale.'],
      ['entrepot', 'layers', 'Entrepôt sous douane', 'Lots, emplacements, échéances d\'enlèvement.'],
      ['clients', 'users', 'Clients & encours', 'Fiches clients, plafonds et délais de paiement.'],
      ['facturation', 'invoice', 'Facturer & relancer', 'Factures liées aux dossiers, encaissements, relances.']
    ].filter(function (q) { var m = E.mod(q[0]); return m && E.session.can(m); }).slice(0, 6);
    return Q.map(function (q) { return '<a class="card card__b row" href="#/' + q[0] + '" style="color:inherit;align-items:flex-start;flex-wrap:nowrap"><div class="list__icon tone-navy">' + E.icon(q[1]) + '</div><div><b>' + esc(q[2]) + '</b><div class="small muted">' + esc(q[3]) + '</div></div></a>'; }).join('');
  }

  E.register({ id: 'dashboard', label: 'Tableau de bord', title: 'Tableau de bord', icon: 'home', group: 'Pilotage', render: render });
})();
