import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';

describe('CRUD Music Styles', () => {
  let createdStyleId: number;

  afterAll(async () => {
    await prisma.musicStyle.deleteMany({
      where: {
        name: { in: ['Rock test', 'Jazz Update', 'Temporary Style'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /styles', () => {
    it('doit créer un nouveau style musical', async () => {
      const res = await request(app)
        .post('/styles')
        .send({ name: 'Rock test' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Rock test');
      
      createdStyleId = res.body.id;
    });

    it('doit échouer si le nom est manquant', async () => {
      const res = await request(app)
        .post('/styles')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Le nom du style est requis');
    });
  });

  describe('GET /styles', () => {
    it('doit récupérer la liste de tous les styles', async () => {
      const res = await request(app).get('/styles');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.some((s: any) => s.name === 'Rock test')).toBeTruthy();
    });
  });

  describe('GET /styles/:id', () => {
    it('doit récupérer un style spécifique par son ID', async () => {
      const res = await request(app).get(`/styles/${createdStyleId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(createdStyleId);
      expect(res.body.name).toBe('Rock test');
    });

    it('doit retourner 404 pour un ID inexistant', async () => {
      const res = await request(app).get('/styles/999999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Style inconnu');
    });
  });

  describe('PUT /styles/:id', () => {
    it('doit mettre à jour un style existant', async () => {
      const res = await request(app)
        .put(`/styles/${createdStyleId}`)
        .send({ name: 'Jazz Update' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Jazz Update');
    });

    it('doit retourner 404 si le style à modifier n\'existe pas', async () => {
      const res = await request(app)
        .put('/styles/999999')
        .send({ name: 'Ghost Style' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Style inconnu');
    });
  });

  describe('DELETE /styles/:id', () => {
    it('doit supprimer un style existant', async () => {
      const res = await request(app).delete(`/styles/${createdStyleId}`);

      expect(res.statusCode).toBe(204);
    });

    it('doit retourner 404 si le style à supprimer n\'existe pas', async () => {
      const res = await request(app).delete('/styles/999999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Style inconnu');
    });
  });
});