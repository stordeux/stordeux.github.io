// Bascule FR/EN : le CSS masque les éléments [data-l] de la langue inactive.
(function () {
  var btn = document.getElementById('lang-toggle');
  btn.addEventListener('click', function () {
    var l = document.documentElement.lang === 'fr' ? 'en' : 'fr';
    document.documentElement.lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  });
})();
