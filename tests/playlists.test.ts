import request from "supertest";
import app from "../app";

describe("Gestion des Playlists : Création, Clics et Blocage", () => {
  let playlistId: number;
  let playlistWithTracksId: number;
  let trackFixtures: Array<{ id: number; title: string; artist: string }> = [];

  it("doit créer une playlist avec tous les attributs", async () => {
    const res = await request(app)
      .post("/playlist")
      .send({
        name: "Ma Super Liste",
        creator: "Antoine",
        styleId: 1,
        contributors: ["Alice", "Bob"],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.clicks).toBe(0);

    playlistId = res.body.id;
  });

  it("doit incrémenter les clics à chaque consultation", async () => {
    const res = await request(app).get(`/playlist/${playlistId}`);
    expect(res.body.clicks).toBe(1);

    const res2 = await request(app).get(`/playlist/${playlistId}`);
    expect(res2.body.clicks).toBe(2);
  });

  it("doit ajouter les pistes à la playlist", async () => {
    const trackRes = await request(app).get("/tracks/style/1");
    trackFixtures = trackRes.body.slice(0, 3);
    const trackIds = trackFixtures.map((track: any) => track.id);
    const res = await request(app).post("/playlist").send({
      name: "Playlist avec Pistes",
      creator: "Testeur",
      styleId: 1,
      trackIds: trackIds,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.tracks.length).toBe(trackIds.length);

    playlistWithTracksId = res.body.id;
  });

  it("doit retourner les infos de la playlist avec les pistes detaillees", async () => {
    const res = await request(app).get(`/playlist/${playlistWithTracksId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Playlist avec Pistes");
    expect(res.body.style).toBeDefined();
    expect(Array.isArray(res.body.tracks)).toBeTruthy();
  });

  // --- TESTS SCRUM-15 bloquage---
  it("doit interdire la modification d'une playlist (PUT)", async () => {
    const res = await request(app).put(`/playlist/${playlistId}`).send({
      name: "Nom piraté"
    });
    expect(res.statusCode).toBe(405);
    expect(res.body.message).toBe("Méthode non autorisée : Les playlists sont en lecture seule.");
  });

  it("doit interdire la suppression d'une playlist (DELETE)", async () => {
    const res = await request(app).delete(`/playlist/${playlistId}`);
    expect(res.statusCode).toBe(405);
    expect(res.body.message).toBe("Méthode non autorisée : Les playlists ne peuvent pas être supprimées.");
  });
});