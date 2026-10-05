/* Administration : utilisateurs & droits, circuits, journal d'audit, intégrations, données de démonstration. */
(function () {
  var E = ERP, ui = E.ui, fmt = E.fmt, esc = E.esc;
  var PROFILS = [['admin', 'Direction'], ['transit', 'Transit'], ['douane', 'Douane'], ['consignation', 'Consignation'], ['entrepot', 'Entrepôt'], ['finance', 'Comptabilité']];

  function render(view, params) {
    var tab = params[0] || 'droits';
    view.innerHTML = '<div class="section-title" style="margin-bottom:14px"><div><h2>Administration</h2><p>Comptes, droits d\'accès, circuits de traitement et traçabilité.</p></div></div>' +
      ui.tabs([{ k: 'droits', l: 'Utilisateurs & droits' }, { k: 'circuits', l: 'Circuits de traitement' }, { k: 'journal', l: 'Journal d\'audit', n: E.audit().length }, { k: 'integrations', l: 'Intégrations' }, { k: 'demo', l: 'Données de démonstration' }], tab, function (k) { E.go('admin/' + k); }) +
      '<div id="adm"></div>';
    var el = E.$('#adm', view);
    if (tab === 'droits') droits(el); else if (tab === 'circuits') circuits(el); else if (tab === 'journal') journal(el); else if (tab === 'integrations') integrations(el); else demo(el);
  }

  function droits(el) {
    var mods = E.modules.filter(function (m) { return !m.hidden && m.id !== 'admin'; });
    el.innerHTML = '<div class="grid g-1-2">' +
      '<div class="card"><div class="card__h"><h3>Comptes</h3><span class="sub">' + E.USERS.length + ' comptes de démonstration</span></div><div class="card__b flush"><div class="list">' +
      E.USERS.map(function (u) { return '<div class="list__item">' + ui.avatar(u.name, u.color) + '<div class="list__body"><b>' + esc(u.name) + '</b><div class="small muted">' + esc(u.role) + '</div><div class="small"><span class="mono">' + u.login + '</span> · ' + ui.badge('Actif', 'green') + '</div></div></div>'; }).join('') +
      '</div></div></div>' +
      '<div class="card"><div class="card__h"><h3>Matrice des droits</h3><span class="sub">modules accessibles par profil</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Module</th>' + PROFILS.map(function (p) { return '<th class="center">' + esc(p[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      mods.map(function (m) { return '<tr><td class="strong nowrap">' + esc(m.label) + '</td>' + PROFILS.map(function (p) { var ok = p[0] === 'admin' || !m.roles || m.roles.indexOf(p[0]) >= 0; return '<td class="center">' + (ok ? '<span style="color:var(--green)">' + E.icon('check') + '</span>' : '<span class="muted">—</span>') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div><div class="card__b small muted">En production : comptes nominatifs pour chaque agent, mot de passe personnel, double authentification pour la Direction et la Comptabilité, droits réglables par module et par action (lecture, saisie, validation).</div></div>' +
      '</div>';
    E.$$('svg', el).forEach(function (s) { s.style.width = '16px'; });
  }

  function circuits(el) {
    var C = [
      ['Dossier de transit — import', ['Réception de la demande', 'Contrôle des documents', 'Déclaration en douane', 'Dédouanement', 'Livraison', 'Facturation']],
      ['Dossier de transit — export', ['Demande', 'Documents & certificats', 'Déclaration d\'exportation', 'Embarquement / expédition', 'Facturation']],
      ['Escale de navire', ['Annonce', 'Déclaration d\'arrivée', 'Pilotage & accostage', 'Opérations commerciales', 'Appareillage', 'Facture armateur']],
      ['Entreposage sous douane', ['Entrée du lot', 'Enregistrement & emplacement', 'Suivi d\'échéance', 'Relance client', 'Bon de sortie']],
      ['Facturation & recouvrement', ['Émission', 'Envoi au client', 'Encaissement', 'Relance si échéance dépassée']]
    ];
    el.innerHTML = '<div class="grid g2">' + C.map(function (c) { return '<div class="card"><div class="card__h"><h3>' + esc(c[0]) + '</h3></div><div class="card__b">' + ui.steps(c[1], -1) + '</div></div>'; }).join('') + '</div>' +
      '<div class="alert tone-blue" style="margin-top:16px">' + E.icon('info') + '<div>Les circuits, les valideurs et les délais sont paramétrables. Chaque action est horodatée et conservée dans le journal d\'audit.</div></div>';
  }

  function journal(el) {
    var rows = E.audit();
    el.innerHTML = '<div class="card"><div class="card__h"><h3>Journal d\'audit</h3><span class="sub">toutes les actions réalisées pendant la démonstration</span><span class="spacer"></span><button class="btn sm" id="exp">' + E.icon('download') + 'Exporter</button></div>' +
      ui.table([{ label: 'Date', render: function (r) { return '<span class="nowrap">' + fmt.datetime(r.at) + '</span>'; } }, { label: 'Utilisateur', render: function (r) { return esc(r.user); } }, { label: 'Module', key: 'module' }, { label: 'Action', render: function (r) { return '<b>' + esc(r.action) + '</b>'; } }, { label: 'Détail', key: 'detail' }], rows, { empty: 'Aucune action pour le moment : faites avancer un dossier, créez une facture… elles apparaîtront ici.' }) + '</div>';
    E.$('#exp', el).onclick = function () { ui.exportCSV('journal-audit', [{ label: 'Date', key: 'at' }, { label: 'Utilisateur', key: 'user' }, { label: 'Module', key: 'module' }, { label: 'Action', key: 'action' }, { label: 'Détail', key: 'detail' }], rows); };
  }

  function integrations(el) {
    var I = [
      ['globe', 'Site internet LSG', 'Suivi de dossier public synchronisé avec les dossiers de l\'espace de gestion.', 'Actif', 'green'],
      ['phone', 'WhatsApp', 'Messages pré-rédigés au client à chaque étape (lien direct) ; envoi automatique avec WhatsApp Business.', 'Actif (lien) · API en option', 'blue'],
      ['lock', 'Base de données sécurisée', 'Hébergement des données, sauvegardes quotidiennes, comptes nominatifs.', 'À activer', 'orange'],
      ['mail', 'Messagerie professionnelle', 'Envoi automatique des avis d\'arrivée, factures et relances par e-mail.', 'À activer', 'orange'],
      ['money', 'Comptabilité', 'Export des écritures de facturation vers le logiciel comptable.', 'Option', 'grey'],
      ['download', 'Excel / PDF', 'Export de toutes les listes et impression des documents.', 'Actif', 'green']
    ];
    el.innerHTML = '<div class="grid g3">' + I.map(function (i) { return '<div class="card card__b"><div class="row" style="margin-bottom:10px"><div class="list__icon tone-navy">' + E.icon(i[0]) + '</div><b>' + esc(i[1]) + '</b></div><p class="small muted" style="margin:0 0 12px">' + esc(i[2]) + '</p>' + ui.badge(i[3], i[4]) + '</div>'; }).join('') + '</div>';
  }

  function demo(el) {
    var n = 0; try { n = Math.round((localStorage.getItem('lsg_erp_v1') || '').length / 1024); } catch (e) {}
    el.innerHTML = '<div class="grid g2"><div class="card card__b"><h3 style="margin-bottom:8px">Données de démonstration</h3><p class="muted">Toutes les données sont fictives et enregistrées dans ce navigateur (' + n + ' Ko). Réinitialisez pour retrouver le jeu d\'exemple d\'origine.</p><button class="btn danger" id="rst">' + E.icon('refresh') + 'Réinitialiser la démonstration</button></div>' +
      '<div class="card card__b"><h3 style="margin-bottom:8px">Scénario de présentation conseillé</h3><ol class="muted" style="margin:0;padding-left:18px;line-height:1.7"><li>Profil <b>Transit</b> : ouvrir un nouveau dossier (n° de suivi généré).</li><li>Sur le site public, rubrique « Suivi de dossier » : saisir ce n° — le client voit l\'étape.</li><li>Profil <b>Douane</b> : cocher les documents, passer le dossier en déclaration puis dédouané.</li><li>Rouvrir le site : le suivi a avancé. Envoyer le message WhatsApp au client.</li><li>Profil <b>Consignation</b> : suivre l\'escale d\'un navire, créer la facture armateur.</li><li>Profil <b>Comptabilité</b> : encaisser, relancer une facture échue.</li></ol></div></div>';
    E.$('#rst', el).onclick = function () { ui.confirm('Réinitialiser la démonstration', 'Toutes les saisies seront effacées.', 'Réinitialiser', E.store.reset, 'danger'); };
  }

  E.register({ id: 'admin', label: 'Administration', title: 'Administration', icon: 'settings', group: 'Système', roles: ['__admin_only'], render: render });
})();
