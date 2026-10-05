/* LSG — assistant « Une question ? » : réponses programmées (pas d'IA, pas de serveur) */
(function () {
  'use strict';
  var WA = '24165996283';
  var TEL1 = '+241 11 44 27 27', TEL2 = '+241 65 99 62 83', MAIL = 'info.lsg@lsg-gabon.com';

  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return ' ' + s.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function wa(txt) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt); }

  /* k = mots-clés sans accents, cherchés en début de mot ; r = réponse (HTML sûr) */
  var KB = [
    { q: 'Quels sont vos services ?', k: ['service', 'metier', 'prestation', 'activite', 'que faites', 'proposez', 'offre'],
      r: '<p>LSG intervient sur cinq métiers : le <b>transit aérien</b>, le <b>transit maritime</b>, la <b>consignation de navires</b>, l\'<b>entreposage sous douane</b> et l\'<b>assistance administrative</b> (formalités douanières, visas, accueil des passagers à l\'aéroport, groupage/dégroupage, livraison porte à porte).</p><p>Tout est détaillé dans la section <a href="index.html#services">Services</a>.</p>' },
    { q: 'Transit aérien', k: ['aerien', 'avion', 'fret aerien', 'air', 'lta', 'aeroport', 'cargo aerien'],
      r: '<p>Pour le <b>transit aérien</b>, LSG prend en charge votre fret à la zone fret de l\'aéroport de Libreville : réception, formalités douanières, dédouanement et livraison jusqu\'à votre porte. Nous travaillons à partir de votre lettre de transport aérien (LTA).</p><p>Pour un devis : <a href="index.html#contact">formulaire de devis</a>.</p>' },
    { q: 'Transit maritime', k: ['maritime', 'conteneur', 'container', 'evp', 'connaissement', 'bl', 'bateau', 'mer', 'owendo', 'import', 'export'],
      r: '<p>Pour le <b>transit maritime</b>, LSG gère vos conteneurs et marchandises conventionnelles : suivi du connaissement (BL), formalités et dédouanement, entreposage sous douane à Owendo et acheminement vers votre site. Import comme export.</p><p>Demandez une cotation : <a href="clients.html#demande">demande de cotation</a>.</p>' },
    { q: 'Consignation de navires', k: ['consignation', 'consignataire', 'navire', 'armateur', 'escale', 'petrolier', 'gazier', 'tanker'],
      r: '<p>LSG est un important opérateur de <b>consignation de navires</b> au Gabon, avec une spécialité pour les <b>pétroliers et gaziers</b> : formalités d\'escale, relation avec les autorités portuaires et douanières, assistance au navire et à l\'armateur.</p><p>Les armateurs ont un espace dédié : <a href="clients.html">Espace clients &amp; armateurs</a>.</p>' },
    { q: 'Entreposage sous douane', k: ['entrepos', 'entrepot', 'stock', 'magasin', 'sous douane', 'stockage', 'garde'],
      r: '<p>LSG exploite des <b>entrepôts sous douane</b> au port d\'Owendo : vos marchandises y sont stockées en attendant leur déclaration ou leur enlèvement, avec un accès limité et contrôlé.</p><p>Pour connaître les conditions de stockage, <a href="index.html#contact">contactez-nous</a>.</p>' },
    { q: 'Douane et formalités', k: ['douane', 'dedouan', 'formalite', 'declaration', 'dau', 'droits', 'taxe', 'franchise', 'visa', 'passager', 'administratif', 'assistance'],
      r: '<p>Notre équipe s\'occupe des <b>formalités douanières</b> : préparation et dépôt de la déclaration, suivi jusqu\'au dédouanement. LSG propose aussi une <b>assistance administrative</b> : visas et accueil des passagers à l\'aéroport.</p><p>Les droits et taxes dépendent de la nature de la marchandise ; chaque cas est étudié à la demande.</p>' },
    { q: 'Groupage et porte à porte', k: ['groupage', 'degroupage', 'porte a porte', 'livraison', 'camion', 'transport', 'acheminement'],
      r: '<p>LSG assure le <b>groupage / dégroupage</b> de vos colis et la <b>livraison porte à porte</b> : une fois la marchandise dédouanée, elle est acheminée jusqu\'à l\'adresse de votre choix.</p>' },
    { q: 'FedEx / TNT express', k: ['fedex', 'tnt', 'express', 'colis', 'courrier', 'document', 'messagerie', 'dhl'],
      r: '<p>LSG est <b>partenaire FedEx / TNT</b> pour l\'envoi et la réception de colis express. Pour un colis express : <a href="mailto:cs.fedex@lsg-gabon.com">cs.fedex@lsg-gabon.com</a> ou au <a href="tel:+24111442727">' + TEL1 + '</a>.</p>' },
    { q: 'Suivre mon dossier', k: ['suivi', 'suivre', 'dossier', 'tracking', 'trace', 'ou en est', 'statut', 'etat', 'avancement', 'numero'],
      r: '<p>Saisissez votre numéro de dossier (par exemple <b>LSG-2026-0412</b>) dans le champ de suivi, ici même dans le chat ou dans la section <a href="index.html#suivi">Suivi de dossier</a> : vous verrez l\'étape en cours. Il suffit de me l\'écrire.</p>' },
    { q: 'Demander un devis', k: ['devis', 'cotation', 'tarif', 'prix', 'combien', 'cout', 'budget', 'estimation', 'commander'],
      r: '<p>Le devis est gratuit. Précisez la marchandise, l\'origine et la destination, le poids ou le volume : <a href="index.html#contact">formulaire de devis</a> (ouvre votre messagerie), <a href="clients.html#demande">demande de cotation</a>, ou directement par <a href="' + wa('Bonjour LSG, je souhaite un devis.') + '" target="_blank" rel="noopener">WhatsApp</a>. Les tarifs dépendent de chaque expédition, je ne peux pas les annoncer ici.</p>' },
    { q: 'Quels délais ?', k: ['delai', 'duree', 'combien de temps', 'rapide', 'urgent', 'quand', 'temps'],
      r: '<p>Les délais dépendent du mode de transport, de la complétude des documents et des contrôles douaniers : je ne peux pas vous donner de chiffre fiable ici. Indiquez-nous votre cas et l\'équipe vous répondra : <a href="' + wa('Bonjour LSG, quel délai pour mon expédition ?') + '" target="_blank" rel="noopener">WhatsApp</a>.</p>' },
    { q: 'Documents nécessaires', k: ['piece', 'papier', 'justificatif', 'necessaire', 'requis', 'facture', 'colisage', 'packing', 'assurance', 'fournir'],
      r: '<p>En général, un dossier de transit demande : la <b>facture commerciale</b>, la <b>liste de colisage</b>, le <b>titre de transport</b> (LTA ou connaissement), une <b>attestation d\'assurance</b> et une <b>fiche de renseignements</b> / déclaration préalable. La liste exacte dépend de la marchandise : l\'équipe vous la confirme.</p>' },
    { q: 'Vos agences', k: ['agence', 'adresse', 'ou etes', 'localisation', 'bureau', 'siege', 'libreville', 'port gentil', 'implantation', 'situe'],
      r: '<p>LSG a trois agences : le <b>siège à la zone fret de l\'aéroport de Libreville</b> (BP 217), <b>Owendo</b> (entrepôts sous douane au port) et <b>Port-Gentil</b>. Détails : <a href="index.html#agences">nos agences</a>.</p>' },
    { q: 'Nous contacter', k: ['contact', 'telephone', 'tel', 'appeler', 'appel', 'numero de', 'mail', 'email', 'courriel', 'joindre', 'adresse mail', 'horaire', 'ouvert'],
      r: '<p><b>Téléphone</b> : <a href="tel:+24111442727">' + TEL1 + '</a> · <a href="tel:+24165996283">' + TEL2 + '</a><br><b>E-mail</b> : <a href="mailto:' + MAIL + '">' + MAIL + '</a><br><b>Courrier</b> : BP 217, zone fret aéroportuaire, Libreville.</p><p>Je n\'ai pas les horaires d\'ouverture : appelez ou écrivez sur WhatsApp.</p>' },
    { q: 'WhatsApp', k: ['whatsapp', 'watsap', 'wa', 'message', 'ecrire'],
      r: '<p>Écrivez-nous sur WhatsApp au <b>' + TEL2 + '</b> : <a href="' + wa('Bonjour LSG, j\'ai une question.') + '" target="_blank" rel="noopener">ouvrir la conversation</a>.</p>' },
    { q: 'Vos clients', k: ['client', 'reference', 'partenaire', 'travaillez', 'vamed', 'sogafric', 'tractafic', 'setrag', 'cfao', 'dtp'],
      r: '<p>Parmi les entreprises qui font confiance à LSG : Vamed, Sogafric, Tractafic, Setrag, CFAO et DTP. Côté partenaires : CDC, Centrimex, GabonOil, NewMaritime, Seafrigo, ainsi que FedEx / TNT.</p>' },
    { q: 'Espace de gestion', k: ['espace client', 'espace de gestion', 'espace', 'gestion', 'erp', 'logiciel', 'outil', 'connexion', 'connecter', 'login', 'compte', 'plateforme', 'application'],
      r: '<p>L\'<b>espace de gestion</b> est l\'outil interne de LSG : dossiers de transit, escales, entrepôt, clients, factures. Une démonstration est accessible ici : <a href="espace/index.html">ouvrir l\'espace de gestion</a>. Les clients et armateurs disposent de l\'<a href="clients.html">espace clients</a>.</p>' },
    { q: 'Qui êtes-vous ?', k: ['qui es', 'qui etes', 'presentation', 'lsg', 'entreprise', 'societe', 'histoire', 'a propos', 'robot', 'humain', 'bot', 'ia'],
      r: '<p>Je suis l\'<b>assistant programmé</b> du site LSG : je réponds à partir d\'une liste de questions prévues, ce n\'est pas une personne ni une IA. LSG (Logistique Services Gabon) est un important opérateur de transit et de consignation de navires au Gabon : « Transit – Douanes – Consignation ».</p>' },
    { q: 'Bonjour', k: ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou', 'allo'],
      r: '<p>Bonjour ! Je suis l\'assistant programmé de LSG. Choisissez une question ci-dessous ou écrivez la vôtre.</p>' },
    { q: 'Merci', k: ['merci', 'parfait', 'super', 'ok', 'd accord', 'genial'],
      r: '<p>Avec plaisir. Si besoin, l\'équipe LSG reste joignable au <a href="tel:+24165996283">' + TEL2 + '</a>.</p>' }
  ];
  var CHIPS = ['Quels sont vos services ?', 'Suivre mon dossier', 'Demander un devis', 'Vos agences', 'FedEx / TNT express', 'Nous contacter'];

  function answer(text) {
    var q = norm(text);
    /* numéro de dossier ? */
    var m = String(text).match(/LSG\s*-?\s*(\d{4})\s*-?\s*(\d{3,4})/i);
    if (m && window.LSGSite) {
      var id = 'LSG-' + m[1] + '-' + ('0' + m[2]).slice(-4);
      var d = window.LSGSite.findDossier(id);
      if (d) {
        var S = window.LSG && window.LSG.STEPS ? window.LSG.STEPS : [];
        return '<p>Dossier <b>' + d.id + '</b> (' + window.LSGSite.esc(d.type) + ', ' + window.LSGSite.esc(d.origine) + ' → ' + window.LSGSite.esc(d.destination) + ') : étape actuelle <b>' + window.LSGSite.esc(S[d.step] || '') + '</b>. Voir la chronologie complète : <a href="index.html#suivi">suivi de dossier</a>.</p>';
      }
      return '<p>Je ne trouve pas le dossier <b>' + id + '</b>. Vérifiez le numéro ou <a href="' + wa('Bonjour LSG, je cherche le dossier ' + id) + '" target="_blank" rel="noopener">demandez à l\'équipe sur WhatsApp</a>.</p>';
    }
    var best = null, bestScore = 0;
    KB.forEach(function (e) {
      var s = 0;
      e.k.forEach(function (k) { if (q.indexOf(' ' + norm(k).trim()) > -1) s += k.length + 1; });
      if (norm(e.q).indexOf(q) === 0 && q.length > 3) s += 20;
      if (s > bestScore) { bestScore = s; best = e; }
    });
    if (best) return best.r;
    return '<p>Je n\'ai pas de réponse programmée à cette question. L\'équipe LSG vous répondra directement : <a href="' + wa('Bonjour LSG, ma question : ' + text) + '" target="_blank" rel="noopener">écrire sur WhatsApp</a> ou <a href="tel:+24165996283">' + TEL2 + '</a>.</p>';
  }

  function build() {
    var doc = document;
    var btn = doc.createElement('button');
    btn.type = 'button'; btn.className = 'ast-btn'; btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-msg"/></svg><span>Une question ?</span>';
    var box = doc.createElement('div');
    box.className = 'ast'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Assistant LSG');
    box.innerHTML = '<div class="ast__head"><span class="ast__av"><svg class="ico" aria-hidden="true"><use href="#i-msg"/></svg></span><div><b>Assistant LSG</b><small>Assistant programmé : réponses prévues à l\'avance</small></div><button type="button" class="ast__x" aria-label="Fermer l\'assistant"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button></div>' +
      '<div class="ast__msgs" aria-live="polite"></div><div class="ast__chips"></div>' +
      '<form class="ast__form"><label class="sr" for="ast-in">Votre question</label><input class="input" id="ast-in" type="text" autocomplete="off" placeholder="Votre question…"><button type="submit" aria-label="Envoyer"><svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></button></form>';
    doc.body.appendChild(box); doc.body.appendChild(btn);
    var msgs = box.querySelector('.ast__msgs'), chips = box.querySelector('.ast__chips'), form = box.querySelector('form'), input = box.querySelector('input');
    var started = false;
    function add(cls, html) {
      var d = doc.createElement('div'); d.className = 'msg msg--' + cls; d.innerHTML = html; msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }
    function ask(t) {
      var clean = String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
      add('me', clean);
      setTimeout(function () { add('bot', answer(t)); }, 280);
    }
    CHIPS.forEach(function (c) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c;
      b.addEventListener('click', function () { ask(c); }); chips.appendChild(b);
    });
    function open() {
      box.classList.add('is-open'); btn.style.display = 'none'; btn.setAttribute('aria-expanded', 'true');
      if (!started) {
        started = true;
        add('bot', '<p>Bonjour, je suis l\'<b>assistant programmé</b> de LSG (pas une personne). Je peux vous renseigner sur nos services, le suivi de dossier, les devis et nos agences.</p>');
      }
      setTimeout(function () { input.focus(); }, 50);
    }
    function close() { box.classList.remove('is-open'); btn.style.display = ''; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    btn.addEventListener('click', open);
    box.querySelector('.ast__x').addEventListener('click', close);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim(); if (!v) return;
      input.value = ''; ask(v);
    });
    window.LSGAssistant = { open: open, answer: answer };
    $openers();
    function $openers() {
      var els = doc.querySelectorAll('[data-open-assistant]');
      for (var i = 0; i < els.length; i++) els[i].addEventListener('click', function (e) { e.preventDefault(); open(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
