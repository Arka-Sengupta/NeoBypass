(function() {
  const id = 'np-ss-auth-port';
  let port = document.getElementById(id);
  if (!port) {
    port = document.createElement('span');
    port.id = id;
    port.style.display = 'none';
    document.documentElement.append(port);
  }

  const sync = () => {
    port.dataset.npLoggedIn = 'true';
    port.dataset.npIsPro = 'true';
  };

  sync();
})();
