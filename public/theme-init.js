(function(){
  var theme = window.localStorage.getItem('minisoccer-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();
