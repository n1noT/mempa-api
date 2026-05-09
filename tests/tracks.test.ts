import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';

describe('CRUD Tracks', () => {
  let testStyleId: number;
  let createdTrackId: number;

  beforeAll(async () => {
    const style = await prisma.musicStyle.create({
      data: { name: 'Electro Test' },
    });
    testStyleId = style.id;
  });

  // Nettoyage final
  afterAll(async () => {
    await prisma.track.deleteMany({ where: { artist: 'Test Artist' } });
    await prisma.musicStyle.deleteMany({ where: { id: testStyleId } });
    await prisma.$disconnect();
  });

  describe('POST /tracks', () => {
    it('doit créer une nouvelle piste', async () => {
      const res = await request(app)
        .post('/tracks')
        .send({
          title: 'Test Song',
          artist: 'Test Artist',
          styleId: testStyleId
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Song');
      createdTrackId = res.body.id;
    });

    it('doit échouer si des champs sont manquants', async () => {
      const res = await request(app)
        .post('/tracks')
        .send({ title: 'Solo Title' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Le titre, l'artiste et le style sont requis");
    });
  });

  describe('GET /tracks/style/:styleId', () => {
    it('doit récupérer les pistes d\'un style spécifique', async () => {
      const res = await request(app).get(`/tracks/style/${testStyleId}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body[0].styleId).toBe(testStyleId);
    });
  });

  describe('GET /tracks/:id', () => {
    it('doit récupérer une piste par son ID', async () => {
      const res = await request(app).get(`/tracks/${createdTrackId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Test Song');
    });

    it('doit retourner 404 pour une piste inexistante', async () => {
      const res = await request(app).get('/tracks/999999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /tracks/:id', () => {
    it('doit modifier une piste existante', async () => {
      const res = await request(app)
        .put(`/tracks/${createdTrackId}`)
        .send({
          title: 'Updated Title',
          artist: 'Test Artist',
          styleId: testStyleId
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Title');
    });
  });

  describe('DELETE /tracks/:id', () => {
    it('doit supprimer la piste', async () => {
      const res = await request(app).delete(`/tracks/${createdTrackId}`);
      expect(res.statusCode).toBe(204);
    });

    it('doit retourner 404 lors de la suppression d\'une piste inexistante', async () => {
      const res = await request(app).delete('/tracks/999999');
      expect(res.statusCode).toBe(404);
    });
  });
});