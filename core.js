/* ============================================================
   STOCK AGENCE — logique métier commune
   (utilisée à l'identique par l'appli et par le serveur Google)
   ============================================================ */
var Core = (function () {

  /* ---- Implantation de l'agence de Perpignan (17/11/2026) ---- */
  // PLACE : une tablette de 1 m x 1 m = 16 cases de 25 x 25 cm. Capacité des emplacements et place des articles en cases.
  var PLACES = [
    { v: 0, l: 'Empilé sur un autre article · 0 case' },
    { v: 1, l: 'Petit · 1 case (≤ 25 × 25 cm)' },
    { v: 2, l: 'Moyen · 2 cases (25 × 50 cm)' },
    { v: 4, l: 'Grand · 4 cases (50 × 50 cm)' },
    { v: 8, l: 'Très grand · 8 cases (½ tablette)' },
    { v: 16, l: 'Tablette entière · 16 cases' }
  ];
  // FAMILLES : sous-sections de chaque catégorie, pour regrouper le matériel semblable sur les mêmes tablettes.
  // k = mots-clés reconnus dans la désignation (sans accents, en minuscules) pour deviner la famille.
  var FAMILLES = {
    'CFO – courants forts': [
      { n: 'Éclairage', k: ['lumin', 'spot', 'led', 'reglette', 'hublot', 'projecteur', 'plafonnier', 'applique', 'downlight', 'dalle', 'lampe', 'ampoule', 'baes', 'baeh', 'bloc secours', 'eclairage', 'tube fluo', 'driver', 'ruban'] },
      { n: 'Appareillage', k: ['prise', 'interrupteur', 'va-et-vient', 'va et vient', 'poussoir', 'bouton', 'variateur', 'detecteur', 'plaque', 'enjoliveur', 'doigt', 'mosaic', 'celiane', 'odace', 'unica', 'dooxie', 'sortie de cable', 'thermostat'] },
      { n: 'Protection & tableaux', k: ['disjoncteur', 'differentiel', 'interrupteur differentiel', 'tableau', 'coffret', 'rangee', 'peigne', 'contacteur', 'parafoudre', 'fusible', 'sectionneur', 'telerupteur', 'minuterie', 'horloge', 'delesteur', 'bornier', 'repartiteur', 'gtl', 'disj'] },
      { n: 'Boîtes & encastrement', k: ['boite', 'encastrement', 'derivation', 'cloison', 'batibox', 'capri', 'p40', 'pot', 'boitier'] },
      { n: 'Connectique & raccordement', k: ['wago', 'borne', 'domino', 'cosse', 'connecteur', 'raccord', 'manchon', 'serre-cable', 'serre cable', 'collier', 'gaine thermo', 'thermoretract', 'presse-etoupe', 'presse etoupe', 'fiche', 'prolongateur', 'rallonge', 'multiprise'] }
    ],
    'CFA – courants faibles': [
      { n: 'VDI / réseau', k: ['rj45', 'rj 45', 'cat6', 'cat 6', 'cat5', 'baie', 'brassage', 'switch', 'fibre', 'tv', 'coaxial', 'grade', 'vdi', 'ethernet', 'patch', 'onduleur', 'routeur', 'wifi', 'borne wifi'] },
      { n: 'Alarme & sécurité incendie', k: ['alarme', 'sirene', 'detecteur de fumee', 'daaf', 'ssi', 'declencheur', 'incendie', 'intrusion', 'centrale', 'clavier'] },
      { n: 'Contrôle d\'accès & interphonie', k: ['badge', 'lecteur', 'interphone', 'visiophone', 'gache', 'ventouse', 'controle d\'acces', 'portier', 'digicode'] },
      { n: 'Vidéosurveillance', k: ['camera', 'video', 'nvr', 'dvr', 'enregistreur'] },
      { n: 'Domotique & gestion', k: ['domotique', 'knx', 'zigbee', 'passerelle', 'module', 'gtb', 'automate', 'capteur'] }
    ],
    'CVC': [
      { n: 'Climatisation', k: ['clim', 'split', 'pac', 'pompe a chaleur', 'groupe', 'unite exterieure', 'unite interieure', 'liaison frigo', 'frigorifique', 'cuivre', 'r32', 'condensat', 'relevage'] },
      { n: 'Ventilation', k: ['vmc', 'ventil', 'extracteur', 'bouche', 'gaine', 'aeraulique', 'grille', 'caisson', 'entree d\'air', 'conduit'] },
      { n: 'Chauffage', k: ['radiateur', 'convecteur', 'chauffage', 'seche-serviette', 'seche serviette', 'chauffe-eau', 'ballon', 'cumulus', 'plancher chauffant', 'thermostat'] }
    ],
    'TCE': [
      { n: 'Fixations & visserie', k: ['vis', 'cheville', 'boulon', 'ecrou', 'rondelle', 'tige filetee', 'clou', 'agrafe', 'rail', 'equerre', 'fixation', 'collier atlas', 'pointe'] },
      { n: 'Consommables', k: ['silicone', 'mastic', 'colle', 'scotch', 'adhesif', 'chatterton', 'mousse', 'bombe', 'lubrifiant', 'chiffon', 'disque', 'foret', 'meche', 'lame', 'sac'] },
      { n: 'Plâtrerie & maçonnerie', k: ['platre', 'enduit', 'ciment', 'mortier', 'placo', 'ba13', 'trappe', 'joint'] },
      { n: 'Peinture & finition', k: ['peinture', 'rouleau', 'pinceau', 'bache', 'scotch de masquage'] }
    ],
    'Câble': [
      { n: 'Câbles énergie', k: ['r2v', 'h07', 'u1000', 'ar2v', 'ho7', 'cable energie', '3g', '5g', 'souple'] },
      { n: 'Câbles courant faible', k: ['cat6', 'cat 6', 'sytt', 'syt', 'coax', 'fibre', 'lycy', 'alarme', 'telephonique'] },
      { n: 'Fils & conducteurs', k: ['fil', 'h07v', 'conducteur', 'terre'] }
    ],
    'Goulottes & tubes IRO': [
      { n: 'Goulottes', k: ['goulotte', 'moulure', 'plinthe', 'couvercle', 'dlp'] },
      { n: 'Tubes IRO', k: ['iro', 'tube', 'mrl', 'manchon iro', 'coude'] },
      { n: 'Gaines', k: ['icta', 'gaine', 'tpc', 'annele'] },
      { n: 'Chemins de câbles', k: ['chemin de cable', 'dalle marine', 'cablofil', 'treillis', 'support', 'console'] }
    ],
    'Matériel de chantier': [
      { n: 'Outillage électroportatif', k: ['perceuse', 'visseuse', 'perforateur', 'meuleuse', 'scie', 'batterie', 'chargeur', 'aspirateur', 'rainureuse', 'makita', 'milwaukee', 'hilti', 'dewalt', 'bosch'] },
      { n: 'Mesure & contrôle', k: ['multimetre', 'testeur', 'pince', 'controleur', 'mesure', 'laser', 'niveau', 'telemetre', 'detecteur'] },
      { n: 'EPI & sécurité', k: ['casque', 'gant', 'lunette', 'gilet', 'harnais', 'masque', 'bouchon', 'chaussure', 'cadenas', 'consignation', 'balisage', 'rubalise', 'tapis isolant'] },
      { n: 'Éclairage & énergie chantier', k: ['projecteur', 'baladeuse', 'rallonge', 'enrouleur', 'coffret de chantier', 'groupe electrogene', 'touret'] }
    ],
    'Échelles, longueurs & divers': [
      { n: 'Échelles & escabeaux', k: ['echelle', 'escabeau', 'marchepied'] },
      { n: 'Longueurs', k: ['rail', 'profile', 'barre', 'tube', 'longueur', 'cornier'] }
    ],
    'PIRL / échafaudage': [
      { n: 'PIRL', k: ['pirl', 'plateforme'] },
      { n: 'Échafaudage', k: ['echafaudage', 'plancher', 'garde-corps', 'roue', 'stabilisateur'] }
    ]
  };
  function sansAccent(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function famillesDe(cat) { return (FAMILLES[cat] || []).map(function (f) { return f.n; }); }
  /** devine la famille à partir de la désignation (et des notes) */
  function guessFamille(cat, text) {
    // mot-clé reconnu en début de mot (« pac » ne doit pas trouver « capacité »)
    var t = ' ' + sansAccent(text).replace(/[^a-z0-9]+/g, ' ') + ' ', fams = FAMILLES[cat] || [], best = '', bestLen = 0;
    fams.forEach(function (f) {
      f.k.forEach(function (k) {
        var kk = sansAccent(k).replace(/[^a-z0-9]+/g, ' ').trim();
        if (kk && t.indexOf(' ' + kk) >= 0 && kk.length > bestLen) { best = f.n; bestLen = kk.length; }
      });
    });
    return best;
  }
  /* ---------- emplacements DÉDIÉS (colonne « Dédié à » de l'onglet Emplacements) ----------
     Exemples : « Appareillage Legrand », « Appareillage Schneider », « Éclairage », « Legrand », « Hager ; Disjoncteurs »
     Plusieurs règles séparées par « ; » ou « , ». Une règle = une famille (facultative) + des mots (marque, type…). */
  var ALL_FAMS = null;
  function allFams() {
    if (ALL_FAMS) return ALL_FAMS;
    ALL_FAMS = [];
    Object.keys(FAMILLES).forEach(function (c) { FAMILLES[c].forEach(function (f) { ALL_FAMS.push({ n: f.n, k: sansAccent(f.n).replace(/[^a-z0-9]+/g, ' ').trim() }); }); });
    ALL_FAMS.sort(function (a, b) { return b.k.length - a.k.length; });
    return ALL_FAMS;
  }
  function dedOf(l) { return String((l && (l[DED_COL] || l.Dedie)) || '').trim(); }
  var _rulesCache = {};
  function parseRules(text) {
    text = String(text || '').trim(); if (!text) return [];
    if (_rulesCache[text]) return _rulesCache[text];
    var out = text.split(/[;,\n]+/).map(function (r) {
      var t = ' ' + sansAccent(r).replace(/[^a-z0-9]+/g, ' ').trim() + ' ', fam = '';
      allFams().some(function (f) {
        if (t.indexOf(' ' + f.k + ' ') >= 0) { fam = f.n; t = t.replace(' ' + f.k + ' ', ' '); return true; }
        return false;
      });
      var words = t.trim() ? t.trim().split(' ').filter(function (w) { return w.length > 1; }) : [];
      return { fam: fam, words: words, label: r.trim() };
    }).filter(function (r) { return r.fam || r.words.length; });
    _rulesCache[text] = out;
    return out;
  }
  /** score de correspondance entre un emplacement dédié et un article : 0 = ne correspond pas */
  function dedScore(l, info) {
    var rules = parseRules(dedOf(l)); if (!rules.length || !info) return 0;
    var fam = famOf(info), hay = ' ' + sansAccent([info.Marque, info.Designation, info.Reference].join(' ')).replace(/[^a-z0-9]+/g, ' ') + ' ';
    var best = 0;
    rules.forEach(function (r) {
      if (r.fam && r.fam !== fam) return;
      if (r.words.some(function (w) { return hay.indexOf(' ' + w) < 0; })) return;
      best = Math.max(best, (r.fam ? 1 : 0) + r.words.length * 2);
    });
    return best;
  }
  function famOf(a) {
    if (!a) return '';
    var f = String(a.Famille || '').trim();
    return f || guessFamille(a.Categorie, [a.Designation, a.Notes].join(' '));
  }

  // RANGEMENT : les étagères intermédiaires (N2 à N5) pour le courant,
  // le pied (N1) pour le lourd, le dessus (DS) pour le volumineux léger.
  var RANGEMENTS = [
    { v: 'courant', l: 'Courant → étagères intermédiaires (N2 à N5)' },
    { v: 'lourd', l: 'Lourd → pied d\'étagère (N1)' },
    { v: 'volumineux', l: 'Volumineux → dessus (DS), sinon pied' }
  ];
  var RANG_KINDS = { courant: ['courant'], lourd: ['pied'], volumineux: ['dessus', 'pied'] };
  // Niveaux : 1 = en bas, on compte vers le haut. prio = ordre de remplissage automatique (hauteur d'homme d'abord)
  var NIVEAUX = {
    std: [{ n: 'N1', d: 'N1 bas (60 cm)', cap: 16, prio: 5 }, { n: 'N2', d: 'N2', cap: 16, prio: 1 }, { n: 'N3', d: 'N3', cap: 16, prio: 2 },
          { n: 'N4', d: 'N4', cap: 16, prio: 3 }, { n: 'N5', d: 'N5', cap: 16, prio: 4 }, { n: 'DS', d: 'dessus', cap: 16, prio: 6 }],
    touret: [{ n: 'N1', d: 'râtelier N1 (bas)', cap: 68, prio: 1 }, { n: 'N2', d: 'râtelier N2 (haut)', cap: 68, prio: 2 }],
    echelle: [{ n: 'N1', d: 'N1', cap: 32, prio: 1 }, { n: 'N2', d: 'N2', cap: 32, prio: 2 }, { n: 'N3', d: 'niveau haut', cap: 32, prio: 3 }],
    chantier: [{ n: 'N1', d: 'N1 bas (1 m)', cap: 16, prio: 1 }, { n: 'N2', d: 'N2 (40 cm)', cap: 16, prio: 2 },
               { n: 'N3', d: 'N3 (40 cm)', cap: 16, prio: 3 }, { n: 'DS', d: 'dessus', cap: 16, prio: 4 }],
    sol: null
  };
  var IMPLANTATION = [
    { Zone: 'A', Nom: 'CFA – courants faibles', racks: ['A1', 'A2', 'A3', 'A4'], niv: 'std', lieu: 'Mur nord' },
    { Zone: 'B', Nom: 'CFO – courants forts', racks: ['B1', 'B2', 'B3', 'B4'], niv: 'std', lieu: 'Mur ouest' },
    { Zone: 'M', Nom: 'CVC', racks: ['M1', 'M2'], niv: 'std', lieu: 'Mur ouest' },
    { Zone: 'L', Nom: 'TCE', racks: ['L1', 'L2', 'L3', 'L4'], niv: 'std', lieu: 'Mur sud (L4 dans l\'angle sud-ouest)' },
    { Zone: 'D', Nom: 'Câble', racks: ['D1'], niv: 'touret', lieu: 'Mur nord, râtelier' },
    { Zone: 'J', Nom: 'Goulottes & tubes IRO', racks: ['J1'], niv: 'echelle', lieu: 'Cloison du sas' },
    { Zone: 'H', Nom: 'Matériel de chantier', racks: ['H1', 'H2'], niv: 'chantier', lieu: 'Contre stocks sensibles' },
    { Zone: 'E', Nom: 'Échelles, longueurs & divers', racks: ['E'], niv: 'sol', cap: 76, lieu: 'Mur ouest' },
    { Zone: 'Z', Nom: 'PIRL / échafaudage', racks: ['Z1', 'Z2'], niv: 'sol', cap: 32, lieu: 'Z1 local technique, Z2 mur sud' },
    { Zone: 'C', Nom: 'Départ chantier', racks: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'], niv: 'std', lieu: 'Îlot central' },
    { Zone: 'F', Nom: 'Réception commandes', racks: ['F1', 'F2', 'F3'], niv: 'sol', cap: 16, lieu: 'Au sol devant l\'îlot' }
  ];
  var CATEGORIES = IMPLANTATION.map(function (z) { return { Zone: z.Zone, Nom: z.Nom }; });
  var CAT_DEFAUT = 'Échelles, longueurs & divers';
  // zones de passage : jamais proposées automatiquement à la création d'un article
  var ZONES_TRANSIT = ['Départ chantier', 'Réception commandes'];

  var ART_COLS = ['ID', 'Codes', 'Designation', 'Reference', 'Marque', 'Categorie', 'Unite',
    'Quantite', 'SeuilMini', 'Emplacement', 'DateCreation', 'DerniereMaj', 'MajPar', 'Notes', 'Place', 'Rangement', 'Famille'];
  var MVT_COLS = ['Date', 'Technicien', 'Type', 'ID', 'Designation', 'Quantite', 'StockApres',
    'Emplacement', 'Affaire', 'Commentaire'];
  var LOC_COLS = ['Code', 'Zone', 'Categorie', 'Capacite', 'Actif', 'Priorite', 'Description', 'Dédié à'];
  var DED_COL = 'Dédié à';
  var EDITABLE = ['Designation', 'Reference', 'Marque', 'Categorie', 'Unite', 'SeuilMini', 'Notes', 'Place', 'Rangement', 'Famille'];

  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function now() { return new Date().toISOString(); }
  function norm(c) { return String(c == null ? '' : c).trim(); }
  function splitCodes(s) {
    return String(s == null ? '' : s).split(/[,;\s]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function num(v) { var n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; }

  /** Emplacements : A1-N1 = étagère A1, niveau 1 (en bas) … A1-DS = dessus ; E, F1, Z1 = zones au sol */
  function defaultLocations() {
    var out = [];
    IMPLANTATION.forEach(function (z) {
      z.racks.forEach(function (r) {
        var niv = NIVEAUX[z.niv];
        if (!niv) {
          out.push({ Code: r, Zone: z.Zone, Categorie: z.Nom, Capacite: z.cap || 16, Actif: 'OUI', Priorite: 1, Description: z.Nom + ' – au sol' });
        } else niv.forEach(function (l) {
          out.push({ Code: r + '-' + l.n, Zone: z.Zone, Categorie: z.Nom, Capacite: l.cap, Actif: 'OUI', Priorite: l.prio,
            Description: z.Nom + ' – étagère ' + r + ', ' + l.d });
        });
      });
    });
    return out;
  }

  function findById(articles, id) {
    id = norm(id).toUpperCase();
    for (var i = 0; i < articles.length; i++) if (String(articles[i].ID).toUpperCase() === id) return articles[i];
    return null;
  }
  function findByCode(articles, code) {
    code = norm(code); if (!code) return null;
    var up = code.toUpperCase();
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      if (String(a.ID).toUpperCase() === up) return a;
      if (splitCodes(a.Codes).indexOf(code) >= 0) return a;
    }
    return null;
  }
  function placeVal(v) { if (v === '' || v === null || v === undefined) return 1; var n = Number(v); return isFinite(n) && n >= 0 ? n : 1; }
  function placeOf(a) { return placeVal(a && a.Place); }
  function capOf(l) { var c = Number(l && l.Capacite); return c > 0 ? c : 16; }
  /** cases occupées par emplacement (exceptId = article à ne pas compter, ex. celui qu'on déplace) */
  function occupancy(articles, exceptId) {
    var occ = {};
    articles.forEach(function (a) {
      if (exceptId && a.ID === exceptId) return;
      var e = norm(a.Emplacement).toUpperCase(); if (e) occ[e] = (occ[e] || 0) + placeOf(a);
    });
    return occ;
  }
  function fill(code, articles, locs, exceptId) {
    code = norm(code).toUpperCase();
    var l = null; for (var i = 0; i < locs.length; i++) if (String(locs[i].Code).toUpperCase() === code) l = locs[i];
    var used = occupancy(articles, exceptId)[code] || 0, cap = l ? capOf(l) : 0;
    return { used: used, cap: cap, free: cap - used, known: !!l };
  }
  function isActive(l) { return String(l.Actif || 'OUI').toUpperCase() !== 'NON'; }

  /** Attribue la première case libre de la zone de la catégorie (sinon zone Divers) */
  function rangOf(a) { var r = String((a && a.Rangement) || '').toLowerCase(); return RANG_KINDS[r] ? r : 'courant'; }
  function rangVal(v) { v = String(v || '').toLowerCase(); return RANG_KINDS[v] ? v : 'courant'; }
  function racksWithTop(locs) {
    var o = {}; locs.forEach(function (l) { var p = String(l.Code).toUpperCase().split('-'); if (p[1] === 'DS') o[p[0]] = true; }); return o;
  }
  /** type d'emplacement : 'pied' (N1 d'une étagère qui a un dessus), 'dessus' (DS) ou 'courant' */
  function locKind(code, locs, tops) {
    var p = String(code || '').toUpperCase().split('-'); if (p.length < 2) return 'courant';
    tops = tops || racksWithTop(locs);
    if (p[1] === 'DS') return 'dessus';
    if (p[1] === 'N1' && tops[p[0]]) return 'pied';
    return 'courant';
  }
  /** message si l'emplacement ne correspond pas au type de rangement ('' si OK) */
  function transitWarning(code, locs) {
    var c = String(code || '').toUpperCase(), l = null;
    for (var i = 0; i < locs.length; i++) if (String(locs[i].Code).toUpperCase() === c) l = locs[i];
    if (!l || ZONES_TRANSIT.indexOf(l.Categorie) < 0) return '';
    return c + ' est en zone « ' + l.Categorie + ' » : ce n\'est pas du stock. ' +
      (l.Categorie === 'Départ chantier' ? 'Le matériel qui part sur chantier se sort du stock (➖ Sortie avec le n° d\'affaire), puis se pose en zone C.'
        : 'Le matériel reçu se rentre en stock (➕ Entrée) puis se range sur son étagère.');
  }
  function rangWarning(code, rang, locs) {
    if (!code) return '';
    var tw = transitWarning(code, locs); if (tw) return tw;
    rang = rangVal(rang);
    var tops = racksWithTop(locs), k = locKind(code, locs, tops), rack = String(code).toUpperCase().split('-')[0];
    if (!tops[rack]) return '';
    if (rang === 'courant' && k !== 'courant') return code + ' (' + (k === 'pied' ? 'pied' : 'dessus') + ' d\'étagère) est réservé aux articles lourds ou volumineux.';
    if (rang === 'lourd' && k === 'dessus') return 'Article lourd sur le dessus de l\'étagère : risque de chute. Range-le en pied (N1).';
    if (rang === 'lourd' && k === 'courant') return 'Article lourd : à ranger de préférence en pied d\'étagère (N1).';
    if (rang === 'volumineux' && k === 'courant') return 'Article volumineux : à ranger de préférence sur le dessus (DS) ou en pied (N1).';
    return '';
  }
  /**
   * Place automatique. Ordre de préférence parmi les tablettes autorisées (catégorie + rangement) ayant assez de place :
   *  1) une tablette qui contient déjà la même famille
   *  2) une tablette vide sur une étagère qui contient déjà cette famille
   *  3) une tablette vide (on commence un nouveau bloc de famille)
   *  4) n'importe quelle tablette avec de la place (mélange en dernier recours)
   */
  function autoPlace(cat, articles, locs, place, exceptId, rangement, famille, info) {
    var occ = occupancy(articles, exceptId), need = placeVal(place), tops = racksWithTop(locs);
    var kinds = RANG_KINDS[rangVal(rangement)], fam = String(famille || '').trim();
    info = info || {}; if (!info.Categorie) info = { Categorie: cat, Famille: fam, Marque: info.Marque, Designation: info.Designation, Reference: info.Reference };
    if (!info.Famille && fam) info.Famille = fam;
    var famLevels = {}, famRacks = {}, used = {};
    articles.forEach(function (a) {
      if (exceptId && a.ID === exceptId) return;
      var e = norm(a.Emplacement).toUpperCase(); if (!e) return;
      used[e] = true;
      if (fam && a.Categorie === cat && famOf(a) === fam) { famLevels[e] = true; famRacks[e.split('-')[0]] = true; }
    });
    function C(l) { return String(l.Code).toUpperCase(); }
    function order(list) {
      return list.sort(function (a, b) {
        var ra = String(a.Code).split('-')[0], rb = String(b.Code).split('-')[0];
        return ra.localeCompare(rb, 'fr', { numeric: true }) || ((Number(a.Priorite) || 99) - (Number(b.Priorite) || 99)) ||
          String(a.Code).localeCompare(String(b.Code), 'fr', { numeric: true });
      });
    }
    function fits(l) { return (occ[C(l)] || 0) + need <= capOf(l); }
    var catLocs = locs.filter(function (l) { return l.Categorie === cat && isActive(l); });

    // 1) emplacement DÉDIÉ qui correspond (famille / marque) : prioritaire, quel que soit le niveau
    var scored = catLocs.map(function (l) { return { l: l, s: dedScore(l, info) }; }).filter(function (x) { return x.s > 0; });
    var dedRacks = {};
    scored.forEach(function (x) { dedRacks[C(x.l).split('-')[0]] = true; });
    var okDed = scored.filter(function (x) { return fits(x.l); });
    if (okDed.length) {
      var maxS = Math.max.apply(null, okDed.map(function (x) { return x.s; }));
      var top = okDed.filter(function (x) { return x.s === maxS; }).map(function (x) { return x.l; });
      return order(top)[0].Code;
    }
    // emplacements dédiés à AUTRE chose : réservés, on n'y met pas cet article
    function reservedOther(l) { return dedOf(l) && dedScore(l, info) === 0; }

    function pickIn(list) {
      var cand = order(list).filter(function (l) { return fits(l) && !reservedOther(l); });
      if (!cand.length) return null;
      // 2) son emplacement dédié est plein : on reste sur la même étagère (colonne)
      var sameRack = cand.filter(function (l) { return dedRacks[C(l).split('-')[0]]; });
      if (sameRack.length) {
        var r0 = sameRack.filter(function (l) { return famLevels[C(l)]; })[0] || sameRack.filter(function (l) { return !used[C(l)]; })[0] || sameRack[0];
        return r0.Code;
      }
      // 3) regroupement par famille
      if (fam) {
        var r = cand.filter(function (l) { return famLevels[C(l)]; })[0]
          || cand.filter(function (l) { return !used[C(l)] && famRacks[C(l).split('-')[0]]; })[0];
        if (r) return r.Code;
      }
      var empty = cand.filter(function (l) { return !used[C(l)]; })[0];
      return (empty || cand[0]).Code;
    }
    function pick(c, useKinds) {
      var all = locs.filter(function (l) { return l.Categorie === c && isActive(l); });
      if (useKinds) {
        // si la zone n'a aucun emplacement de ce type (ex. râtelier, zone au sol), tous les emplacements conviennent
        var has = all.some(function (l) { return kinds.indexOf(locKind(l.Code, locs, tops)) >= 0; });
        if (has) {
          for (var k = 0; k < kinds.length; k++) {
            var r = pickIn(all.filter(function (l) { return locKind(l.Code, locs, tops) === kinds[k]; }));
            if (r) return r;
          }
          return null;
        }
      }
      return pickIn(all);
    }
    // le pied et le dessus restent réservés : si les niveaux adaptés sont pleins, on passe en zone E (au sol)
    return pick(cat, true) || (ZONES_TRANSIT.indexOf(cat) < 0 ? pick(CAT_DEFAUT, false) : null) || 'À DÉFINIR';
  }

  function nextId(articles) {
    var max = 0;
    articles.forEach(function (a) {
      var m = /^ART-(\d+)$/i.exec(String(a.ID)); if (m) max = Math.max(max, Number(m[1]));
    });
    return 'ART-' + pad(max + 1, 6);
  }

  function mvt(type, art, qty, user, extra) {
    extra = extra || {};
    return {
      Date: now(), Technicien: user || '?', Type: type, ID: art.ID, Designation: art.Designation,
      Quantite: qty, StockApres: art.Quantite, Emplacement: art.Emplacement,
      Affaire: extra.affaire || '', Commentaire: extra.comment || ''
    };
  }
  function touch(art, user) { art.DerniereMaj = now(); art.MajPar = user || '?'; }

  function checkCodesFree(articles, codes, exceptId) {
    codes.forEach(function (c) {
      var other = findByCode(articles, c);
      if (other && other.ID !== exceptId) throw new Error('Le code ' + c + ' est déjà associé à : ' + other.Designation + ' (' + other.ID + ')');
    });
  }

  function create(db, a, user) {
    a = a || {};
    if (!norm(a.Designation)) throw new Error('La désignation est obligatoire');
    var codes = splitCodes(a.Codes);
    checkCodesFree(db.articles, codes, null);
    var q = num(a.Quantite || 0); if (!(q >= 0)) throw new Error('Quantité invalide');
    var cat = norm(a.Categorie) || CAT_DEFAUT, place = placeVal(a.Place), rang = rangVal(a.Rangement);
    var fam = norm(a.Famille) || guessFamille(cat, [a.Designation, a.Notes].join(' '));
    if (ZONES_TRANSIT.indexOf(cat) >= 0) throw new Error('« ' + cat + ' » est une zone de passage, pas une catégorie de stock : choisis la vraie catégorie de l\'article');
    var art = {
      ID: nextId(db.articles), Codes: codes.join(', '), Designation: norm(a.Designation),
      Reference: norm(a.Reference), Marque: norm(a.Marque), Categorie: cat,
      Unite: norm(a.Unite) || 'pièce', Quantite: q, SeuilMini: num(a.SeuilMini || 0) || 0,
      Emplacement: (norm(a.Emplacement) || autoPlace(cat, db.articles, db.locs, place, null, rang, fam, { Categorie: cat, Famille: fam, Marque: a.Marque, Designation: a.Designation, Reference: a.Reference })).toUpperCase(),
      DateCreation: now(), DerniereMaj: now(), MajPar: user || '?', Notes: norm(a.Notes), Place: place, Rangement: rang, Famille: fam
    };
    db.articles.push(art);
    return { article: art, mvt: mvt('CRÉATION', art, q, user) };
  }

  function move(db, r, user) {
    var art = findById(db.articles, r.id); if (!art) throw new Error('Article introuvable');
    var q = num(r.qty); if (!(q >= 0)) throw new Error('Quantité invalide');
    var cur = Number(art.Quantite) || 0, delta;
    if (r.type === 'ENTRÉE') { delta = q; }
    else if (r.type === 'SORTIE') {
      if (q > cur) throw new Error('Stock insuffisant : il n\'en reste que ' + cur);
      delta = -q;
    } else if (r.type === 'INVENTAIRE') { delta = q - cur; }
    else throw new Error('Type de mouvement inconnu');
    art.Quantite = Math.round((cur + delta) * 1000) / 1000;
    if (r.place !== undefined && r.place !== '' && r.place !== null) art.Place = placeVal(r.place);
    if (r.rangement) art.Rangement = rangVal(r.rangement);
    var extra = { affaire: r.affaire, comment: r.comment || '' };
    var to = norm(r.emplacement).replace(/^LOC:/i, '').toUpperCase();
    if (to && to !== String(art.Emplacement).toUpperCase()) {
      extra.comment = (extra.comment ? extra.comment + ' · ' : '') + 'rangé ' + (art.Emplacement || '?') + ' → ' + to;
      art.Emplacement = to;
    }
    touch(art, user);
    return { article: art, mvt: mvt(r.type, art, delta, user, extra) };
  }

  function relocate(db, r, user) {
    var art = findById(db.articles, r.id); if (!art) throw new Error('Article introuvable');
    var to = norm(r.emplacement).replace(/^LOC:/i, '').toUpperCase();
    if (!to) throw new Error('Emplacement manquant');
    var old = art.Emplacement; art.Emplacement = to; touch(art, user);
    return { article: art, mvt: mvt('DÉPLACEMENT', art, 0, user, { comment: (old || '?') + ' → ' + to }) };
  }

  function update(db, r, user) {
    var art = findById(db.articles, r.id); if (!art) throw new Error('Article introuvable');
    var f = r.fields || {};
    EDITABLE.forEach(function (k) {
      if (f[k] !== undefined) art[k] = k === 'Place' ? placeVal(f[k]) : k === 'Rangement' ? rangVal(f[k]) : k === 'SeuilMini' ? (num(f[k]) || 0) : norm(f[k]);
    });
    if (f.Codes !== undefined) {
      var codes = splitCodes(f.Codes); checkCodesFree(db.articles, codes, art.ID); art.Codes = codes.join(', ');
    }
    if (!art.Designation) throw new Error('La désignation est obligatoire');
    touch(art, user);
    return { article: art, mvt: mvt('MODIFICATION', art, 0, user) };
  }

  function addCode(db, r, user) {
    var art = findById(db.articles, r.id); if (!art) throw new Error('Article introuvable');
    var code = norm(r.code); if (!code) throw new Error('Code manquant');
    checkCodesFree(db.articles, [code], art.ID);
    var codes = splitCodes(art.Codes); if (codes.indexOf(code) < 0) codes.push(code);
    art.Codes = codes.join(', '); touch(art, user);
    return { article: art, mvt: mvt('CODE AJOUTÉ', art, 0, user, { comment: code }) };
  }

  /* ---------- identification tolérante (photo IA, référence tapée, quelques mots) ---------- */
  // référence comparée sans espaces / points / tirets et sans zéro de tête (« 06 71 11 » = « 067111 » = « 67111 »)
  function normRef(r) { return sansAccent(r).replace(/[^a-z0-9]/g, '').replace(/^0+(?=[0-9])/, ''); }
  /** recherche texte tolérante : chaque mot présent, OU la saisie collée (sans espaces ni zéro de tête) présente */
  function textMatch(a, q) {
    var words = sansAccent(q).split(/\s+/).filter(Boolean); if (!words.length) return true;
    var hay = sansAccent([a.Designation, a.Reference, a.Marque, a.Codes, a.Emplacement, a.ID, a.Categorie, a.Notes, a.Famille].join(' '));
    if (words.every(function (w) { return hay.indexOf(w) >= 0; })) return true;
    var cq = normRef(q); if (cq.length < 2) return false;
    var hc = sansAccent([a.Reference, a.Codes, a.Designation, a.ID].join('|')).replace(/[^a-z0-9|]/g, '');
    return hc.indexOf(cq) >= 0;
  }
  function tokens(t) {
    var stop = { de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, et: 1, en: 1, pour: 1, avec: 1, sans: 1, une: 1, un: 1 };
    return sansAccent(t).replace(/[^a-z0-9]+/g, ' ').split(' ').filter(function (w) { return w.length >= 2 && !stop[w]; });
  }
  /**
   * Classe les articles du stock selon leur ressemblance avec ce qui a été lu (photo) ou tapé.
   * f = { Codes, Reference, Marque, Designation } (champs facultatifs). Renvoie [{ a, score }] trié, score 0-100.
   */
  function matchArticles(articles, f) {
    f = f || {};
    var codes = splitCodes(f.Codes), ref = normRef(f.Reference), marque = normRef(f.Marque);
    var qTok = tokens([f.Designation, f.Reference, f.Marque].join(' '));
    var out = [];
    articles.forEach(function (a) {
      var s = 0;
      if (codes.length && splitCodes(a.Codes).some(function (c) { return codes.indexOf(c) >= 0; })) s = 100;
      if (codes.length && codes.some(function (c) { return String(c).toUpperCase() === String(a.ID).toUpperCase(); })) s = 100;
      var ar = normRef(a.Reference);
      if (s < 100 && ref && ar) {
        if (ar === ref) s = Math.max(s, 92);
        else if (ref.length >= 4 && ar.length >= 4 && (ar.indexOf(ref) >= 0 || ref.indexOf(ar) >= 0)) s = Math.max(s, 70);
      }
      if (s < 92 && qTok.length) {
        var aTok = tokens([a.Designation, a.Reference, a.Marque, a.Notes].join(' '));
        var hit = qTok.filter(function (w) { return aTok.some(function (x) { return x === w || (w.length >= 4 && (x.indexOf(w) === 0 || w.indexOf(x) === 0) && x.length >= 4); }); }).length;
        var sim = hit / Math.max(qTok.length, 1);
        var sc = Math.round(sim * 65);
        if (marque && normRef(a.Marque) === marque) sc += 10;
        s = Math.max(s, sc);
      }
      if (s >= 25) out.push({ a: a, score: Math.min(100, s) });
    });
    out.sort(function (x, y) { return y.score - x.score; });
    return out;
  }

  /** suppression définitive d'un article (la trace reste dans l'historique) */
  function remove(db, r, user) {
    var idx = -1, id = norm(r.id).toUpperCase();
    for (var i = 0; i < db.articles.length; i++) if (String(db.articles[i].ID).toUpperCase() === id) idx = i;
    if (idx < 0) throw new Error('Article introuvable');
    var art = db.articles[idx];
    db.articles.splice(idx, 1);
    var q = Number(art.Quantite) || 0;
    var trace = {}; Object.keys(art).forEach(function (k) { trace[k] = art[k]; }); trace.Quantite = 0;
    return { article: art, removed: true,
      mvt: mvt('SUPPRESSION', trace, -q, user, { comment: 'Article supprimé (stock au moment de la suppression : ' + q + ' ' + (art.Unite || '') + ')' + (r.comment ? ' · ' + r.comment : '') }) };
  }

  return {
    PLACES: PLACES, placeOf: placeOf, placeVal: placeVal, RANGEMENTS: RANGEMENTS, rangOf: rangOf, rangVal: rangVal,
    locKind: locKind, rangWarning: rangWarning, transitWarning: transitWarning,
    FAMILLES: FAMILLES, famillesDe: famillesDe, guessFamille: guessFamille, famOf: famOf,
    DED_COL: DED_COL, dedOf: dedOf, dedScore: dedScore, parseRules: parseRules, capOf: capOf, fill: fill, CATEGORIES: CATEGORIES, IMPLANTATION: IMPLANTATION, CAT_DEFAUT: CAT_DEFAUT, ZONES_TRANSIT: ZONES_TRANSIT, ART_COLS: ART_COLS, MVT_COLS: MVT_COLS, LOC_COLS: LOC_COLS,
    defaultLocations: defaultLocations, splitCodes: splitCodes, findById: findById, findByCode: findByCode,
    occupancy: occupancy, autoPlace: autoPlace, create: create, move: move, relocate: relocate,
    update: update, addCode: addCode, remove: remove, matchArticles: matchArticles, textMatch: textMatch, normRef: normRef
  };
})();
