const express = require("express")
const axios = require('axios')
const cors = require("cors");

const app = express()
app.use(cors())

CLIENT_ID = "467fab359c114e719ecefafd6af299e5";
CLIENT_SECRET = "7c35b9d3886e48b48e5537cf7c7d1685";
PORT = 3030 // it is located in Spotify dashboard's Redirect URIs
REDIRECT_URI = `http://localhost:${PORT}/callback`;
PLAYLIST_ID = "71g02Ko1X9HBis6aK4B3K6";
SCOPE = [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
]

app.get("/login", (request, response) => {
    const redirect_url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${SCOPE}&state=123456&redirect_uri=${REDIRECT_URI}&prompt=consent`
    response.redirect(redirect_url);
})

const getToken = async (code) => {
    try {
        const resp = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                'grant_type': 'authorization_code',
                'redirect_uri': REDIRECT_URI,
                'code': code
            }),
            {
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

const getMyTracks = async (token) => {
    try {
        let offset = 0
        let next = 1
        const limit = 50;
        const tracks = [];
        while (next != null) {
            const resp = await axios.get(
                url = `https://api.spotify.com/v1/me/tracks/?limit=${limit}&offset=${offset}`,
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
            offset = offset + limit
            next = resp.data.next
        }
        return Promise.resolve(tracks)
    } catch (err) {
        console.error(err)
        return Promise.reject(err)
    }
};

const getPlaylistTracks = async (playlist, token) => {
    try {
        let offset = 0
        let next = 1
        const limit = 50;
        const tracks = [];
        while (next != null) {
            const resp = await axios.get(
                url = `https://api.spotify.com/v1/playlists/${playlist}/?offset=${offset}&limit=${limit}`,
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
            offset = offset + limit
            next = resp.data.next
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

app.get("/callback", async (request, response) => {
    const code = request.query["code"]
    getToken(code)
        .then(access_token => {
            getMyTracks(access_token)
                .then(my_tracks => {
                    getPlaylistTracks(PLAYLIST_ID, access_token)
                        .then(previous_tracks => {
                            updatePlaylistTracks(my_tracks, previous_tracks, access_token)
                                .then(new_tracks => {
                                    return response.send({ 'my tracks': my_tracks, 'previous playlist': previous_tracks, 'new playlist': new_tracks });
                                })
                            
                        })
                    
                })
        })
        .catch(error => {
            console.log(error.message);
        })
    })

app.listen(PORT, () => {
    console.log(`Listening on: ${PORT}`)
})