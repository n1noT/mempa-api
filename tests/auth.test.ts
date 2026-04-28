import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';

describe('Authentification : Inscription', () => {
  
  // Nettoyage de la base de données après les tests pour éviter les conflits d'email
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com'
      }
    });
    await prisma.$disconnect();
  });

  it('doit créer un compte avec des données valides', async () => {
    const res = await request(app).post('/auth/register').send({
      email: "test@example.com",
      username: "JeanEudes",
      password: "Password123!"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.message).toBe("Compte créé");
  });

  it('doit échouer si des champs sont manquants', async () => {
    const res = await request(app).post('/auth/register').send({
      email: "incomplet@example.com"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email, nom d'utilisateur et mot de passe requis");
  });

  it('doit échouer si l\'email est déjà utilisé', async () => {
    await request(app).post('/auth/register').send({
      email: "double@example.com",
      username: "User1",
      password: "password"
    });

    const res = await request(app).post('/auth/register').send({
      email: "double@example.com",
      username: "User2",
      password: "password"
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé");
  });
});