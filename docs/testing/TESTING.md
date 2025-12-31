# Backend Testing Guide

## Overview
All backend changes MUST pass tests before committing. This ensures code quality and prevents regressions.

## Running Tests

### Quick Test (Before Commit)
```bash
cd backend
npm test
```

### Watch Mode (During Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Structure

### API Endpoint Tests
Location: `backend/tests/api-endpoints.test.ts`

Tests all API endpoints with:
- Success scenarios
- Error scenarios  
- Standard response format validation
- Snapshot testing for data structures

### Unit Tests
Location: `backend/tests/unit/`

Tests individual services and utilities in isolation.

### Integration Tests
Location: `backend/tests/integration/`

Tests database operations and service interactions.

## Standard Response Format

ALL API endpoints must return:

```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}
```

## Pre-Commit Checklist

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code linted (`npm run lint`)
- [ ] Standard response format used
- [ ] No raw SQL queries (use TypeORM)
- [ ] Proper error handling
- [ ] Authentication/authorization checked

## CI/CD Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Before deployment

## Snapshot Testing

Snapshot tests ensure data structures don't change unexpectedly:

```typescript
expect(response.body).toMatchSnapshot({
  id: expect.any(Number),
  created_at: expect.any(String),
});
```

Update snapshots when intentional changes are made:
```bash
npm test -- -u
```

## Common Issues

### Database Connection
Ensure test database is running:
```bash
docker-compose -f docker-compose.test.yml up -d
```

### Authentication
Tests use test user credentials:
- Username: `admin`
- Password: `admin123`

### Raw SQL Issues
Replace raw SQL with TypeORM:

❌ **Bad:**
```typescript
await sequelize.query('SELECT * FROM equipo.equipo');
```

✅ **Good:**
```typescript
await Equipo.findAll({ schema: 'equipo' });
```

## Adding New Tests

When adding new API endpoint:

1. Add test in `api-endpoints.test.ts`
2. Test both success and failure cases
3. Validate response format
4. Add snapshot test
5. Run tests to ensure they pass
6. Commit with passing tests

Example:
```typescript
describe('POST /api/new-endpoint', () => {
  it('should create new resource', async () => {
    const response = await request(app)
      .post('/api/new-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'test' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toMatchSnapshot();
  });

  it('should reject invalid data', async () => {
    const response = await request(app)
      .post('/api/new-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });
});
```

## Debugging Failed Tests

1. Check error message
2. Run single test: `npm test -- -t "test name"`
3. Enable verbose mode: `npm test -- --verbose`
4. Check backend logs
5. Verify database state

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/#/connection/working-with-connection)
