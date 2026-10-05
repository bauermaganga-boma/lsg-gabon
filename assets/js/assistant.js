(function () {
  'use strict';

  var WA_NUMBER = '24165996283';
  var chat = document.getElementById('chat');
  var toggle = document.getElementById('chat-toggle');
  var body = document.getElementById('chat-body');
  var chipsBox = document.getElementById('chat-chips');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var fab = document.getElementById('fab');
  var started = false;

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }
  function waButton(text, label) {
    return '<a class="chat__cta" href="' + waLink(text) + '" target="_blank" rel="noopener">' + (label || 'Continuer sur WhatsApp') + '</a>';
  }
  var DEVIS_WA = "Bonjour LSG, je souhaite un devis pour le transit de marchandises.";

  // Base de connaissances issue de la fiche LSG et de leur site actuel
  var KB = [
    { id: 'bonjour', keys: ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou', 'bjr'],
      answer: "Bonjour et bienvenue chez <strong>LSG — Logistique Services Gabon</strong> ! Je peux vous renseigner sur le transit, la douane, la consignation, l'entreposage, le suivi de dossier ou vous aider à demander un devis. Que puis-je faire pour vous ?" },
    { id: 'services', keys: ['service', 'prestation', 'metier', 'que faites', 'activite', 'expertise', 'domaine', 'proposez', 'offre', 'competence'],
      answer: "LSG vous accompagne sur cinq métiers :<ul><li>Transit aérien</li><li>Transit maritime</li><li>Consignation de navires</li><li>Entreposage sous douane</li><li>Assistance administrative</li></ul>Nous sommes aussi partenaire FedEx / TNT. Quel est votre besoin ?",
      chips: ['Transit aérien', 'Transit maritime', 'Consignation', 'Entreposage'] },
    { id: 'aerien', keys: ['aerien', 'avion', 'aeroport', 'fret aerien', 'air ', 'cargo aerien'],
      answer: "Pour le <strong>transit aérien</strong>, nous gérons l'import et l'export par fret aérien : formalités douanières à l'aéroport de Libreville (notre siège est en zone fret), groupage et livraison porte à porte.",
      chips: ['Demander un devis', 'Suivre mon dossier', 'Contact'] },
    { id: 'maritime', keys: ['maritime', 'bateau', 'conteneur', 'container', 'port ', 'owendo', 'groupage', 'degroupage', 'import', 'export', 'dedouan'],
      answer: "Pour le <strong>transit maritime</strong>, nous prenons en charge l'import et l'export par bateau : dédouanement au port d'Owendo, groupage et dégroupage, entreposage sous douane et livraison.",
      chips: ['Demander un devis', 'Entreposage', 'Suivre mon dossier'] },
    { id: 'consignation', keys: ['consignation', 'consigner', 'navire', 'escale', 'petrolier', 'gazier', 'armateur', 'agence maritime', 'port-gentil', 'port gentil'],
      answer: "En <strong>consignation de navires</strong>, LSG représente les armateurs lors des escales, notamment pour les pétroliers et gaziers, depuis nos agences d'Owendo et de Port-Gentil.",
      chips: ['Demander un devis', 'Contact'] },
    { id: 'entrepot', keys: ['entrepos', 'entrepot', 'stock', 'magasin', 'sous douane', 'stocker', 'garder'],
      answer: "Nous disposons de <strong>magasins sous douane</strong> à accès contrôlé (notamment à Libreville et au port d'Owendo) pour stocker vos marchandises avant dédouanement ou livraison.",
      chips: ['Demander un devis', 'Où êtes-vous ?'] },
    { id: 'douane', keys: ['douane', 'douanier', 'formalite', 'declaration', 'administratif', 'administrative', 'visa', 'document', 'dossier de'],
      answer: "Nos équipes gèrent vos <strong>formalités douanières et administratives</strong> : constitution du dossier, déclaration, suivi jusqu'à la libération des marchandises. Nous assistons aussi pour l'obtention de visas et l'accueil de passagers à l'aéroport.",
      chips: ['Demander un devis', 'Suivre mon dossier'] },
    { id: 'express', keys: ['fedex', 'tnt', 'express', 'colis', 'courrier', 'international'],
      answer: "LSG est <strong>partenaire FedEx / TNT</strong> pour l'express international. Pour une question sur un colis, écrivez au service client : <a href=\"mailto:cs.fedex@lsg-gabon.com\">cs.fedex@lsg-gabon.com</a>.",
      chips: ['Contact', 'Demander un devis'] },
    { id: 'suivi', keys: ['suivi', 'suivre', 'tracking', 'statut', 'ou en est', 'avancement', 'numero de dossier', 'localiser', 'ma marchandise'],
      answer: "Vous pouvez suivre un dossier avec son numéro (ex. LSG-2026-0412) dans la section <a class=\"chat__link\" href=\"#suivi\" data-close>Suivi de dossier</a>. Pour un point précis, notre équipe vous répond sur WhatsApp." + '',
      chips: ['Contact', 'Demander un devis'] },
    { id: 'devis', keys: ['devis', 'prix', 'tarif', 'cout', 'combien', 'budget', 'estimation', 'chiffrage', 'chiffrer', 'cher', 'montant'],
      answer: "Chaque opération fait l'objet d'un <strong>devis personnalisé</strong> selon la nature des marchandises, leur origine et leur destination. Décrivez-nous votre besoin :<br>" + waButton(DEVIS_WA, 'Demander un devis sur WhatsApp') + '<a class="chat__link" href="#contact" data-close>ou remplir le formulaire de devis</a>' },
    { id: 'delai', keys: ['delai', 'combien de temps', 'duree', 'quand', 'rapide', 'planning', 'date'],
      answer: "Les délais dépendent du mode de transport, de l'origine et des formalités à accomplir. Notre équipe vous donne une estimation à la demande du devis.",
      chips: ['Demander un devis', 'Contact'] },
    { id: 'zone', keys: ['ou etes', 'etes ou', 'c est ou', 'ou se trouve', 'trouver', 'adresse', 'situe', 'localisation', 'siege', 'bureau', 'agence', 'libreville', 'zone', 'province', 'interieur', 'venez'],
      answer: "LSG a trois agences : le <strong>siège à la zone fret de l'aéroport de Libreville</strong> (BP 217), <strong>Owendo</strong> (entrepôts sous douane au port) et <strong>Port-Gentil</strong>.",
      chips: ['Contact', 'Nos services'] },
    { id: 'contact', keys: ['contact', 'telephone', 'numero', 'appeler', 'joindre', 'mail', 'email', 'courriel', 'whatsapp', 'parler', 'humain', 'conseiller', 'rappeler'],
      answer: "Vous pouvez nous joindre :<ul><li>Tél. : <a href=\"tel:+24111442727\">+241 11 44 27 27</a> / <a href=\"tel:+24165996283\">+241 65 99 62 83</a></li><li>E-mail : <a href=\"mailto:info.lsg@lsg-gabon.com\">info.lsg@lsg-gabon.com</a></li><li>Siège : zone fret aéroportuaire, Libreville</li></ul>" + waButton("Bonjour LSG, je souhaite être recontacté.", 'Écrire sur WhatsApp') },
    { id: 'refs', keys: ['reference', 'client', 'confiance', 'experience', 'exemple', 'travaille avec'],
      answer: "LSG travaille notamment avec <strong>Vamed, Sogafric, Tractafic, Setrag, CFAO, DTP</strong>, et s'appuie sur des partenaires comme FedEx / TNT, CDC, Centrimex, GabonOil, NewMaritime et Seafrigo.",
      chips: ['Nos services', 'Contact'] },
    { id: 'qualite', keys: ['qualite', 'securite', 'garantie', 'serieux', 'fiable', 'valeur', 'slogan'],
      answer: "Notre devise : <strong>« La qualité à votre service »</strong>. Chaque dossier est suivi de la prise en charge à la livraison, dans le respect de la réglementation douanière." },
    { id: 'emploi', keys: ['emploi', 'recrut', 'stage', 'cv', 'candidature', 'travailler chez', 'job', 'poste'],
      answer: "Pour une candidature ou un stage, adressez votre CV et une lettre de motivation à <a href=\"mailto:info.lsg@lsg-gabon.com\">info.lsg@lsg-gabon.com</a>." },
    { id: 'merci', keys: ['merci', 'au revoir', 'bye', 'a bientot', 'parfait', 'super', 'ok merci'],
      answer: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. À bientôt chez LSG." }
  ];

  var CHIP_MAP = {
    'Nos services': 'services', 'Transit aérien': 'aerien', 'Transit maritime': 'maritime', 'Consignation': 'consignation',
    'Entreposage': 'entrepot', 'Demander un devis': 'devis', 'Suivre mon dossier': 'suivi',
    'Contact': 'contact', 'Où êtes-vous ?': 'zone'
  };
  var DEFAULT_CHIPS = ['Nos services', 'Suivre mon dossier', 'Demander un devis', 'Où êtes-vous ?', 'Contact'];

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ');
  }

  function findAnswer(q) {
    var t = ' ' + norm(q) + ' ';
    var best = null, bestScore = 0;
    KB.forEach(function (e) {
      var score = 0;
      e.keys.forEach(function (k) { if (t.indexOf(' ' + k) !== -1) score += k.length > 5 ? 2 : 1; });
      // Les salutations ne l'emportent que si la question ne contient rien d'autre
      if (e.id === 'bonjour' && score) score = 0.5;
      if (score > bestScore) { bestScore = score; best = e; }
    });
    return best;
  }

  function addMsg(html, who) {
    var m = document.createElement('div');
    m.className = 'chat__msg chat__msg--' + who;
    m.innerHTML = html;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }

  function setChips(list) {
    chipsBox.innerHTML = '';
    (list || DEFAULT_CHIPS).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat__chip';
      b.textContent = c;
      b.addEventListener('click', function () { ask(c, CHIP_MAP[c]); });
      chipsBox.appendChild(b);
    });
  }

  function botReply(html, chips) {
    var typing = addMsg('<span class="chat__typing"><i></i><i></i><i></i></span>', 'bot');
    setTimeout(function () {
      typing.innerHTML = html;
      body.scrollTop = body.scrollHeight;
      setChips(chips);
    }, 550 + Math.min(html.length, 400));
  }

  function ask(text, forcedId) {
    addMsg(text.replace(/</g, '&lt;'), 'user');
    var entry = null;
    if (forcedId) KB.forEach(function (e) { if (e.id === forcedId) entry = e; });
    if (!entry) entry = findAnswer(text);
    if (entry) {
      botReply(entry.answer, entry.chips);
    } else {
      botReply("Je n'ai pas la réponse précise à cette question, mais notre équipe peut vous répondre directement :<br>" +
        waButton("Bonjour LSG, j'ai une question : " + text, 'Poser ma question sur WhatsApp'));
    }
  }

  function open() {
    chat.classList.add('is-open');
    fab.classList.add('is-chat-open');
    chat.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      botReply("Bonjour 👋 Je suis l'assistant de <strong>LSG</strong>. Posez-moi vos questions sur le transit, la douane, la consignation ou le suivi de vos dossiers — je vous réponds tout de suite.");
    }
    setTimeout(function () { input.focus(); }, 300);
  }
  function close() {
    chat.classList.remove('is-open');
    fab.classList.remove('is-chat-open');
    chat.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () { chat.classList.contains('is-open') ? close() : open(); });
  document.getElementById('chat-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && chat.classList.contains('is-open')) close(); });
  body.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-close]');
    if (a) close();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });

  // Invitation discrète après quelques secondes, une seule fois par visite
  setTimeout(function () {
    try { if (sessionStorage.getItem('lsgChatHint')) return; sessionStorage.setItem('lsgChatHint', '1'); } catch (e) {}
    if (!chat.classList.contains('is-open')) fab.classList.add('is-hint');
    setTimeout(function () { fab.classList.remove('is-hint'); }, 6000);
  }, 5000);
})();
