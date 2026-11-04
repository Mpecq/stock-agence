/* ============================================================
   STOCK AGENCE — logique métier commune
   (utilisée à l'identique par l'appli et par le serveur Google)
   ============================================================ */
var Core = (function () {

  var CATEGORIES = [
    { Zone: 'A', Nom: 'Câbles & conducteurs' },
    { Zone: 'B', Nom: 'Cheminement (tubes, goulottes, chemins de câbles)' },
    { Zone: 'C', Nom: 'Appareillage (prises, interrupteurs)' },
    { Zone: 'D', Nom: 'Protection & tableaux' },
    { Zone: 'E', Nom: 'Éclairage' },
    { Zone: 'F', Nom: 'Connectique & raccordement' },
    { Zone: 'G', Nom: 'Courant faible / VDI / Sécurité' },
    { Zone: 'H', Nom: 'Fixations & consommables' },
    { Zone: 'I', Nom: 'Outillage & mesure' },
    { Zone: 'J', Nom: 'EPI & sécurité chantier' },
    { Zone: 'K', Nom: 'Divers' }
  ];

  var ART_COLS = ['ID', 'Codes', 'Designation', 'Reference', 'Marque', 'Categorie', 'Unite',
    'Quantite', 'SeuilMini', 'Emplacement', 'DateCreation', 'DerniereMaj', 'MajPar', 'Notes'];
  var MVT_COLS = ['Date', 'Technicien', 'Type', 'ID', 'Designation', 'Quantite', 'StockApres',
    'Emplacement', 'Affaire', 'Commentaire'];
  var LOC_COLS = ['Code', 'Zone', 'Categorie', 'Capacite', 'Actif'];
  var EDITABLE = ['Designation', 'Reference', 'Marque', 'Categorie', 'Unite', 'SeuilMini', 'Notes'];

  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function now() { return new Date().toISOString(); }
  function norm(c) { return String(c == null ? '' : c).trim(); }
  function splitCodes(s) {
    return String(s == null ? '' : s).split(/[,;\s]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function num(v) { var n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; }

  /** Emplacements par défaut : 1 zone par catégorie, 4 étagères x 5 niveaux, 6 articles par case */
  function defaultLocations(etageres, niveaux, capacite) {
    etageres = etageres || 4; niveaux = niveaux || 5; capacite = capacite || 6;
    var out = [];
    CATEGORIES.forEach(function (c) {
      for (var e = 1; e <= etageres; e++) for (var n = 1; n <= niveaux; n++) {
        out.push({ Code: c.Zone + '-' + pad(e, 2) + '-' + n, Zone: c.Zone, Categorie: c.Nom, Capacite: capacite, Actif: 'OUI' });
      }
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
  function occupancy(articles) {
    var occ = {};
    articles.forEach(function (a) { var e = norm(a.Emplacement); if (e) occ[e] = (occ[e] || 0) + 1; });
    return occ;
  }
  function isActive(l) { return String(l.Actif || 'OUI').toUpperCase() !== 'NON'; }

  /** Attribue la première case libre de la zone de la catégorie (sinon zone Divers) */
  function autoPlace(cat, articles, locs) {
    var occ = occupancy(articles);
    function pick(c) {
      var cand = locs.filter(function (l) { return l.Categorie === c && isActive(l); })
        .sort(function (a, b) { return String(a.Code).localeCompare(String(b.Code)); });
      for (var i = 0; i < cand.length; i++) {
        if ((occ[cand[i].Code] || 0) < (Number(cand[i].Capacite) || 6)) return cand[i].Code;
      }
      return null;
    }
    return pick(cat) || pick('Divers') || 'À DÉFINIR';
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
    var cat = norm(a.Categorie) || 'Divers';
    var art = {
      ID: nextId(db.articles), Codes: codes.join(', '), Designation: norm(a.Designation),
      Reference: norm(a.Reference), Marque: norm(a.Marque), Categorie: cat,
      Unite: norm(a.Unite) || 'pièce', Quantite: q, SeuilMini: num(a.SeuilMini || 0) || 0,
      Emplacement: norm(a.Emplacement) || autoPlace(cat, db.articles, db.locs),
      DateCreation: now(), DerniereMaj: now(), MajPar: user || '?', Notes: norm(a.Notes)
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
    touch(art, user);
    return { article: art, mvt: mvt(r.type, art, delta, user, r) };
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
      if (f[k] !== undefined) art[k] = k === 'SeuilMini' ? (num(f[k]) || 0) : norm(f[k]);
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
    CATEGORIES: CATEGORIES, ART_COLS: ART_COLS, MVT_COLS: MVT_COLS, LOC_COLS: LOC_COLS,
    defaultLocations: defaultLocations, splitCodes: splitCodes, findById: findById, findByCode: findByCode,
    occupancy: occupancy, autoPlace: autoPlace, create: create, move: move, relocate: relocate,
    update: update, addCode: addCode
  };
})();
