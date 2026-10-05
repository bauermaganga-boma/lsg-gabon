/* Données de démonstration (fictives) partagées par le site et l'espace pro. */
window.LSG_STEPS = [
  { id: 'recu', label: 'Dossier reçu' },
  { id: 'docs', label: 'Documents vérifiés' },
  { id: 'decl', label: 'Déclaration en douane' },
  { id: 'dedouane', label: 'Dédouané' },
  { id: 'livraison', label: 'En livraison' },
  { id: 'livre', label: 'Livré' }
];
window.LSG_SEED = [
  { ref: 'LSG-2026-0412', client: 'Société Exemple A', type: 'Aérien', origine: 'Paris (CDG)', desc: '3 colis — pièces détachées', step: 3, date: '2026-09-28', agence: 'Libreville', tel: '' },
  { ref: 'LSG-2026-0415', client: 'Société Exemple B', type: 'Maritime', origine: 'Anvers', desc: '1 conteneur 20 pieds — matériel', step: 1, date: '2026-09-30', agence: 'Owendo', tel: '' },
  { ref: 'LSG-2026-0398', client: 'Société Exemple C', type: 'Express', origine: 'Dubaï', desc: 'Colis FedEx — équipement', step: 5, date: '2026-09-20', agence: 'Libreville', tel: '' },
  { ref: 'LSG-2026-0420', client: 'Société Exemple D', type: 'Consignation', origine: 'Escale pétrolier', desc: 'Escale navire — Port-Gentil', step: 2, date: '2026-10-02', agence: 'Port-Gentil', tel: '' },
  { ref: 'LSG-2026-0405', client: 'Société Exemple E', type: 'Maritime', origine: 'Le Havre', desc: '2 conteneurs 40 pieds — denrées', step: 4, date: '2026-09-24', agence: 'Owendo', tel: '' },
  { ref: 'LSG-2026-0391', client: 'Société Exemple F', type: 'Aérien', origine: 'Casablanca', desc: '12 palettes', step: 5, date: '2026-09-15', agence: 'Libreville', tel: '' },
  { ref: 'LSG-2026-0423', client: 'Société Exemple G', type: 'Maritime', origine: 'Douala', desc: 'Groupage — 8 colis', step: 0, date: '2026-10-04', agence: 'Owendo', tel: '' }
];
window.LSG_load = function () {
  try { var s = localStorage.getItem('lsgDemoDossiers'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.LSG_SEED));
};
window.LSG_save = function (list) { try { localStorage.setItem('lsgDemoDossiers', JSON.stringify(list)); } catch (e) {} };
