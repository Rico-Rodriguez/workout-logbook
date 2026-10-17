/* iOS app shim. The website build never loads this file.
   WKWebView ignores <a download>, clips the keyboard over inputs, and has no
   haptics, so the native shell fills those gaps without changing app.js. */
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

  function quiet(p) {
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }

  function impact(style) {
    quiet(plugin('Haptics').impact({ style: style }));
  }
  function selection() {
    quiet(plugin('Haptics').selectionChanged());
  }
  function successTap() {
    quiet(plugin('Haptics').notification({ type: 'SUCCESS' }));
  }

  var origExec = document.execCommand.bind(document);
  document.execCommand = function (cmd) {
    var ok = false;
    try { ok = origExec(cmd); } catch (e) { ok = false; }
    if (String(cmd).toLowerCase() === 'copy') {
      var el = document.activeElement;
      var text = el && 'value' in el ? String(el.value || '') : '';
      if (text) quiet(plugin('Clipboard').write({ string: text }));
    }
    return ok;
  };

  var REST_NOTIF = 1401;
  var notifReady = null;
  var scheduledAt = 0;
  var awake = {};
  var restWasRunning = false;
  var lastRestRemaining = null;

  function setAwake(reason, on) {
    if (on) awake[reason] = true;
    else delete awake[reason];
    var any = false;
    for (var k in awake) if (awake[k]) any = true;
    quiet(plugin('NativeKit').setKeepAwake({ on: any }));
  }

  var notifPending = false;
  function ensureNotifPermission() {
    if (notifReady === true) return Promise.resolve(true);
    if (notifReady === false || notifPending) return Promise.resolve(false);
    notifPending = true;
    var notes = plugin('LocalNotifications');
    return notes.checkPermissions().then(function (res) {
      if (res && res.display === 'granted') return true;
      if (res && res.display === 'denied') return false;
      return notes.requestPermissions().then(function (asked) {
        return !!(asked && asked.display === 'granted');
      });
    }).then(function (ok) {
      notifPending = false;
      notifReady = ok;
      return ok;
    }).catch(function () {
      notifPending = false;
      return false;
    });
  }

  function cancelRestNotif() {
    scheduledAt = 0;
    quiet(plugin('LocalNotifications').cancel({ notifications: [{ id: REST_NOTIF }] }));
  }

  function scheduleRestNotif(when) {
    if (!when || when - Date.now() < 900) {
      cancelRestNotif();
      return;
    }
    ensureNotifPermission().then(function (ok) {
      if (!ok) return;
      scheduledAt = when;
      quiet(plugin('LocalNotifications').schedule({
        notifications: [{
          id: REST_NOTIF,
          title: 'Rest over',
          body: 'Time for the next set.',
          schedule: { at: new Date(when) }
        }]
      }));
    });
  }

  function syncTimers() {
    var state = window.AppState;
    var clock = window.SessionClock;
    if (!state) return;
    var restOn = !!(state.timer && state.timer.isRunning);
    var remaining = null;
    try { remaining = window.getRemainingRestSeconds(); } catch (e) { remaining = null; }
    setAwake('rest', restOn);
    setAwake('session', !!(clock && clock.running));
    setAwake('vacuum', !!(state.vacuum && state.vacuum.isRunning));
    if (restOn) {
      var target = state.timer.targetTimestamp;
      if (target && Math.abs(target - scheduledAt) > 800) scheduleRestNotif(target);
      lastRestRemaining = remaining;
    } else {
      if (scheduledAt) cancelRestNotif();
      if (restWasRunning && lastRestRemaining !== null && lastRestRemaining <= 2) successTap();
      lastRestRemaining = null;
    }
    restWasRunning = restOn;
  }

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    if (btn.id && btn.id.indexOf('nav-btn-') === 0) selection();
    else if (btn.closest('#day-tabs')) selection();
  }, true);

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || !el.matches || !el.matches('input, textarea')) return;
    setTimeout(function () {
      try { el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch (err) {}
    }, 280);
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.toggleSetDone === 'function') {
      var origToggle = window.toggleSetDone;
      window.toggleSetDone = function (exId, idx) {
        var before = false;
        try { before = !!(window.prog().logs[exId][idx].done); } catch (e) {}
        var result = origToggle.apply(this, arguments);
        var after = before;
        try { after = !!(window.prog().logs[exId][idx].done); } catch (e) {}
        if (after && !before) impact('MEDIUM');
        else if (!after && before) impact('LIGHT');
        return result;
      };
    }
    syncTimers();
    setInterval(syncTimers, 500);
  });
})();
