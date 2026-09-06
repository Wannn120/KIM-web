(function(){
  var theme = 'light';

  try {
    var savedTheme = window.localStorage.getItem('minisoccer-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme = savedTheme;
    }
  } catch (error) {
    theme = 'light';
  }

  document.documentElement.setAttribute('data-theme', theme);
})();
