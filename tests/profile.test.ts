import request from 'supertest';
import app from '../app';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';

const TEST_EMAIL = 'profile_test@example.com';
const TEST_PASSWORD = 'Password123!';
const TEST_USERNAME = 'ProfileUser';

describe('Profil utilisateur : PATCH /profile', () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await agent.post('/auth/register').send({
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  describe("Contrôle d'accès", () => {
    it("doit retourner 401 si l'utilisateur n'est pas connecté", async () => {
      const res = await request(app).patch('/profile').send({ username: 'NewName' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Validation', () => {
    it("doit retourner 400 si aucune modification n'est fournie", async () => {
      const res = await agent.patch('/profile').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Aucune modification fournie');
    });

    it('doit retourner 400 si newPassword est fourni sans currentPassword', async () => {
      const res = await agent.patch('/profile').send({ newPassword: 'NewPass123!' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Le mot de passe actuel est requis');
    });

    it('doit retourner 401 si le mot de passe actuel est incorrect', async () => {
      const res = await agent.patch('/profile').send({
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPass123!',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Mot de passe actuel incorrect');
    });
  });

  describe("Mise à jour du nom d'utilisateur", () => {
    it("doit mettre à jour le nom d'utilisateur", async () => {
      const res = await agent.patch('/profile').send({ username: 'UpdatedName' });
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('UpdatedName');
    });

    it("doit retourner l'email et le rôle dans la réponse", async () => {
      const res = await agent.patch('/profile').send({ username: TEST_USERNAME });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', TEST_EMAIL);
      expect(res.body).toHaveProperty('role');
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('Changement de mot de passe', () => {
    it('doit changer le mot de passe avec le mot de passe actuel correct', async () => {
      const res = await agent.patch('/profile').send({
        currentPassword: TEST_PASSWORD,
        newPassword: 'NewPassword123!',
      });
      expect(res.statusCode).toBe(200);

      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
      const isMatch = await bcrypt.compare('NewPassword123!', user!.password);
      expect(isMatch).toBe(true);
    });

    it('doit permettre la connexion avec le nouveau mot de passe', async () => {
      const freshAgent = request.agent(app);
      const res = await freshAgent.post('/auth/login').send({
        email: TEST_EMAIL,
        password: 'NewPassword123!',
      });
      expect(res.statusCode).toBe(200);
    });

    it("doit refuser la connexion avec l'ancien mot de passe", async () => {
      const res = await request(app).post('/auth/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Mise à jour simultanée nom + mot de passe', () => {
    it('doit mettre à jour le nom et le mot de passe en une seule requête', async () => {
      const freshAgent = request.agent(app);
      await freshAgent.post('/auth/login').send({
        email: TEST_EMAIL,
        password: 'NewPassword123!',
      });

      const res = await freshAgent.patch('/profile').send({
        username: 'ComboUpdate',
        currentPassword: 'NewPassword123!',
        newPassword: 'Combined456@',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('ComboUpdate');

      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
      const isMatch = await bcrypt.compare('Combined456@', user!.password);
      expect(isMatch).toBe(true);
    });
  });
});

describe('Profil utilisateur : GET /auth/me', () => {
  const agent = request.agent(app);

  beforeAll(async () => {
    await agent.post('/auth/register').send({
      email: 'me_test@example.com',
      username: 'MeUser',
      password: TEST_PASSWORD,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'me_test@example.com' } });
    await prisma.$disconnect();
  });

  it("doit retourner l'email de l'utilisateur connecté", async () => {
    const res = await agent.get('/auth/me');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'me_test@example.com');
    expect(res.body).toHaveProperty('username', 'MeUser');
    expect(res.body).not.toHaveProperty('password');
  });

  it('doit retourner 401 si non connecté', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
