import request from 'supertest';
import app from '../app';

describe('SCRUM-10: Création de Playlist', () => {
  it('doit créer une playlist avec tous les attributs', async () => {
    const res = await request(app).post('/playlists').send({
      name: "Ma Super Liste",
      creator: "Antoine",
      style: "Rock",
      contributors: ["Alice", "Bob"]
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.clicks).toBe(0);
  });
  it('doit incrémenter les clics à chaque consultation', async () => {
    const res = await request(app).get('/playlists/1');
    expect(res.body.clicks).toBe(1);
    const res2 = await request(app).get('/playlists/1');
    expect(res2.body.clicks).toBe(2);
  });
});