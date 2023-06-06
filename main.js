import 'dotenv/config.js';
import { Spotify as SpotifyDL } from 'spotifydl-core';
import { getToken, search, searchPlaylist, getPlaylist, searchAlbum, getAlbum, getTrack, getArtist } from './Spotify.js';
import Client from 'pg';

const spotifyDL = new SpotifyDL({
    clientId: process.env.SPOTIFY_CLIENT_ID, // <-- add your own clientId
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET, // <-- add your own clientSecret
});

const pgClient = new Client.Client({
  host: 'localhost',
  port: 5432,
  database: 'php_projet',
  user: 'postgres',
  password: process.env.POSTGRESQL_PASSWORD,
});

async function downloadsFromSpotify() {
    let text = 'SELECT * FROM musique INNER JOIN public.artiste a on a.id_artiste = musique.id_artiste_principale'
    try {
        let res = await pgClient.query(text);
        for (let i = 0; i < res.rows.length; i++) {
            let track = res.rows[i];
            try {
                await spotifyDL.downloadTrack("https://open.spotify.com/track/" + track.id_spotify, "music/" + track.id_musique + ".mp3");
                console.log("Downloaded song : " + (i+1) + "/" + res.rows.length);
            } catch (err) {
                console.log(err.stack)
            }
        }
    } catch (err) {
        console.log(err.stack)
    }
}

async function fetchAlbum(token, query) {
    let res;
    console.log(query)
    const album = await getAlbum(token, query);

    if (!album) return;

    let artistsAlbumSpotify = album.artists[0];
    let artistsSpotify = await getArtist(token, artistsAlbumSpotify.id);
    let artistsDB = await pgClient.query('SELECT * FROM artiste WHERE nom_artiste = $1', [artistsAlbumSpotify.name]);
    if (artistsDB.rows.length === 0) {
        artistsDB = await pgClient.query('INSERT INTO artiste (nom_artiste, type_artiste, image_artiste) VALUES ($1, $2, $3) RETURNING *', [artistsAlbumSpotify.name, artistsAlbumSpotify.type, artistsSpotify?.images?.length > 0 ? artistsSpotify.images[0].url : null]);
    }

    let albumDB = await pgClient.query('INSERT INTO album (image_album, titre_album, id_artiste, genre_album) VALUES ($1, $2, $3, $4) RETURNING *', [album.images[0].url, album.name, artistsDB.rows[0].id_artiste, album.genres.join(", ")]);

    // Every track of an album
    for (let j = 0; j < album.tracks.items.length; j++) {
        let track = await getTrack(token, album.tracks.items[j].id);

        if (track) {
            let trackDB = await pgClient.query('SELECT * FROM musique WHERE id_spotify = $1', [track.id]);

            if (trackDB.rows.length === 0) {

                let artistDB = await pgClient.query('SELECT * FROM artiste WHERE nom_artiste = $1', [track.artists[0].name]);
                if (artistDB.rows.length === 0) {
                    let artistSpo = await getArtist(token, track.artists[0].id);
                    artistDB = await pgClient.query('INSERT INTO artiste (nom_artiste, type_artiste, image_artiste) VALUES ($1, $2, $3) RETURNING *', [track.artists[0].name, track.artists[0].type, artistSpo.images.length > 0 ? artistSpo.images[0].url : null]);
                }

                // Get the first artist of a track
                let musiqueDB = await pgClient.query('INSERT INTO musique (titre_musique, temps_musique, id_spotify, id_artiste_principale, id_album) VALUES ($1, $2, $3, $4, $5) RETURNING *', [track.name, track.duration_ms, track.id, artistDB.rows[0].id_artiste, albumDB.rows[0].id_album]);
                musiqueDB = await pgClient.query('UPDATE musique SET url_musique = $1 WHERE id_musique = $2 RETURNING *', [encodeURI(`https://r2.ackimixs.xyz/${musiqueDB.rows[0].id_musique}.mp3`).split(" ").join(""), musiqueDB.rows[0].id_musique])
                // Every artist of a track
                for (let k = 0; k < track.artists.length; k++) {
                    let artisteTrack = track.artists[k];
                    let artiste = await getArtist(token, artisteTrack.id);
                    artistDB = await pgClient.query('SELECT * FROM artiste WHERE nom_artiste = $1', [artisteTrack.name]);
                    if (artistDB.rows.length === 0) {
                        artistDB = await pgClient.query('INSERT INTO artiste (nom_artiste, type_artiste, image_artiste) VALUES ($1, $2, $3) RETURNING *', [artisteTrack.name, artisteTrack.type, artiste?.images?.length > 0 ? artiste.images[0].url : null]);
                    }

                    res = await pgClient.query('INSERT INTO artiste_musique (id_musique, id_artiste) VALUES ($1, $2)', [musiqueDB.rows[0].id_musique, artistDB.rows[0].id_artiste]);
                }
            }
        }
        console.log("Downloaded song : " + (j+1) + "/" + album.tracks.items.length);
    }
}

async function fetchPlaylist(id) {
    const token = await getToken();

    const playlist = await getPlaylist(token, id);
    if (!playlist) return;
    let res;
    console.log("Spotify playlist id : ", playlist.id);

    let playlistDB = await pgClient.query('INSERT INTO playlist (titre_playlist, image_playlist) VALUES ($1, $2) RETURNING *', [playlist.name, playlist.images[0].url ?? null])

    for (let j = 0; j < playlist.tracks.items.length; j++) {
        const track = playlist.tracks.items[j].track;

        if (!track) continue;

        let musiqueRes = await pgClient.query('SELECT * FROM musique WHERE id_spotify = $1', [track.id])

        if (musiqueRes.rows.length === 0) {
            // Track does not exist
            let album = track.album;
            res = await pgClient.query('SELECT * FROM album WHERE titre_album = $1', [album.name]);
            if (res.rows.length === 0) {
                // Album does not exist
                await fetchAlbum(token, album.id);
            } else {
                console.log("Album already exist");
            }
        } else {
            console.log("Musqiue already existe");
        }

        musiqueRes = await pgClient.query('SELECT * FROM musique WHERE id_spotify = $1', [track.id]);
        if (musiqueRes.rows.length > 0) {
            res = await pgClient.query('SELECT * FROM playlist_musique WHERE id_musique = $1 AND id_playlist = $2', [musiqueRes.rows[0].id_musique, playlistDB.rows[0].id_playlist]);
            if (res.rows.length === 0) {
                res = await pgClient.query('INSERT INTO playlist_musique (id_musique, id_playlist) VALUES ($1, $2)', [musiqueRes.rows[0].id_musique, playlistDB.rows[0].id_playlist]);
            }
        }
    }
}

(async () => {
    await pgClient.connect((err) => {
        if (err) {
            console.error('connection error', err.stack)
        } else {
            console.log('connected')
        }
    });

    await fetchPlaylist("5cpKaHtZrynMYtA2FvXfo8"); // zzccmxtp
    // await fetchPlaylist("2hmLDliFT9mW84XHxRUzwx"); // summer
    // await fetchPlaylist("3vZYzaSfr9HvjaIivjHyAC");
    // await fetchPlaylist("37i9dQZF1DWXTHBOfJ8aI7");
    // await fetchPlaylist("37i9dQZF1DWYVURwQHUqnN");
    // await fetchPlaylist("6vaV8yJA6oMZh0nVOav6nO");
    // await downloadsFromSpotify();

    pgClient.end();
})();