const express = require("express")
const axios = require('axios')
const cors = require("cors");

const app = express()
app.use(cors())

// const __dirname = dirname(fileURLToPath(import.meta.url));
PORT = 3030;

// const apiUrl = "https://accounts.spotify.com/api/token"; // Spotify Web API URL
CLIENT_ID = 'insert your client id here'; // Client id
CLIENT_SECRET = 'insert your client secret here' // temp client secret
// const client_secret = process.env.CLIENT_SECRET;
REDIRECT_URI = `http://localhost:${PORT}/callback`  // Callback URL

let AT, RT; // Stores access and refresh tokens
SCOPE = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private'
];

const playlist_id = '71g02Ko1X9HBis6aK4B3K6';
const getToken = async (code) => {
  try {
      const resp = await axios.post(
          url = 'https://accounts.spotify.com/api/token',
          data = new URLSearchParams({
              'grant_type': 'authorization_code',
              'redirect_uri': REDIRECT_URI,
              'code': code
          }),
          config = {
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              auth: {
                  username: CLIENT_ID,
                  password: CLIENT_SECRET
              }
          })
      return Promise.resolve(resp.data.access_token);
  } catch (err) {
      console.error(err)
      return Promise.reject(err)
  }
}

const addSongs = async (playlist_id, tracks, token) => {
  try {
      const uris = []
      for(const track of tracks) {
          if (track.new) {
              uris.push(track.uri)
          }
      }

      const resp = await axios.post(
          url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
          data = {
              'uris': uris
          },
          config = {
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              }
          })
      return Promise.resolve(resp.data);
  } catch (err) {
      console.error(err)
      return Promise.reject(err)
  }
}

const getPlaylistTracks = async (playlist, token) => {
  try {
      const tracks = [];
      const resp = await axios.get(
          url = `https://api.spotify.com/v1/playlists/${playlist}`,
          config = {
              headers: {
                  'Accept-Encoding': 'application/json',
                  'Authorization': `Bearer ${token}`,
              }
          }
      );
      for(const item of resp.data.tracks.items) {
          if (item.track?.name != null) {
              tracks.push({
                  name: item.track.name,
                  external_urls: item.track.external_urls.spotify,
                  uri: item.track.uri,
                  new: false
              })
          }
      }
      return Promise.resolve(tracks)
  } catch (err) {
      console.error(err)
      return Promise.reject(err)
  }
};

// Call the updatePlaylist function to update the playlist
// updatePlaylist('71g02Ko1X9HBis6aK4B3K6'); playlistid

app.listen(port, () => console.log(`Listening on port: ${port}`));


