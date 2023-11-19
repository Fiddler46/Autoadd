# Autoadd
Automatically adds your liked songs to a preferred playlist on Spotify.

# Usage
## Prerequisites
You will be required to create your own app in the [Spotify for Developers](https://developer.spotify.com/) dashboard in order to use your own parameters. 

Replace `client_secret` and `playlist_id` as well as the respective lines with the following parts of the code to your personal profile specific data:
```
CLIENT_ID =
CLIENT_SECRET =
PLAYLIST_ID =
REDIRECT_URI =
```

- The `CLIENT_ID` and `CLIENT_SECRET` can be found from the app you created.
- [Find](https://clients.caster.fm/knowledgebase/110/How-to-find-Spotify-playlist-ID.html) the `PLAYLIST_ID` of the playlist you'd like to copy your songs to.
- `REDIRECT_URI` can only be http://localhost:${PORT}/callback
---

## Running

Simply run the following to install the necessary packages.
```
npm install
```
Then start the program
```
node index.js
```

Now, simply login with your account after pressing the button and the app will parse through your library to add the songs!
