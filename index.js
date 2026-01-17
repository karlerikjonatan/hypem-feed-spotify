require('dotenv').config();

const axios = require('axios');
const cheerio = require('cheerio');
const SpotifyWebApi = require('spotify-web-api-node');
const { loadCache, isInCache, addToCache } = require('./cache');

const HYPEM_TAG_URLS = [
  "https://hypem.com/tags/acoustic",
  "https://hypem.com/tags/acoustic%20folk",
  "https://hypem.com/tags/alt-country",
  "https://hypem.com/tags/alt%20country",
  "https://hypem.com/tags/alternative%20country",
  "https://hypem.com/tags/ambient-country",
  "https://hypem.com/tags/ambient%20country",
  "https://hypem.com/tags/americana-folk",
  "https://hypem.com/tags/americana",
  "https://hypem.com/tags/americana%20folk",
  "https://hypem.com/tags/cosmic-country",
  "https://hypem.com/tags/cosmic%20country",
  "https://hypem.com/tags/country-rock",
  "https://hypem.com/tags/country",
  "https://hypem.com/tags/country%20rock",
  "https://hypem.com/tags/folk-pop",
  "https://hypem.com/tags/folk-rock",
  "https://hypem.com/tags/folk",
  "https://hypem.com/tags/folk%20pop",
  "https://hypem.com/tags/folk%20rock",
  "https://hypem.com/tags/heartland",
  "https://hypem.com/tags/indie-acoustic",
  "https://hypem.com/tags/indie-folk",
  "https://hypem.com/tags/indie%20acoustic",
  "https://hypem.com/tags/indie%20folk",
  "https://hypem.com/tags/modern-country",
  "https://hypem.com/tags/modern%20country",
  "https://hypem.com/tags/outlaw-country",
  "https://hypem.com/tags/outlaw%20country",
  "https://hypem.com/tags/roots-rock",
  "https://hypem.com/tags/roots",
  "https://hypem.com/tags/roots%20rock",
  "https://hypem.com/tags/singer-songwriter",
  "https://hypem.com/tags/songwriter"
];

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

async function refreshToken() {
  const data = await spotifyApi.refreshAccessToken();
  spotifyApi.setAccessToken(data.body['access_token']);
}

async function getHypemSongs() {
  const allSongs = [];

  for (const url of HYPEM_TAG_URLS) {
    console.log(`📡 Fetching from ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $('.section-player .track_name').each((i, elem) => {
      const title = $(elem).find('.track').text().trim();
      const artist = $(elem).find('.artist').text().trim();
      console.log({ title, artist })
      if (title && artist) {
        allSongs.push({ title, artist });
      }
    });
  }
  const uniqueSongs = Array.from(
    new Map(allSongs.map(song => [`${song.artist} - ${song.title}`, song])).values()
  );

  console.log(`🎵 Found ${uniqueSongs.length} unique songs.`);
  return uniqueSongs;
}

async function isTrackLiked(trackId) {
  const res = await spotifyApi.containsMySavedTracks([trackId]);
  return res.body[0];
}

async function main() {
  try {
    await refreshToken();
    const songs = await getHypemSongs();
    const cache = loadCache();

    for (const song of songs) {
      const query = `track:${song.title} artist:${song.artist}`;
      const res = await spotifyApi.searchTracks(query, { limit: 1 });

      if (res.body.tracks.items.length > 0) {
        const track = res.body.tracks.items[0];
        const releaseDate = track.album.release_date;
        const releaseYear = parseInt(releaseDate.split('-')[0], 10);

        // Filter by release year
        if (releaseYear !== 2026) {
          continue;
        }

        // Filter by popularity >= 10
        if (track.popularity < 10) {
          continue;
        }

        // Skip already indexed tracks
        if (isInCache(track.id, cache)) {
          continue;
        }

        // Skip already liked tracks
        const liked = await isTrackLiked(track.id);
        if (liked) {
          continue;
        }

        // Add track to playlist
        await spotifyApi.addTracksToPlaylist(PLAYLIST_ID, [`spotify:track:${track.id}`]);
        addToCache(track.id, cache);
      }

    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

main();
