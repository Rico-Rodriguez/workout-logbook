/* iOS app shim: WKWebView ignores <a download>, so route the logbook's
   "Export backup" through the native share sheet (Save to Files, AirDrop...).
   Does nothing in a normal browser. app.js is unchanged. */
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var blobs = {};
  var origCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (obj) {
    var u = origCreate(obj);
    if (obj instanceof Blob) blobs[u] = obj;
    return u;
  };
  function plugin(name) {
    return (C.Plugins && C.Plugins[name]) || C.registerPlugin(name);
  }
  function toBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  async function saveAndShare(href, name) {
    try {
      var blob = blobs[href] || (await (await fetch(href)).blob());
      delete blobs[href];
      var data = await toBase64(blob);
      var w = await plugin('Filesystem').writeFile({ path: name, data: data, directory: 'CACHE' });
      await plugin('Share').share({ title: name, files: [w.uri] });
    } catch (err) {
      var m = String((err && err.message) || err);
      if (!/cancel/i.test(m)) alert('Could not export the backup: ' + m);
    }
  }
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute('download') && /^(blob:|data:)/.test(this.href)) {
      saveAndShare(this.href, this.getAttribute('download') || 'download');
      return;
    }
    return origClick.call(this);
  };
})();
