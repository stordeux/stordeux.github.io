// Onglets : l'ancre de l'URL (#publications…) choisit l'onglet affiché.
// Les liens restent partageables et le bouton « retour » du navigateur fonctionne.
(function () {
  var panels = document.querySelectorAll('[data-tab]');
  var links = document.querySelectorAll('.menu a');

  function tabOf(hash) {
    var id = (hash || '').replace('#', '');
    var el = id && document.getElementById(id);
    // Une ancre interne (#recherche, #contact) ouvre l'onglet qui la contient
    return (el && el.closest('[data-tab]') && el.closest('[data-tab]').getAttribute('data-tab')) || 'accueil';
  }

  function show() {
    var tab = tabOf(location.hash);
    panels.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-tab') === tab); });
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + tab;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.getAttribute('data-tab') !== tab) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', show);
  show();
})();
