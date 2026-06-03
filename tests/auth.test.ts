import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';

describe('Authentification : Inscription', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'double@example.com' } });
    await prisma.$disconnect();
  });

  it('doit créer un compte avec des données valides', async () => {
    const res = await request(app).post('/auth/register').send({
      email: "test@example.com",
      username: "JeanEudes",
      password: "Password123!"
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('doit échouer si des champs sont manquants', async () => {
    const res = await request(app).post('/auth/register').send({
      email: "incomplet@example.com"
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email, nom d'utilisateur et mot de passe requis");
  });

  it("doit échouer si l'email est déjà utilisé", async () => {
    await request(app).post('/auth/register').send({
      email: "double@example.com", username: "User1", password: "password"
    });
    const res = await request(app).post('/auth/register').send({
      email: "double@example.com", username: "User2", password: "password"
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("Email déjà utilisé");
  });
});

describe('Authentification : Connexion', () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        email: 'login@example.com',
        username: 'LoginUser',
        password: await bcrypt.hash('Password123!', 10),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'login@example.com' } });
    await prisma.$disconnect();
  });

  it('doit se connecter avec des identifiants valides', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', 'LoginUser');
  });

  it('doit échouer avec des identifiants invalides', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'WrongPassword!',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Identifiants invalides');
  });
});

describe('Authentification : Déconnexion', () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await prisma.user.upsert({
      where: { email: 'login@example.com' },
      update: {},
      create: {
        email: 'login@example.com',
        username: 'LoginUser',
        password: await bcrypt.hash('Password123!', 10),
      },
    });
    await agent.post('/auth/login').send({
      email: 'login@example.com',
      password: 'Password123!',
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'login@example.com' } });
    await prisma.$disconnect();
  });

  it('doit déconnecter un utilisateur connecté', async () => {
    const res = await agent.post('/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Déconnecté');
  });

  it("doit retourner 200 même sans session active", async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Déconnecté');
  });
});