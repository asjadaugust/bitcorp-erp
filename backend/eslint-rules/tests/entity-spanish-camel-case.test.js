/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const { RuleTester } = require('eslint');
const rule = require('../rules/entity-spanish-camel-case');

const tester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tester.run('entity-spanish-camel-case', rule, {
  valid: [
    // Single word — already valid camelCase
    {
      filename: 'equipment.model.ts',
      code: `class Foo { estado: string; }`,
    },
    // Multi-word camelCase — domain words
    {
      filename: 'equipment.model.ts',
      code: `class Foo { fechaInicio: Date; }`,
    },
    // entity.ts extension also valid
    {
      filename: 'operator.entity.ts',
      code: `class Foo { nombreCompleto: string; }`,
    },
    // id is in domain words (single-segment, all lowercase)
    {
      filename: 'equipment.model.ts',
      code: `class Foo { id: number; }`,
    },
    // Non-model file — rule skips
    {
      filename: 'equipment.service.ts',
      code: `class Foo { fecha_inicio: string; bad_field: string; }`,
    },
    // Word in per-rule allowlist
    {
      filename: 'user.model.ts',
      code: `class Foo { accessToken: string; }`,
      options: [{ allowlist: ['access', 'token'] }],
    },
  ],

  invalid: [
    // snake_case → auto-fix to camelCase
    {
      filename: 'equipment.model.ts',
      code: `class Foo { fecha_inicio: Date; }`,
      errors: [{ messageId: 'notCamelCase' }],
      output: `class Foo { fechaInicio: Date; }`,
    },
    // Multiple underscores
    {
      filename: 'equipment.model.ts',
      code: `class Foo { estado_actual_equipo: string; }`,
      errors: [{ messageId: 'notCamelCase' }],
      output: `class Foo { estadoActualEquipo: string; }`,
    },
    // Valid camelCase but non-domain word — assert NO fix applied
    {
      filename: 'equipment.model.ts',
      code: `class Foo { startDate: Date; }`,
      errors: [{ messageId: 'notDomainWord' }],
      output: null,
    },
    // TSPropertySignature in interface
    {
      filename: 'report.model.ts',
      code: `interface Foo { fecha_inicio: Date; }`,
      errors: [{ messageId: 'notCamelCase' }],
      output: `interface Foo { fechaInicio: Date; }`,
    },
    // Allowlist does NOT bypass Phase 1 casing check
    {
      filename: 'user.model.ts',
      code: `class Foo { access_token: string; }`,
      options: [{ allowlist: ['access', 'token', 'access_token'] }],
      errors: [{ messageId: 'notCamelCase' }],
      output: `class Foo { accessToken: string; }`,
    },
  ],
});

console.log('✓ entity-spanish-camel-case: all tests passed');
