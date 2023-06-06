import 'dotenv/config.js';
import { Spotify as SpotifyDL } from 'spotifydl-core';
import { getToken, search, searchPlaylist, getPlaylist, searchAlbum, getAlbum, getTrack, getArtist } from './Spotify.js';
import Client from 'pg';

const spotifyDL = new SpotifyDL({
    clientId: 'acc6302297e040aeb6e4ac1fbdfd62c3', // <-- add your own clientId
    clientSecret: '0e8439a1280a43aba9a5bc0a16f3f009', // <-- add your own clientSecret
});

const pgClient = new Client.Client({
  host: 'localhost',
  port: 5432,
  database: 'php_projet',
  user: 'postgres',
  password: process.env.POSTGRESQL_PASSWORD,
});


// Track search system
/*
(async () => {
    await pgClient.connect((err) => {
        if (err) {
            console.error('connection error', err.stack)
        } else {
            console.log('connected')
        }
    });

    const token = await getToken();

    let searchString = 'Demain';

    let data = await search(token, searchString, 4, ['track']);

    for (let i = 0; i < data.tracks.limit; i++) {
        let item = data.tracks.items[i];
        console.log(item.external_urls.spotify);
        await spotifyDL.downloadTrack(item.external_urls.spotify, "music/" + item.name + " " + item.artists[0].name + ".mp3")
        //pgClient.query(``)
        let text = `INSERT INTO musique (titre_musique, temps_musique, url_musique) VALUES ($1, $2, $3) RETURNING *`
        let values = [item.name, item.duration_ms, encodeURI(`https://r2.ackimixs.xyz/music/${item.name + " " + item.artists[0].name}.mp3`)]

        try {
          const res = await pgClient.query(text, values)
          console.log(res.rows[0])
        } catch (err) {
          console.log(err.stack)
        }

        console.log("End music " + (i+1) + "/" + data.tracks.limit);
    }

    pgClient.end();
})();*/

// ALBUM

/*async function fetchAlbum(token, searchString) {

    let text = 'SELECT * FROM album WHERE titre_album = $1'
    let values = [searchString]
    try {
        let res = await pgClient.query(text, values);

        if (res.rows.length === 0) {
            const data = await searchAlbum(token, searchString, 2);

            // EVERY ALBUM
            for (let i = 0; i < data.albums.limit; i++) {
                let item = data.albums.items[i];
                const album = await getAlbum(token, item.id);
                //console.log(album);
                text = 'SELECT * FROM album WHERE titre_album = $1'
                values = [album.name]
                try {
                    let res = await pgClient.query(text, values);

                    if (res.rows.length === 0) {

                        let artiste = album.artists[0]

                        //console.log(artiste)

                        text = 'SELECT * FROM artiste WHERE nom_artiste = $1'
                        values = [artiste.name]

                        let res;
                        try {
                            res = await pgClient.query(text, values)
                            if (res.rows.length === 0) {
                                text = `INSERT INTO artiste (nom_artiste, type_artiste) VALUES ($1, $2) RETURNING *`
                                values = [artiste.name,  artiste.type];
                                res = await pgClient.query(text, values)
                            }
                        } catch (err) {
                            console.log(err.stack)
                        }
                        //console.log(res.rows[0]);

                        text = `INSERT INTO album (image_album, genre_album, date_album, titre_album, id_artiste) VALUES ($1, $2, $3, $4, $5) RETURNING *`
                        values = [album.name, album.genres.join(', '), album.release_date, album.name, res.rows[0].id_artiste]

                        try {
                            res = await pgClient.query(text, values)
                        } catch (err) {
                            console.log(err.stack)
                        }

                        let albumId = res.rows[0].id_album;

                        // EVERY MUSIC IN THE ALBUM
                        for (let j = 0; j < album.tracks.items.length; j++) {
                            let track = album.tracks.items[j];
                            text = 'SELECT * FROM musique WHERE titre_musique = $1'
                            values = [track.name]
                            try {
                                res = await pgClient.query(text, values)
                                if (res.rows.length === 0) {

                                    // Check for the principal artiste
                                    text = 'SELECT * FROM artiste WHERE nom_artiste = $1'
                                    values = [track.artists[0].name]
                                    try {
                                        res = await pgClient.query(text, values)
                                        if (res.rows.length === 0) {
                                            text = `INSERT INTO artiste (nom_artiste, type_artiste) VALUES ($1, $2) RETURNING *`
                                            values = [track.artists[0].name, track.artists[0].type];
                                            res = await pgClient.query(text, values)
                                        }
                                    } catch (err) {
                                        console.log(err.stack)
                                    }

                                    text = `INSERT INTO musique (titre_musique, temps_musique, url_musique, id_spotify, id_artiste_principale) VALUES ($1, $2, $3, $4, $5) RETURNING *`
                                    values = [track.name, track.duration_ms, encodeURI(`https://r2.ackimixs.xyz/${track.name} ${track.artists[0].name}.mp3`), track.id, res.rows[0].id_artiste];
                                    res = await pgClient.query(text, values)

                                    text = 'INSERT INTO album_musique (id_musique, id_album) VALUES ($1, $2)';
                                    values = [res.rows[0].id_musique, albumId]
                                    await pgClient.query(text, values);
                                    let idMusique = res.rows[0].id_musique;

                                    // EVERY ARTISTE IN EVERY MUSIQUE IN THE ALBUM
                                    for (let k = 0; k < track.artists.length; k++) {
                                        let artiste = track.artists[k];
                                        text = 'SELECT * FROM artiste WHERE nom_artiste = $1'
                                        values = [artiste.name]
                                        try {
                                            res = await pgClient.query(text, values)
                                            if (res.rows.length === 0) {
                                                text = `INSERT INTO artiste (nom_artiste, type_artiste) VALUES ($1, $2) RETURNING *`
                                                values = [artiste.name, artiste.type];
                                                res = await pgClient.query(text, values)
                                            }
                                        } catch (err) {
                                            console.log(err.stack)
                                        }
                                        //console.log(res.rows[0]);

                                        text = `INSERT INTO artiste_musique (id_musique, id_artiste) VALUES ($1, $2) RETURNING *`
                                        values = [idMusique, res.rows[0].id_artiste]

                                        try {
                                            res = await pgClient.query(text, values)
                                            //console.log(res.rows[0])
                                        } catch (err) {
                                            console.log(err.stack)
                                        }
                                    }

                                    // Downloads music
                                    //await spotifyDL.downloadTrack(track.external_urls.spotify, "music/" + track.name + " " + track.artists[0].name + ".mp3")
                                    //console.log("Downloaded song : " + (j+1) + "/" + album.tracks.items.length);
                                }
                            } catch (err) {
                                console.log(err.stack)
                            }
                            console.log((j+1) + "/" + album.tracks.items.length + " " + track.name);
                        }
                    }
                } catch (err) {
                    console.log(err.stack)
                }
            }
        }
    } catch (err) {
        console.log(err.stack)
    }
}*/


//Playlist
/*async function fetchPlaylist(searchString) {
    let text = 'SELECT * FROM playlist WHERE titre_playlist = $1'
    let values = [searchString]
    try {
        let res = await pgClient.query(text, values);

        if (res.rows.length === 0) {

            const token = await getToken();

            const data = await searchPlaylist(token, searchString, 2);

            // EVERY PLAYLIST
            for (let i = 0; i < data.playlists.limit; i++) {
                let item = data.playlists.items[i];
                const playlist = await getPlaylist(token, item.id);
                //console.log(album);
                text = 'SELECT * FROM playlist WHERE titre_playlist = $1'
                values = [playlist.name]
                try {
                    let res = await pgClient.query(text, values);

                    if (res.rows.length === 0) {

                        text = `INSERT INTO playlist (titre_playlist) VALUES ($1) RETURNING *`
                        values = [playlist.name];

                        try {
                            res = await pgClient.query(text, values)
                        } catch (err) {
                            console.log(err.stack)
                        }
                        let playlistId = res.rows[0].id_playlist;

                        // EVERY MUSIC IN THE SPOTIFY
                        for (let j = 0; j < playlist.tracks.items.length; j++) {
                            let track = playlist.tracks.items[j].track;
                            text = 'SELECT * FROM musique WHERE titre_musique = $1'
                            values = [track.name]
                            try {
                                res = await pgClient.query(text, values)
                                if (res.rows.length === 0) {

                                    // Check for the principal artiste
                                    text = 'SELECT * FROM artiste WHERE nom_artiste = $1'
                                    values = [track.artists[0].name]
                                    try {
                                        res = await pgClient.query(text, values)
                                        if (res.rows.length === 0) {
                                            text = `INSERT INTO artiste (nom_artiste, type_artiste) VALUES ($1, $2) RETURNING *`
                                            values = [track.artists[0].name, track.artists[0].type];
                                            res = await pgClient.query(text, values)
                                        }
                                    } catch (err) {
                                        console.log(err.stack)
                                    }

                                    text = 'SELECT * FROM album WHERE titre_album = $1'
                                    values = [track.album.name]
                                    let albumDB;
                                    albumDB = await pgClient.query(text, values)
                                    if (albumDB.rows.length === 0) {
                                        await fetchAlbum(token, track.album.name);
                                        albumDB = await pgClient.query(text, values);
                                    }

                                    text = `INSERT INTO musique (titre_musique, temps_musique, url_musique, id_spotify, id_artiste_principale, id_album) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
                                    values = [track.name, track.duration_ms, encodeURI(`https://r2.ackimixs.xyz/${track.name} ${track.artists[0].name}.mp3`), track.id, res.rows[0].id_artiste, albumDB.rows[0].id_album];
                                    res = await pgClient.query(text, values)

                                    text = 'INSERT INTO playlist_musique (id_musique, id_playlist) VALUES ($1, $2)';
                                    values = [res.rows[0].id_musique, playlistId]
                                    await pgClient.query(text, values);
                                    let idMusique = res.rows[0].id_musique;

                                    // EVERY ARTISTE IN EVERY MUSIQUE IN THE PLAYLIST
                                    for (let k = 0; k < track.artists.length; k++) {
                                        let artiste = track.artists[k];
                                        text = 'SELECT * FROM artiste WHERE nom_artiste = $1'
                                        values = [artiste.name]
                                        try {
                                            res = await pgClient.query(text, values)
                                            if (res.rows.length === 0) {
                                                text = `INSERT INTO artiste (nom_artiste, type_artiste) VALUES ($1, $2) RETURNING *`
                                                values = [artiste.name, artiste.type];
                                                res = await pgClient.query(text, values)
                                            }
                                        } catch (err) {
                                            console.log(err.stack)
                                        }
                                        //console.log(res.rows[0]);

                                        text = `INSERT INTO artiste_musique (id_musique, id_artiste) VALUES ($1, $2) RETURNING *`
                                        values = [idMusique, res.rows[0].id_artiste]

                                        try {
                                            res = await pgClient.query(text, values)
                                            //console.log(res.rows[0])
                                        } catch (err) {
                                            console.log(err.stack)
                                        }
                                    }

                                    // Downloads music
                                    //await spotifyDL.downloadTrack(track.external_urls.spotify, "music/" + track.name + " " + track.artists[0].name + ".mp3")
                                    //console.log("Downloaded song : " + (j+1) + "/" + album.tracks.items.length);
                                }
                            } catch (err) {
                                console.log(err.stack)
                            }
                            console.log((j+1) + "/" + playlist.tracks.items.length + " " + track.name);
                        }
                    }
                } catch (err) {
                    console.log(err.stack)
                }
            }

        }
    } catch (err) {
        console.log(err.stack)
    }
}*/

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

    // await fetchPlaylist("5cpKaHtZrynMYtA2FvXfo8"); // zzccmxtp
    // await fetchPlaylist("2hmLDliFT9mW84XHxRUzwx"); // summer
    // await fetchPlaylist("3vZYzaSfr9HvjaIivjHyAC");
    // await fetchPlaylist("37i9dQZF1DWXTHBOfJ8aI7");
    // await fetchPlaylist("37i9dQZF1DWYVURwQHUqnN");
    // await fetchPlaylist("6vaV8yJA6oMZh0nVOav6nO");
    // await downloadsFromSpotify();

    pgClient.end();
})();