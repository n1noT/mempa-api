import request from 'supertest';
import app from '../app';

describe('SCRUM-10: Création de Playlist', () => {
  let playlistId: number; // <-- On crée une variable pour mémoriser l'ID

  it('doit créer une playlist avec tous les attributs', async () => {
    const res = await request(app).post('/playlist').send({
      name: "Ma Super Liste",
      creator: "Antoine",
      style: "Rock",
      contributors: ["Alice", "Bob"]
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.clicks).toBe(0);
    
    playlistId = res.body.id; // <-- On sauvegarde le véritable ID créé (ex: 4, 5...)
  });

  it('doit incrémenter les clics à chaque consultation', async () => {
    // On remplace '1' par notre variable playlistId
    const res = await request(app).get(`/playlist/${playlistId}`);
    expect(res.body.clicks).toBe(1);
    
    const res2 = await request(app).get(`/playlist/${playlistId}`);
    expect(res2.body.clicks).toBe(2);
  });
});