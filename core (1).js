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
    { Zone: 'L', Nom: 'TCE', racks: ['L1', 'L2', 'L3'], niv: 'std', lieu: 'Mur sud' },
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
    'Quantite', 'SeuilMini', 'Emplacement', 'DateCreation', 'DerniereMaj', 'MajPar', 'Notes', 'Place', 'Rangement'];
  var MVT_COLS = ['Date', 'Technicien', 'Type', 'ID', 'Designation', 'Quantite', 'StockApres',
    'Emplacement', 'Affaire', 'Commentaire'];
  var LOC_COLS = ['Code', 'Zone', 'Categorie', 'Capacite', 'Actif', 'Priorite', 'Description'];
  var EDITABLE = ['Designation', 'Reference', 'Marque', 'Categorie', 'Unite', 'SeuilMini', 'Notes', 'Place', 'Rangement'];

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
  function rangWarning(code, rang, locs) {
    if (!code) return '';
    rang = rangVal(rang);
    var tops = racksWithTop(locs), k = locKind(code, locs, tops), rack = String(code).toUpperCase().split('-')[0];
    if (!tops[rack]) return '';
    if (rang === 'courant' && k !== 'courant') return code + ' (' + (k === 'pied' ? 'pied' : 'dessus') + ' d\'étagère) est réservé aux articles lourds ou volumineux.';
    if (rang === 'lourd' && k === 'dessus') return 'Article lourd sur le dessus de l\'étagère : risque de chute. Range-le en pied (N1).';
    if (rang === 'lourd' && k === 'courant') return 'Article lourd : à ranger de préférence en pied d\'étagère (N1).';
    if (rang === 'volumineux' && k === 'courant') return 'Article volumineux : à ranger de préférence sur le dessus (DS) ou en pied (N1).';
    return '';
  }
  function autoPlace(cat, articles, locs, place, exceptId, rangement) {
    var occ = occupancy(articles, exceptId), need = placeVal(place), tops = racksWithTop(locs);
    var kinds = RANG_KINDS[rangVal(rangement)];
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
    function pickIn(list) {
      var cand = list
        .sort(function (a, b) {
          var ra = String(a.Code).split('-')[0], rb = String(b.Code).split('-')[0];
          return ra.localeCompare(rb, 'fr', { numeric: true }) || ((Number(a.Priorite) || 99) - (Number(b.Priorite) || 99)) ||
            String(a.Code).localeCompare(String(b.Code), 'fr', { numeric: true });
        });
      for (var i = 0; i < cand.length; i++) {
        if ((occ[String(cand[i].Code).toUpperCase()] || 0) + need <= capOf(cand[i])) return cand[i].Code;
      }
      return null;
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
    var art = {
      ID: nextId(db.articles), Codes: codes.join(', '), Designation: norm(a.Designation),
      Reference: norm(a.Reference), Marque: norm(a.Marque), Categorie: cat,
      Unite: norm(a.Unite) || 'pièce', Quantite: q, SeuilMini: num(a.SeuilMini || 0) || 0,
      Emplacement: (norm(a.Emplacement) || autoPlace(cat, db.articles, db.locs, place, null, rang)).toUpperCase(),
      DateCreation: now(), DerniereMaj: now(), MajPar: user || '?', Notes: norm(a.Notes), Place: place, Rangement: rang
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

  return {
    PLACES: PLACES, placeOf: placeOf, placeVal: placeVal, RANGEMENTS: RANGEMENTS, rangOf: rangOf, rangVal: rangVal,
    locKind: locKind, rangWarning: rangWarning, capOf: capOf, fill: fill, CATEGORIES: CATEGORIES, IMPLANTATION: IMPLANTATION, CAT_DEFAUT: CAT_DEFAUT, ZONES_TRANSIT: ZONES_TRANSIT, ART_COLS: ART_COLS, MVT_COLS: MVT_COLS, LOC_COLS: LOC_COLS,
    defaultLocations: defaultLocations, splitCodes: splitCodes, findById: findById, findByCode: findByCode,
    occupancy: occupancy, autoPlace: autoPlace, create: create, move: move, relocate: relocate,
    update: update, addCode: addCode
  };
})();
