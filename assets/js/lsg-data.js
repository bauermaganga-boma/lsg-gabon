/* LSG — données de démonstration partagées par le site public (suivi de dossier) et l'espace de gestion.
   Toutes les données sont FICTIVES (noms de clients, navires, montants). Les dates sont calculées par
   rapport à aujourd'hui pour que la démonstration paraisse toujours « vivante ». */
(function () {
  'use strict';
  var DAY = 864e5;
  function iso(offsetDays) { var d = new Date(Date.now() + offsetDays * DAY); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  var STEPS = ['Dossier reçu', 'Documents vérifiés', 'Déclaration en douane', 'Dédouané', 'En livraison', 'Livré'];
  var DOCS = [['facture', 'Facture commerciale'], ['packing', 'Liste de colisage'], ['transport', 'Titre de transport (LTA / connaissement)'], ['assurance', 'Attestation d\'assurance'], ['fiche', 'Fiche de renseignements / déclaration préalable']];

  var CLIENTS = [
    { id: 'C-01', nom: 'Société Exemple A — Équipements', type: 'Importateur', ville: 'Libreville', contact: 'Service logistique', tel: '24165996283', email: 'logistique@exemple-a.demo', delai: 30, plafond: 40000000 },
    { id: 'C-02', nom: 'Société Exemple B — Matériaux', type: 'Importateur', ville: 'Owendo', contact: 'Achats', tel: '', email: 'achats@exemple-b.demo', delai: 45, plafond: 60000000 },
    { id: 'C-03', nom: 'Société Exemple C — Agroalimentaire', type: 'Importateur', ville: 'Libreville', contact: 'Direction', tel: '', email: 'direction@exemple-c.demo', delai: 30, plafond: 25000000 },
    { id: 'C-04', nom: 'Armement Exemple D', type: 'Armateur', ville: 'Port-Gentil', contact: 'Agence maritime', tel: '', email: 'ops@exemple-d.demo', delai: 15, plafond: 90000000 },
    { id: 'C-05', nom: 'Société Exemple E — Pétrole & Services', type: 'Industriel', ville: 'Port-Gentil', contact: 'Approvisionnements', tel: '', email: 'appro@exemple-e.demo', delai: 45, plafond: 80000000 },
    { id: 'C-06', nom: 'Société Exemple F — Distribution', type: 'Importateur', ville: 'Libreville', contact: 'Logistique', tel: '', email: 'logistique@exemple-f.demo', delai: 30, plafond: 30000000 },
    { id: 'C-07', nom: 'Société Exemple G — Santé', type: 'Importateur', ville: 'Libreville', contact: 'Pharmacie centrale', tel: '', email: 'pharma@exemple-g.demo', delai: 30, plafond: 20000000 },
    { id: 'C-08', nom: 'Société Exemple H — Bois & Export', type: 'Exportateur', ville: 'Owendo', contact: 'Exploitation', tel: '', email: 'export@exemple-h.demo', delai: 30, plafond: 35000000 }
  ];

  var EMPLOYES = [
    { id: 'E-01', nom: 'Direction générale', poste: 'Direction', agence: 'Libreville', tel: '24165996283', email: 'info.lsg@lsg-gabon.com' },
    { id: 'E-02', nom: 'Pôle Transit aérien', poste: 'Responsable transit aérien', agence: 'Libreville', tel: '', email: '' },
    { id: 'E-03', nom: 'Pôle Transit maritime', poste: 'Responsable transit maritime', agence: 'Owendo', tel: '', email: '' },
    { id: 'E-04', nom: 'Pôle Douane', poste: 'Déclarant en douane', agence: 'Libreville', tel: '', email: '' },
    { id: 'E-05', nom: 'Pôle Consignation', poste: 'Responsable consignation', agence: 'Port-Gentil', tel: '', email: '' },
    { id: 'E-06', nom: 'Entrepôt', poste: 'Chef d\'entrepôt', agence: 'Owendo', tel: '', email: '' },
    { id: 'E-07', nom: 'Service FedEx / TNT', poste: 'Service client express', agence: 'Libreville', tel: '', email: 'cs.fedex@lsg-gabon.com' },
    { id: 'E-08', nom: 'Comptabilité', poste: 'Comptable', agence: 'Libreville', tel: '', email: '' }
  ];

  /* h = historique ; chaque entrée : [étape atteinte, jours avant aujourd'hui, note] */
  function histo(list) { return list.map(function (x) { return { step: x[0], at: new Date(Date.now() - x[1] * DAY).toISOString(), by: x[3] || 'Pôle Transit', note: x[2] }; }); }
  function docs(a) { var o = {}; DOCS.forEach(function (d, i) { o[d[0]] = !!a[i]; }); return o; }

  var DOSSIERS = [
    { id: 'LSG-2026-0412', client: 'C-01', type: 'Aérien', sens: 'Import', origine: 'Paris (CDG)', destination: 'Libreville', agence: 'Libreville', desc: '3 colis — pièces détachées industrielles', colis: 3, poids: 420, valeur: 18500000, transport: 'LTA 057-4412 8830', step: 3, ouvert: iso(-8), eta: iso(-5), docs: docs([1, 1, 1, 1, 1]), responsable: 'E-02', tel: '24165996283',
      histo: histo([[0, 8, 'Dossier ouvert à la réception de la demande.'], [1, 6, 'Documents complets et conformes.'], [2, 4, 'Déclaration déposée en douane.'], [3, 1, 'Marchandises dédouanées, en attente de retrait.', 'Pôle Douane']]) },
    { id: 'LSG-2026-0415', client: 'C-02', type: 'Maritime', sens: 'Import', origine: 'Anvers (BE)', destination: 'Owendo', agence: 'Owendo', desc: '1 conteneur 20 pieds — matériaux de construction', colis: 1, poids: 18200, valeur: 32000000, transport: 'BL ANR-OWE-77310', step: 1, ouvert: iso(-5), eta: iso(6), docs: docs([1, 1, 1, 0, 0]), responsable: 'E-03', tel: '',
      histo: histo([[0, 5, 'Dossier ouvert, connaissement reçu.'], [1, 2, 'Documents vérifiés, assurance à fournir.', 'Pôle Douane']]) },
    { id: 'LSG-2026-0398', client: 'C-03', type: 'Express', sens: 'Import', origine: 'Dubaï (AE)', destination: 'Libreville', agence: 'Libreville', desc: 'Colis FedEx — équipement de froid', colis: 2, poids: 95, valeur: 4200000, transport: 'FedEx 7768 2210 4455', step: 5, ouvert: iso(-16), eta: iso(-12), docs: docs([1, 1, 1, 1, 1]), responsable: 'E-07', tel: '',
      histo: histo([[0, 16, 'Colis pris en charge.', 'Service FedEx / TNT'], [1, 15, 'Documents vérifiés.'], [2, 14, 'Déclaration déposée.', 'Pôle Douane'], [3, 13, 'Dédouané.', 'Pôle Douane'], [4, 12, 'Livraison en cours.'], [5, 11, 'Livré et réceptionné par le client.']]) },
    { id: 'LSG-2026-0420', client: 'C-04', type: 'Consignation', sens: 'Import', origine: 'Escale pétrolier', destination: 'Port-Gentil', agence: 'Port-Gentil', desc: 'Assistance escale — formalités navire', colis: 0, poids: 0, valeur: 0, transport: 'Escale ESC-2026-0031', step: 2, ouvert: iso(-3), eta: iso(1), docs: docs([1, 0, 1, 1, 1]), responsable: 'E-05', tel: '',
      histo: histo([[0, 3, 'Dossier d\'escale ouvert.', 'Pôle Consignation'], [1, 2, 'Documents navire vérifiés.', 'Pôle Consignation'], [2, 1, 'Déclarations d\'arrivée déposées.', 'Pôle Douane']]) },
    { id: 'LSG-2026-0405', client: 'C-05', type: 'Maritime', sens: 'Import', origine: 'Le Havre (FR)', destination: 'Owendo', agence: 'Owendo', desc: '2 conteneurs 40 pieds — équipements', colis: 2, poids: 36400, valeur: 74000000, transport: 'BL LEH-OWE-55120', step: 4, ouvert: iso(-19), eta: iso(-4), docs: docs([1, 1, 1, 1, 1]), responsable: 'E-03', tel: '',
      histo: histo([[0, 19, 'Dossier ouvert.'], [1, 15, 'Documents vérifiés.'], [2, 9, 'Déclaration déposée.', 'Pôle Douane'], [3, 4, 'Dédouanement terminé.', 'Pôle Douane'], [4, 1, 'Camions affectés, livraison sur site client.']]) },
    { id: 'LSG-2026-0391', client: 'C-06', type: 'Aérien', sens: 'Import', origine: 'Casablanca (MA)', destination: 'Libreville', agence: 'Libreville', desc: '12 palettes — produits de grande consommation', colis: 12, poids: 6800, valeur: 21000000, transport: 'LTA 147-2290 5518', step: 5, ouvert: iso(-24), eta: iso(-20), docs: docs([1, 1, 1, 1, 1]), responsable: 'E-02', tel: '',
      histo: histo([[0, 24, 'Dossier ouvert.'], [1, 23, 'Documents vérifiés.'], [2, 22, 'Déclaration déposée.', 'Pôle Douane'], [3, 21, 'Dédouané.', 'Pôle Douane'], [4, 20, 'En livraison.'], [5, 19, 'Livré.']]) },
    { id: 'LSG-2026-0423', client: 'C-07', type: 'Maritime', sens: 'Import', origine: 'Douala (CM)', destination: 'Owendo', agence: 'Owendo', desc: 'Groupage — 8 colis, matériel médical', colis: 8, poids: 1250, valeur: 12800000, transport: 'BL DLA-OWE-33901', step: 0, ouvert: iso(-1), eta: iso(9), docs: docs([0, 0, 1, 0, 0]), responsable: 'E-03', tel: '',
      histo: histo([[0, 1, 'Dossier ouvert, documents en attente.']]) },
    { id: 'LSG-2026-0427', client: 'C-08', type: 'Maritime', sens: 'Export', origine: 'Owendo', destination: 'Anvers (BE)', agence: 'Owendo', desc: '3 conteneurs 40 pieds — bois débités', colis: 3, poids: 54000, valeur: 96000000, transport: 'BL OWE-ANR-90418', step: 2, ouvert: iso(-7), eta: iso(5), docs: docs([1, 1, 1, 1, 0]), responsable: 'E-03', tel: '',
      histo: histo([[0, 7, 'Dossier export ouvert.'], [1, 4, 'Documents vérifiés.'], [2, 1, 'Déclaration d\'exportation déposée.', 'Pôle Douane']]) },
    { id: 'LSG-2026-0409', client: 'C-01', type: 'Aérien', sens: 'Import', origine: 'Francfort (DE)', destination: 'Libreville', agence: 'Libreville', desc: '1 palette — instruments de mesure', colis: 1, poids: 310, valeur: 9800000, transport: 'LTA 020-6671 0042', step: 3, ouvert: iso(-14), eta: iso(-11), docs: docs([1, 1, 1, 1, 1]), responsable: 'E-02', tel: '',
      histo: histo([[0, 14, 'Dossier ouvert.'], [1, 12, 'Documents vérifiés.'], [2, 9, 'Déclaration déposée.', 'Pôle Douane'], [3, 6, 'Dédouané — retard de retrait signalé au client.', 'Pôle Douane']]) },
    { id: 'LSG-2026-0430', client: 'C-06', type: 'Express', sens: 'Export', origine: 'Libreville', destination: 'Paris (FR)', agence: 'Libreville', desc: 'Colis TNT — échantillons', colis: 1, poids: 18, valeur: 900000, transport: 'TNT GE 5530 9921', step: 1, ouvert: iso(-2), eta: iso(2), docs: docs([1, 1, 1, 0, 1]), responsable: 'E-07', tel: '',
      histo: histo([[0, 2, 'Colis enregistré.', 'Service FedEx / TNT'], [1, 1, 'Documents vérifiés.']]) }
  ];

  var ESCALES = [
    { id: 'ESC-2026-0031', navire: 'MT Exemple Atlantique', imo: '9000001', armateur: 'C-04', type: 'Pétrolier', port: 'Port-Gentil', eta: iso(1), etd: iso(4), statut: 'Annoncée', marchandise: 'Brut — chargement', tonnage: 38000, tirant: 9.2, services: ['Déclaration d\'arrivée', 'Pilotage', 'Remorquage', 'Avitaillement'], frais: 14500000 },
    { id: 'ESC-2026-0029', navire: 'MV Exemple Ogooué', imo: '9000002', armateur: 'C-05', type: 'Porte-conteneurs', port: 'Owendo', eta: iso(-1), etd: iso(2), statut: 'À quai', marchandise: '420 EVP déchargés / 180 EVP chargés', tonnage: 22000, tirant: 8.1, services: ['Déclaration d\'arrivée', 'Pilotage', 'Manutention', 'Formalités douanières'], frais: 9800000 },
    { id: 'ESC-2026-0027', navire: 'GT Exemple Estuaire', imo: '9000003', armateur: 'C-04', type: 'Gazier', port: 'Port-Gentil', eta: iso(-3), etd: iso(0), statut: 'Opérations', marchandise: 'GPL — déchargement', tonnage: 12500, tirant: 7.4, services: ['Déclaration d\'arrivée', 'Pilotage', 'Remorquage'], frais: 11200000 },
    { id: 'ESC-2026-0033', navire: 'MV Exemple Komo', imo: '9000004', armateur: 'C-02', type: 'Cargo', port: 'Owendo', eta: iso(6), etd: iso(9), statut: 'Annoncée', marchandise: 'Matériaux de construction', tonnage: 15000, tirant: 7.9, services: ['Déclaration d\'arrivée', 'Pilotage', 'Manutention'], frais: 6200000 },
    { id: 'ESC-2026-0024', navire: 'MV Exemple Mondah', imo: '9000005', armateur: 'C-08', type: 'Cargo', port: 'Owendo', eta: iso(-8), etd: iso(-6), statut: 'Appareillée', marchandise: 'Bois — chargement', tonnage: 9800, tirant: 6.8, services: ['Déclaration de départ', 'Pilotage', 'Manutention'], frais: 5100000 }
  ];

  var LOTS = [
    { id: 'LOT-0188', dossier: 'LSG-2026-0412', client: 'C-01', desc: '3 colis — pièces détachées', entree: iso(-9), site: 'Libreville', emplacement: 'A-04', colis: 3, poids: 420, statut: 'Dédouané — à enlever', echeance: iso(21) },
    { id: 'LOT-0192', dossier: 'LSG-2026-0409', client: 'C-01', desc: '1 palette — instruments de mesure', entree: iso(-13), site: 'Libreville', emplacement: 'A-07', colis: 1, poids: 310, statut: 'Dédouané — à enlever', echeance: iso(4) },
    { id: 'LOT-0185', dossier: 'LSG-2026-0405', client: 'C-05', desc: '2 conteneurs 40 pieds — équipements', entree: iso(-18), site: 'Owendo', emplacement: 'PARC-2', colis: 2, poids: 36400, statut: 'Sorti', echeance: iso(12) },
    { id: 'LOT-0197', dossier: 'LSG-2026-0415', client: 'C-02', desc: '1 conteneur 20 pieds — matériaux', entree: iso(-1), site: 'Owendo', emplacement: 'PARC-1', colis: 1, poids: 18200, statut: 'Sous douane', echeance: iso(45) },
    { id: 'LOT-0199', dossier: 'LSG-2026-0423', client: 'C-07', desc: 'Groupage — matériel médical', entree: iso(0), site: 'Owendo', emplacement: 'B-11', colis: 8, poids: 1250, statut: 'Sous douane', echeance: iso(60) },
    { id: 'LOT-0176', dossier: '', client: 'C-03', desc: 'Palettes agroalimentaires — attente déclaration', entree: iso(-34), site: 'Libreville', emplacement: 'C-02', colis: 14, poids: 5200, statut: 'Sous douane', echeance: iso(2) },
    { id: 'LOT-0181', dossier: '', client: 'C-06', desc: 'Produits de grande consommation', entree: iso(-22), site: 'Libreville', emplacement: 'C-09', colis: 20, poids: 7400, statut: 'Sous douane', echeance: iso(18) }
  ];

  function lignes(a) { return a.map(function (x) { return { l: x[0], qte: x[1], pu: x[2] }; }); }
  var FACTURES = [
    { id: 'FAC-2026-0301', client: 'C-03', dossier: 'LSG-2026-0398', date: iso(-12), echeance: iso(18), paye: 0, lignes: lignes([['Transit express et dédouanement', 1, 380000], ['Livraison porte à porte', 1, 120000]]) },
    { id: 'FAC-2026-0298', client: 'C-06', dossier: 'LSG-2026-0391', date: iso(-19), echeance: iso(11), paye: 1650000, lignes: lignes([['Transit aérien — 12 palettes', 1, 1100000], ['Dédouanement', 1, 450000], ['Livraison', 1, 100000]]) },
    { id: 'FAC-2026-0285', client: 'C-05', dossier: 'LSG-2026-0405', date: iso(-40), echeance: iso(-10), paye: 0, lignes: lignes([['Transit maritime — 2 conteneurs 40\'', 2, 1450000], ['Dédouanement', 1, 900000], ['Camionnage', 2, 380000]]) },
    { id: 'FAC-2026-0279', client: 'C-04', dossier: 'LSG-2026-0420', date: iso(-6), echeance: iso(9), paye: 0, lignes: lignes([['Assistance escale — formalités', 1, 3200000], ['Frais d\'agence', 1, 1800000]]) },
    { id: 'FAC-2026-0270', client: 'C-01', dossier: '', date: iso(-52), echeance: iso(-22), paye: 2400000, lignes: lignes([['Transit aérien — mars', 1, 1650000], ['Dédouanement', 1, 750000]]) },
    { id: 'FAC-2026-0262', client: 'C-02', dossier: '', date: iso(-60), echeance: iso(-15), paye: 5400000, lignes: lignes([['Transit maritime — conteneur 40\'', 1, 3100000], ['Entreposage sous douane', 1, 650000], ['Dédouanement', 1, 1650000]]) }
  ];
  FACTURES.forEach(function (f) { f.total = f.lignes.reduce(function (a, x) { return a + x.qte * x.pu; }, 0); });

  window.LSG = {
    STEPS: STEPS, DOCS: DOCS, iso: iso,
    clients: CLIENTS, employes: EMPLOYES, dossiers: DOSSIERS, escales: ESCALES, lots: LOTS, factures: FACTURES,
    /* Lecture des dossiers : base de l'espace de gestion si elle existe (clé lsg_erp_v1), sinon données d'exemple.
       Utilisé par la page publique « Suivi de dossier ». */
    readDossiers: function () {
      try { var db = JSON.parse(localStorage.getItem('lsg_erp_v1')); if (db && db.c && Array.isArray(db.c.dossiers)) return db.c.dossiers; } catch (e) {}
      return JSON.parse(JSON.stringify(DOSSIERS));
    },
    readClients: function () {
      try { var db = JSON.parse(localStorage.getItem('lsg_erp_v1')); if (db && db.c && Array.isArray(db.c.clients)) return db.c.clients; } catch (e) {}
      return CLIENTS;
    }
  };
})();
