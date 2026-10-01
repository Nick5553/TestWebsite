/**
 * storage.js — tiny wrapper around localStorage.
 *
 * Every key is prefixed with "novaStore." so "Reset demo data" only clears
 * this app's data. Reads never throw: if storage is unavailable or the JSON
 * is corrupt, the fallback value is returned instead.
 */
const AppStorage = (() => {
  const PREFIX = 'novaStore.';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn(`Could not read "${key}" from localStorage`, error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not write "${key}" to localStorage`, error);
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (error) {
      console.warn(`Could not remove "${key}" from localStorage`, error);
    }
  }

  /** Removes every key this app owns (cart, users, session, orders). */
  function clearAll() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Could not clear localStorage', error);
    }
  }

  return { PREFIX, read, write, remove, clearAll };
})();
