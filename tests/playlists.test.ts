import request from "supertest";
import app from "../app";
import prisma from "../prisma/client";

describe("SCRUM-10: Création de Playlist", () => {
  let playlistId: number;
  let playlistWithTracksId: number;
  let trackFixtures: Array<{ id: number; title: string; artist: string }> = [];

  const agent = request.agent(app); // Utilisation d'un agent pour maintenir la session

  beforeAll(async () => {
    // On crée un utilisateur de test en base de données via register
    // La route renvoie un cookie de session que notre agent va conserver pour les requêtes suivantes
    await agent.post("/auth/register").send({
      email: "test_playlist@example.com",
      username: "TestCreator",
      password: "Password123!",
    });
  });

  afterAll(async () => {
    // Nettoyage de la base de données
    await prisma.user.deleteMany({
      where: { email: "test_playlist@example.com" },
    });
    await prisma.$disconnect();
  });

  it("doit créer une playlist avec tous les attributs", async () => {
    const res = await agent.post("/playlist").send({
      name: "Ma Super Liste",
      styleId: 1,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.clicks).toBe(0);

    playlistId = res.body.id;
  });

  it("doit incrémenter les clics à chaque consultation", async () => {
    // On remplace '1' par notre variable playlistId
    const res = await request(app).get(`/playlist/${playlistId}`);
    expect(res.body.clicks).toBe(1);

    const res2 = await request(app).get(`/playlist/${playlistId}`);
    expect(res2.body.clicks).toBe(2);
  });

  it("doit ajouter les pistes à la playlist", async () => {
    const trackRes = await request(app).get("/tracks/style/1");
    trackFixtures = trackRes.body.slice(0, 3);
    const tracks = trackFixtures.map((track: any, i: number) => ({ entryId: null, trackId: track.id, order: i }));
    const res = await agent.post("/playlist").send({
      name: "Playlist avec Pistes",
      styleId: 1,
      tracks,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.tracks.length).toBe(tracks.length);

    playlistWithTracksId = res.body.id;
  });

  it("doit retourner les infos de la playlist avec les pistes detaillees", async () => {
    const res = await request(app).get(`/playlist/${playlistWithTracksId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Playlist avec Pistes");
    expect(res.body.style).toBeDefined();
    expect(Array.isArray(res.body.tracks)).toBeTruthy();
    expect(res.body.tracks[0].track.title).toBe(trackFixtures[0].title);
    expect(res.body.tracks[0].track.artist).toBe(trackFixtures[0].artist);
  });

  describe("Tri des playlists", () => {
    it.each([
      [
        "par défaut (nom asc)",
        "",
        (p: any) => p.name,
        (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }),
      ],
      [
        "par nom (desc)",
        "?sortBy=name&sortOrder=desc",
        (p: any) => p.name,
        (a: string, b: string) => b.localeCompare(a, undefined, { sensitivity: "base" }),
      ],
      [
        "par popularité (desc)",
        "?sortBy=popularity&sortOrder=desc",
        (p: any) => p.clicks,
        (a: number, b: number) => b - a,
      ],
      [
        "par date (desc)",
        "?sortBy=recent&sortOrder=desc",
        (p: any) => new Date(p.createdAt).getTime(),
        (a: number, b: number) => b - a,
      ],
      [
        "par style (asc)",
        "?sortBy=style&sortOrder=asc",
        (p: any) => p.style.name,
        (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }),
      ],
    ])("doit trier %s", async (_, query, mapFn, sortFn) => {
      const res = await request(app).get(`/playlist${query}`);
      expect(res.statusCode).toBe(200);
      const values = res.body.map(mapFn);
      expect(values).toEqual([...values].sort(sortFn));
    });
  });

 describe("Modification de Playlist (PUT /:id)", () => {
  const fullPayload = {
    name: "Test Playlist Update",
    styleId: 1,
    tracks: [
      { entryId: null, trackId: 2, order: 0 },
      { entryId: null, trackId: 3, order: 1 },
    ],
  };

  it("doit interdire la modification si l'utilisateur n'est pas connecté", async () => {
    const res = await request(app)
      .put(`/playlist/${playlistId}`)
      .send(fullPayload);
    expect(res.statusCode).toBe(401);
  });

  it("doit retourner 404 si la playlist n'existe pas", async () => {
    const res = await agent.put("/playlist/999999").send(fullPayload);
    expect(res.statusCode).toBe(404);
  });

  it("doit mettre à jour la playlist complète (nom, style et pistes)", async () => {
    const res = await agent.put(`/playlist/${playlistId}`).send(fullPayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe(fullPayload.name);
    expect(res.body.styleId).toBe(fullPayload.styleId);
    expect(res.body.tracks.length).toBe(fullPayload.tracks.length);
    expect(res.body.tracks.map((t: any) => t.trackId)).toEqual(
      expect.arrayContaining(fullPayload.tracks.map((t) => t.trackId))
    );
  });

  it("doit remplacer les pistes existantes par les nouvelles", async () => {
    const updatedPayload = {
      name: fullPayload.name,
      styleId: fullPayload.styleId,
      tracks: [
        { entryId: null, trackId: trackFixtures[1].id, order: 0 },
        { entryId: null, trackId: trackFixtures[2].id, order: 1 },
      ],
    };
    const res = await agent
      .put(`/playlist/${playlistWithTracksId}`)
      .send(updatedPayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.tracks.length).toBe(updatedPayload.tracks.length);
    expect(res.body.tracks[0].trackId).toBe(updatedPayload.tracks[0].trackId);
    expect(res.body.tracks[1].trackId).toBe(updatedPayload.tracks[1].trackId);
  });

  it("doit échouer (400) si les pistes sont invalides ou d'un autre style", async () => {
    const res = await agent.put(`/playlist/${playlistWithTracksId}`).send({
      ...fullPayload,
      tracks: [{ entryId: null, trackId: 999999, order: 0 }],
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Certaines pistes sont invalides ou hors style"
    );
  });

  it("doit échouer (400) si le styleId est invalide", async () => {
    const res = await agent.put(`/playlist/${playlistId}`).send({
      ...fullPayload,
      styleId: 999999,
    });
    expect(res.statusCode).toBe(400);
  });

  it("doit échouer (400) si le nom est manquant (PUT = remplacement complet)", async () => {
    const { name, ...payloadWithoutName } = fullPayload;
    const res = await agent
      .put(`/playlist/${playlistId}`)
      .send(payloadWithoutName);
    expect(res.statusCode).toBe(400);
  });
});
});
