// Publications chargées en direct depuis l'API HAL (idHal : sebastien-tordeux).
(function () {
  var ID_HAL = 'sebastien-tordeux';
  var API = 'https://api.archives-ouvertes.fr/search/?q=authIdHal_s:' + ID_HAL +
    '&fl=title_s,authFullName_s,producedDateY_i,docType_s,citationRef_s,uri_s,doiId_s,fileMain_s' +
    '&sort=producedDateY_i%20desc&rows=1000&wt=json';

  // Catégories affichées (les types HAL sont regroupés)
  var CATS = [
    { key: 'ART',    fr: 'Articles',            en: 'Journal articles', types: ['ART'] },
    { key: 'COMM',   fr: 'Conférences',         en: 'Conferences',      types: ['COMM', 'PRESCONF', 'POSTER'] },
    { key: 'COUV',   fr: 'Chapitres',           en: 'Book chapters',    types: ['COUV', 'OUV'] },
    { key: 'REPORT', fr: 'Rapports',            en: 'Reports',          types: ['REPORT'] },
    { key: 'PRE',    fr: 'Prépublications',     en: 'Preprints',        types: ['UNDEFINED'] },
    { key: 'THESE',  fr: 'Thèse et HDR',        en: 'PhD & habilitation', types: ['THESE', 'HDR'] },
    { key: 'OTHER',  fr: 'Autres',              en: 'Other',            types: [] }
  ];
  function catOf(type) {
    for (var i = 0; i < CATS.length - 1; i++) if (CATS[i].types.indexOf(type) >= 0) return CATS[i].key;
    return 'OTHER';
  }

  var listEl = document.getElementById('pub-list');
  var statusEl = document.getElementById('pub-status');
  var filtersEl = document.getElementById('pub-filters');
  var searchEl = document.getElementById('pub-search');

  var docs = [];
  var activeCat = 'ALL';
  var query = '';

  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'fr'; }
  function t(fr, en) { return lang() === 'en' ? en : fr; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function authors(list) {
    return (list || []).map(function (a) {
      return /tordeux/i.test(a) ? '<b>' + esc(a) + '</b>' : esc(a);
    }).join(', ');
  }

  function renderFilters() {
    var counts = { ALL: docs.length };
    docs.forEach(function (d) { counts[d.cat] = (counts[d.cat] || 0) + 1; });
    var items = [{ key: 'ALL', fr: 'Tout', en: 'All' }].concat(CATS).filter(function (c) { return counts[c.key]; });
    filtersEl.innerHTML = items.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + c.key + '" aria-pressed="' + (c.key === activeCat) + '">' +
        esc(t(c.fr, c.en)) + '<span class="n">' + counts[c.key] + '</span></button>';
    }).join('');
  }

  function render() {
    var q = norm(query.trim());
    var shown = docs.filter(function (d) {
      return (activeCat === 'ALL' || d.cat === activeCat) && (!q || d.haystack.indexOf(q) >= 0);
    });

    statusEl.textContent = shown.length + ' / ' + docs.length + ' ' + t('documents', 'documents');

    var html = '';
    var year = null;
    shown.forEach(function (d) {
      if (d.year !== year) {
        if (year !== null) html += '</ol>';
        year = d.year;
        html += '<h4 class="pub-year">' + (year || '—') + '</h4><ol class="pubs">';
      }
      var catLabel = CATS.filter(function (c) { return c.key === d.cat; })[0];
      var links = '<a href="' + esc(d.uri) + '">HAL</a>';
      if (d.doi) links += '<a href="https://doi.org/' + esc(d.doi) + '">DOI</a>';
      if (d.pdf) links += '<a href="' + esc(d.pdf) + '">PDF</a>';
      html += '<li>' +
        '<div class="pub-title"><span class="badge">' + esc(t(catLabel.fr, catLabel.en)) + '</span>' + esc(d.title) + '</div>' +
        '<div class="pub-meta">' + authors(d.authors) + '</div>' +
        '<div class="pub-meta">' + esc(d.ref) + '<span class="pub-links">' + links + '</span></div>' +
        '</li>';
    });
    if (year !== null) html += '</ol>';
    listEl.innerHTML = html || '<p class="aside">' + t('Aucun résultat.', 'No results.') + '</p>';
  }

  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    activeCat = b.getAttribute('data-cat');
    renderFilters();
    render();
  });
  searchEl.addEventListener('input', function () { query = searchEl.value; render(); });
  document.addEventListener('langchange', function () { if (docs.length) { renderFilters(); render(); } });

  statusEl.textContent = t('Chargement des publications depuis HAL…', 'Loading publications from HAL…');

  fetch(API)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      docs = data.response.docs.map(function (d) {
        var title = (d.title_s && d.title_s[0]) || '';
        var ref = d.citationRef_s || '';
        return {
          title: title,
          authors: d.authFullName_s,
          year: d.producedDateY_i,
          cat: catOf(d.docType_s),
          ref: /^\d{4}$/.test(ref.trim()) ? '' : ref.replace(/\s*⟨[^⟩]*⟩/g, ''),
          uri: d.uri_s,
          doi: d.doiId_s,
          pdf: d.fileMain_s,
          haystack: norm(title + ' ' + (d.authFullName_s || []).join(' ') + ' ' + ref)
        };
      });
      renderFilters();
      render();
    })
    .catch(function () {
      statusEl.innerHTML = t('Impossible de joindre HAL pour le moment. ', 'HAL is unreachable right now. ') +
        '<a href="https://hal.science/search/index/?q=authIdHal_s:' + ID_HAL + '">' + t('Voir la liste sur HAL', 'See the list on HAL') + '</a>.';
    });
})();
