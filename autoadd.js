const express = require("express")
const axios = require('axios')
const cors = require("cors");

const app = express()
app.use(cors())

// const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3030;

// CLIENT_SECRET stored in Config Vars
// const apiUrl = "https://accounts.spotify.com/api/token"; // Spotify Web API URL
const client_id = 'insert your client id here'; // Client id
const client_secret = 'insert your client secret here' // temp client secret
// const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = 'http://localhost:3030/callback/'; // Callback URL

let AT, RT; // Stores access and refresh tokens
const scope = [
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

// Call the updatePlaylist function to update the playlist
// updatePlaylist('71g02Ko1X9HBis6aK4B3K6'); playlistid

app.listen(port, () => console.log(`Listening on port: ${port}`));


