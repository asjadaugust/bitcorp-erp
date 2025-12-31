import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3400';

test.describe('Checklist Management', () => {
  let authToken: string;
  let companyId: string;
  let templateId: string;
  let checklistId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.access_token;
    // Get company from user or use default
    companyId = loginData.user.company_id || '550e8400-e29b-41d4-a716-446655440000';
  });

  test.describe('Checklist Templates', () => {
    test('should create a new checklist template', async ({ request }) => {
      const templateData = {
        checklist_type: 'pre_shift',
        template_name: 'Daily Equipment Check - Excavator',
        description: 'Standard pre-shift checklist for excavators',
        equipment_category_id: null,
        company_id: companyId,
        items: [
          {
            item_id: '1',
            description: 'Check engine oil level',
            category: 'Engine',
            required: true
          },
          {
            item_id: '2',
            description: 'Check hydraulic fluid level',
            category: 'Hydraulics',
            required: true
          },
          {
            item_id: '3',
            description: 'Inspect tracks for damage',
            category: 'Tracks',
            required: true
          },
          {
            item_id: '4',
            description: 'Test all lights',
            category: 'Safety',
            required: true
          },
          {
            item_id: '5',
            description: 'Check backup alarm',
            category: 'Safety',
            required: true
          }
        ],
        is_active: true
      };

      const response = await request.post(`${API_URL}/api/checklists/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: templateData
      });

      expect(response.ok()).toBeTruthy();
      const template = await response.json();
      expect(template.id).toBeDefined();
      expect(template.template_name).toBe(templateData.template_name);
      expect(template.items).toHaveLength(5);
      
      templateId = template.id;
    });

    test('should get all templates', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/checklists/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const templates = await response.json();
      expect(Array.isArray(templates)).toBeTruthy();
      expect(templates.length).toBeGreaterThan(0);
    });

    test('should get template by id', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/checklists/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const template = await response.json();
      expect(template.id).toBe(templateId);
      expect(template.items).toBeDefined();
    });

    test('should update template', async ({ request }) => {
      const response = await request.put(`${API_URL}/api/checklists/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          description: 'Updated description for excavator checklist'
        }
      });

      expect(response.ok()).toBeTruthy();
      const template = await response.json();
      expect(template.description).toBe('Updated description for excavator checklist');
    });
  });

  test.describe('Equipment Checklists', () => {
    let equipmentId: string;
    let operatorId: string;

    test.beforeAll(async ({ request }) => {
      // Get first equipment
      const equipmentResponse = await request.get(`${API_URL}/api/equipment?limit=1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const equipment = await equipmentResponse.json();
      equipmentId = equipment[0]?.id;

      // Get first operator
      const operatorResponse = await request.get(`${API_URL}/api/operators?limit=1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const operators = await operatorResponse.json();
      operatorId = operators[0]?.id;
    });

    test('should create a new equipment checklist', async ({ request }) => {
      const checklistData = {
        template_id: templateId,
        equipment_id: equipmentId,
        operator_id: operatorId,
        checklist_type: 'pre_shift',
        company_id: companyId,
        items: [
          {
            item_id: '1',
            description: 'Check engine oil level',
            category: 'Engine',
            required: true,
            response: 'ok'
          },
          {
            item_id: '2',
            description: 'Check hydraulic fluid level',
            category: 'Hydraulics',
            required: true,
            response: 'ok'
          },
          {
            item_id: '3',
            description: 'Inspect tracks for damage',
            category: 'Tracks',
            required: true,
            response: 'not_ok',
            notes: 'Minor wear on left track'
          },
          {
            item_id: '4',
            description: 'Test all lights',
            category: 'Safety',
            required: true,
            response: 'ok'
          },
          {
            item_id: '5',
            description: 'Check backup alarm',
            category: 'Safety',
            required: true,
            response: 'ok'
          }
        ],
        observations: 'Equipment in good condition, minor track wear noted'
      };

      const response = await request.post(`${API_URL}/api/checklists`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: checklistData
      });

      expect(response.ok()).toBeTruthy();
      const checklist = await response.json();
      expect(checklist.id).toBeDefined();
      expect(checklist.equipment_id).toBe(equipmentId);
      expect(checklist.overall_status).toBe('warning'); // Because one item is 'not_ok'
      
      checklistId = checklist.id;
    });

    test('should get all checklists', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/checklists`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const checklists = await response.json();
      expect(Array.isArray(checklists)).toBeTruthy();
      expect(checklists.length).toBeGreaterThan(0);
    });

    test('should filter checklists by equipment', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/checklists?equipment_id=${equipmentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const checklists = await response.json();
      expect(Array.isArray(checklists)).toBeTruthy();
      checklists.forEach((checklist: any) => {
        expect(checklist.equipment_id).toBe(equipmentId);
      });
    });

    test('should get checklist by id', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/checklists/${checklistId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const checklist = await response.json();
      expect(checklist.id).toBe(checklistId);
      expect(checklist.items).toBeDefined();
      expect(checklist.items.length).toBe(5);
    });

    test('should update checklist', async ({ request }) => {
      const response = await request.put(`${API_URL}/api/checklists/${checklistId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          observations: 'Updated observations - track replaced'
        }
      });

      expect(response.ok()).toBeTruthy();
      const checklist = await response.json();
      expect(checklist.observations).toBe('Updated observations - track replaced');
    });

    test('should get equipment checklist history', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/checklists/analytics/equipment/${equipmentId}/history?limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const history = await response.json();
      expect(Array.isArray(history)).toBeTruthy();
    });

    test('should get checklist summary', async ({ request }) => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request.get(`${API_URL}/api/checklists/analytics/summary?start_date=${today}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const summary = await response.json();
      expect(Array.isArray(summary)).toBeTruthy();
    });
  });

  test.describe('Checklist Validation', () => {
    test('should validate all required items completed', async ({ request }) => {
      const checklistData = {
        template_id: templateId,
        equipment_id: '550e8400-e29b-41d4-a716-446655440001', // Use a valid UUID
        checklist_type: 'pre_shift',
        company_id: companyId,
        items: [
          {
            item_id: '1',
            description: 'Required check',
            required: true,
            response: 'ok'
          }
        ]
      };

      const response = await request.post(`${API_URL}/api/checklists`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: checklistData
      });

      expect(response.ok()).toBeTruthy();
      const checklist = await response.json();
      expect(checklist.overall_status).toBe('passed');
    });

    test('should mark as failed if required item fails', async ({ request }) => {
      const checklistData = {
        template_id: templateId,
        equipment_id: '550e8400-e29b-41d4-a716-446655440002', // Use a valid UUID
        checklist_type: 'pre_shift',
        company_id: companyId,
        items: [
          {
            item_id: '1',
            description: 'Critical safety check',
            required: true,
            response: 'not_ok'
          }
        ]
      };

      const response = await request.post(`${API_URL}/api/checklists`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: checklistData
      });

      expect(response.ok()).toBeTruthy();
      const checklist = await response.json();
      expect(checklist.overall_status).toBe('failed');
    });
  });

  test.describe('Cleanup', () => {
    test('should delete checklist', async ({ request }) => {
      const response = await request.delete(`${API_URL}/api/checklists/${checklistId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(204);
    });

    test('should delete template', async ({ request }) => {
      const response = await request.delete(`${API_URL}/api/checklists/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(204);
    });
  });
});
