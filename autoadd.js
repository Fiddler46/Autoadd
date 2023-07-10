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

const update_track = (arr, track) => {
  const { length } = arr;
  const id = length + 1;
  const found = arr.some(el => el.external_urls === track.external_urls);
  if (!found) {
      arr.push({ name : track.name, external_urls: track.external_urls, uri: track.uri, new: true })
  };
  return arr;
}

const updatePlaylistTracks = async (my_tracks, previous_tracks, token) => {
  try {
      new_tracks = previous_tracks.map(a => Object.assign({}, a));
      // update new playlist with my_tracks and previous_tracks
      for(const track of my_tracks) {
          new_tracks = update_track(new_tracks, track)
      }
      return Promise.resolve(new_tracks)
  } catch (err) {
      console.error(err)
      return Promise.reject(err)
  }
};
const getMyTracks = async (token) => {
  try {
      const tracks = [];
      const resp = await axios.get(
          url = 'https://api.spotify.com/v1/me/tracks',
          config = {
              headers: {
                  'Accept-Encoding': 'application/json',
                  'Authorization': `Bearer ${token}`,
              }
          }
      );
      for(const item of resp.data.items) {
          if(item.track?.name != null) {
              tracks.push({
                  name: item.track.name,
                  external_urls: item.track.external_urls.spotify,
                  uri: item.track.uri,
                  new: false,
                  added_at: item.added_at
              })
          }
      }
      return Promise.resolve(tracks)
  } catch (err) {
      console.error(err)
      return Promise.reject(err)
  }
};

app.get("/login", (request, response) => {
  const redirect_url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${SCOPE}&state=123456&redirect_uri=${REDIRECT_URI}&prompt=consent`
  response.redirect(redirect_url);
});

app.get("/callback", async (request, response) => {
  const code = request.query["code"]
  getToken(code)
      .then(access_token => {
          getMyTracks(access_token)
              .then(my_tracks => {
                  getPlaylistTracks(PLAY_LIST_ID, access_token)
                      .then(previous_tracks => {
                          updatePlaylistTracks(my_tracks, previous_tracks, access_token)
                              .then(new_tracks => {
                                  addSongs(playlist, new_tracks, access_token)
                                      .then(songs => {
                                          return response.send({ 'my tracks': my_tracks , 'previous playlist': previous_tracks, 'new playlist': new_tracks, 'songs': songs });
                                      })
                              })
                      })
              })
      })
      .catch(error => {
          console.log(error.message);
      })
})
// Call the updatePlaylist function to update the playlist
// updatePlaylist('71g02Ko1X9HBis6aK4B3K6'); playlistid

app.listen(port, () => console.log(`Listening on port: ${port}`));


