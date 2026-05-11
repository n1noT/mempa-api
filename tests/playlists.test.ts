import request from 'supertest';
import app from '../app';

describe('SCRUM-10: Création de Playlist', () => {
  let playlistId: number; 

  it('doit créer une playlist avec tous les attributs', async () => {
    const res = await request(app).post('/playlist').send({
      name: "Ma Super Liste",
      creator: "Antoine",
      styleId: 1,
      contributors: ["Alice", "Bob"]
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.clicks).toBe(0);
    
    playlistId = res.body.id; 
  });

  it('doit incrémenter les clics à chaque consultation', async () => {
    // On remplace '1' par notre variable playlistId
    const res = await request(app).get(`/playlist/${playlistId}`);
    expect(res.body.clicks).toBe(1);
    
    const res2 = await request(app).get(`/playlist/${playlistId}`);
    expect(res2.body.clicks).toBe(2);
  });

  it('doit ajouter les pistes à la playlist', async () => {
    const trackRes = await request(app).get('/tracks/style/1');
    const trackIds = trackRes.body.slice(0, 3).map((track: any) => track.id); // On prend les 3 premières pistes du style 1
    const res = await request(app).post('/playlist').send({
      name: "Playlist avec Pistes",
      creator: "Testeur",
      styleId: 1,
      trackIds: trackIds
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.tracks.length).toBe(trackIds.length);
  });
});