/**
 * Bitcorp ERP - API Endpoint Tests
 * Comprehensive test suite for all API endpoints with snapshots
 * Run with: npm test -- api-endpoints.test.ts
 */

import request from 'supertest';
import app from '../src/index';
import { sequelize } from '../src/config/database';

describe('Bitcorp ERP API Endpoints', () => {
  let authToken: string;
  let adminUserId: number;

  // Setup: Login and get auth token
  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();

    // Login to get token
    const loginResponse = await request(app).post('/api/auth/login').send({
      username: 'admin',
      password: 'admin123',
    });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.token;
    adminUserId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================================================
  // AUTH API TESTS
  // ==========================================================================

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'admin',
        password: 'admin123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', 'admin');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'admin',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
    });
  });

  // ==========================================================================
  // EQUIPMENT API TESTS
  // ==========================================================================

  describe('GET /api/equipment', () => {
    it('should return list of equipment', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      // Snapshot test
      expect(response.body.data[0]).toMatchSnapshot({
        id: expect.any(Number),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should filter equipment by status', async () => {
      const response = await request(app)
        .get('/api/equipment?status=DISPONIBLE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((eq: any) => eq.estado === 'DISPONIBLE')).toBe(true);
    });
  });

  describe('POST /api/equipment', () => {
    it('should create new equipment', async () => {
      const newEquipment = {
        codigo_equipo: 'TEST-001',
        provider_id: 1,
        equipment_type_id: 1,
        tipo_proveedor: 'ALQUILER',
        categoria: 'MAQUINARIA_PESADA',
        marca: 'Test Brand',
        modelo: 'Test Model',
        numero_serie_equipo: 'TEST123',
        anio_fabricacion: 2023,
        tipo_motor: 'DIESEL',
        medidor_uso: 'HOROMETRO',
        estado: 'DISPONIBLE',
      };

      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEquipment);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('codigo_equipo', 'TEST-001');
    });
  });

  // ==========================================================================
  // OPERATORS API TESTS (formerly HR employees)
  // ==========================================================================

  describe('GET /api/operators', () => {
    it('should return list of operators', async () => {
      const response = await request(app)
        .get('/api/operators')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/operators', () => {
    it('should create new operator', async () => {
      const newOperator = {
        dni: '99999999',
        nombres: 'Test',
        apellido_paterno: 'Operator',
        apellido_materno: 'Test',
        telefono: '999888777',
        cargo: 'Operador de Prueba',
        especialidad: 'Testing',
        tipo_contrato: 'PLAZO_FIJO',
        fecha_ingreso: '2024-01-01',
      };

      const response = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newOperator);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // PROJECTS API TESTS
  // ==========================================================================

  describe('GET /api/projects', () => {
    it('should return list of projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ==========================================================================
  // PROVIDERS API TESTS
  // ==========================================================================

  describe('GET /api/providers', () => {
    it('should return list of providers', async () => {
      const response = await request(app)
        .get('/api/providers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ==========================================================================
  // REPORTS API TESTS
  // ==========================================================================

  describe('GET /api/reports', () => {
    it('should return list of daily reports', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ==========================================================================
  // VALUATIONS API TESTS
  // ==========================================================================

  describe('GET /api/valuations', () => {
    it('should return equipment valuations', async () => {
      const response = await request(app)
        .get('/api/valuations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // SCHEDULING API TESTS
  // ==========================================================================

  describe('GET /api/scheduling/tasks', () => {
    it('should return scheduled tasks', async () => {
      const response = await request(app)
        .get('/api/scheduling/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ==========================================================================
  // LOGISTICS API TESTS
  // ==========================================================================

  describe('GET /api/logistics/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/logistics/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/logistics/movements', () => {
    it('should return list of movements', async () => {
      const response = await request(app)
        .get('/api/logistics/movements')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // SST (Safety) API TESTS
  // ==========================================================================

  describe('GET /api/sst/incidents', () => {
    it('should return list of incidents with standard format', async () => {
      const response = await request(app)
        .get('/api/sst/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // ==========================================================================
  // SIG (Documents) API TESTS
  // ==========================================================================

  describe('GET /api/sig/documents', () => {
    it('should return list of documents', async () => {
      const response = await request(app)
        .get('/api/sig/documents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  // ==========================================================================
  // DASHBOARD API TESTS
  // ==========================================================================

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('equipmentCount');
      expect(response.body.data).toHaveProperty('operatorCount');
      expect(response.body.data).toHaveProperty('projectCount');
    });
  });
});
