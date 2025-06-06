require('dotenv').config();

const express = require('express');

const openModule = require('open');
const open = openModule.default || openModule;

const SpotifyWebApi = require('spotify-web-api-node');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-library-read'];

const spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});

const app = express();

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    res.send('✅ Success! Copy your refresh token from the console.');
    console.log('\n🎉 Refresh Token:\n', data.body.refresh_token);
    process.exit();
  } catch (err) {
    console.error('Error getting tokens:', err);
    res.send('❌ Error occurred.');
  }
});

app.listen(8000, () => {
  console.log({ REDIRECT_URI })
  const authURL = spotifyApi.createAuthorizeURL(scopes, 'state');
  console.log('🌐 Opening browser for Spotify login...');
  open(authURL);
});
