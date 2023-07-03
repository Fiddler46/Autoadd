import Express from "express";
import request from 'request'; // "Request" library
import cors from 'cors';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';


const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Express();
const port = 3030;

// CLIENT_SECRET stored in Config Vars
const apiUrl = "https://accounts.spotify.com/api/token"; // Spotify Web API URL
const client_id = '467fab359c114e719ecefafd6af299e5'; // Client id
const client_secret = '7c35b9d3886e48b48e5537cf7c7d1685' // temp client secret
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


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
let generateRandomString = function (length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

let stateKey = 'spotify_auth_state';


app.get('/', function (req, res) {
  res.sendFile(__dirname + "/index.html");
  res.redirect('/login');
});

app.use(Express.static(__dirname + '/index.html'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function (req, res) {

  let state = generateRandomString(16);
  res.cookie(stateKey, state);

  //  app requests authorization
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  // app requests refresh and access tokens
  // after checking the state parameter

  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[stateKey] : null;

  //  console.log(state);
  //  console.log(storedState);

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };


    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        console.log(body);

        AT = body.access_token;
        RT = body.refresh_token;

        let options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + AT },
          json: true
        };

        interval = setInterval(requestToken, body.expires_in * 1000 * 0.70);

        previousExpires = body.expires_in;

        res.send("Logged in!");
      }
    });
  }
});



let interval;
let previousExpires = 0;

const requestToken = () => {

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: RT
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      console.error(error);
      return;
    }

    AT = body.access_token;

    if (body.refresh_token) {
      RT = body.refresh_token;
    }

    console.log("Access Token refreshed!");

    if (previousExpires != body.expires_in) {

      clearInterval(interval);

      interval = setInterval(requestToken, body.expires_in * 1000 * 0.70);

      previousExpires = body.expires_in;
    }
  });
}




// Write code for app here
// Function to get the user's library tracks
const getUserLibraryTracks = () => {
  return new Promise((resolve, reject) => {
    const options = {
      url: 'https://api.spotify.com/v1/me/tracks',
      headers: { 'Authorization': 'Bearer ' + AT },
      json: true
    };

    request.get(options, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        reject(error || new Error('Failed to get user library tracks'));
      } else {
        resolve(body.items.map(item => item.track));
      }
    });
  });
};

// Function to get the tracks in a playlist
const getPlaylistTracks = (playlistId) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      headers: { 'Authorization': 'Bearer ' + AT },
      json: true
    };

    request.get(options, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        reject(error || new Error('Failed to get playlist tracks'));
      } else {
        resolve(body.items.map(item => item.track));
      }
    });
  });
};

// Function to add tracks to a playlist
const addTracksToPlaylist = (playlistId, trackIds) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      headers: { 'Authorization': 'Bearer ' + AT },
      json: true,
      body: { uris: trackIds }
    };

    request.post(options, (error, response, body) => {
      if (error || response.statusCode !== 201) {
        reject(error || new Error('Failed to add tracks to playlist'));
      } else {
        resolve();
      }
    });
  });
};

// Function to update the playlist with new tracks
const updatePlaylist = async (playlistId) => {
  try {
    const libraryTracks = await getUserLibraryTracks();
    const playlistTracks = await getPlaylistTracks(playlistId);

    const trackIdsToAdd = libraryTracks
      .filter(track => !playlistTracks.some(playlistTrack => playlistTrack.id === track.id))
      .map(track => track.uri);

    await addTracksToPlaylist(playlistId, trackIdsToAdd);

    console.log('Playlist updated successfully');
  } catch (error) {
    console.error('Failed to update playlist:', error);
  }
};

// Call the updatePlaylist function to update the playlist
updatePlaylist('your_playlist_id_here');

app.listen(port, () => console.log(`Listening on port: ${port}`));


