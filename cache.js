const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.resolve(__dirname, 'cache.json');

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return { tracks: [] };
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
}

function isInCache(trackId, cache) {
  return cache.tracks.includes(trackId);
}

function addToCache(trackId, cache) {
  cache.tracks.push(trackId);
  saveCache(cache);
}

module.exports = {
  loadCache,
  isInCache,
  addToCache,
};
