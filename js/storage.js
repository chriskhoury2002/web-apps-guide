/* ============================================================
   storage.js — safe localStorage wrapper (namespaced wag:)
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  WAG.store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem('wag:' + key);
        return v === null ? (fallback === undefined ? null : fallback) : JSON.parse(v);
      } catch (e) { return fallback === undefined ? null : fallback; }
    },
    set: function (key, val) {
      try { localStorage.setItem('wag:' + key, JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) { try { localStorage.removeItem('wag:' + key); } catch (e) {} }
  };
})();
