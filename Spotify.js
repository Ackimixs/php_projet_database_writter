import 'dotenv/config.js'

async function getToken() {
    try {
        const response = await fetch(`https://accounts.spotify.com/api/token?grant_type=client_credentials&client_id=${process.env.SPOTIFY_CLIENT_ID}&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200) {
            const data = await response.json();
            console.log('Spotify Token fetched');
            return data.access_token;
        } else {
            console.log('Could not fetch Spotify Token. Try resetting client id and secret');
        }
    } catch (error) {
        console.log('Could not fetch Spotify Token. Try resetting client id and secret');
    }
}

async function search(token, q, limit = 10, type = ['track']) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type.join(',')}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        });

        if (response.status === 200) {
            const searchData = await response.json();
            return searchData;
        } else {
            return undefined;
        }
    } catch (error) {
        console.log('Could not search on Spotify because of a networking error', error.message);
    }
}

async function searchPlaylist(token, q, limit = 10){
    return await search(token, q, limit, ['playlist']);
}

async function searchAlbum(token, q, limit = 10){
    return await search(token, q, limit, ['album']);
}

async function getAlbum(token, id) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        });

        if (response.status === 200) {
            return await response.json();
        } else {
            return undefined;
        }
    } catch (error) {
        console.log('Could not search on Spotify because of a networking error', error.message);
    }
}


async function getPlaylist(token, id) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        });

        if (response.status === 200) {
            return await response.json();
        } else {
            return undefined;
        }
    } catch (error) {
        console.log('Could not search on Spotify because of a networking error', error.message);
    }
}

async function getTrack(token, id) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        });

        if (response.status === 200) {
            const trackData = await response.json();
            return trackData;
        } else {
            return undefined;
        }
    } catch (error) {
        console.log('Could not search on Spotify because of a networking error', error.message);
    }
}

async function getArtist(token, id) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        });

        if (response.status === 200) {
            const artistData = await response.json();
            return artistData;
        } else {
            return undefined;
        }
    } catch (error) {
        console.log('Could not search on Spotify because of a networking error', error.message);
    }
}

export {
    getToken,
    search,
    searchPlaylist,
    getPlaylist,
    searchAlbum,
    getAlbum,
    getTrack,
    getArtist
}