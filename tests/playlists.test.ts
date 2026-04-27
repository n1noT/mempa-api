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
});