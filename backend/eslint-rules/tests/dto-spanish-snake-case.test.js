'use strict';

/* eslint-disable @typescript-eslint/no-var-requires */
const { RuleTester } = require('eslint');
const rule = require('../rules/dto-spanish-snake-case');

const tester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tester.run('dto-spanish-snake-case', rule, {
  valid: [
    // Valid snake_case domain word — passes both phases
    {
      filename: 'equipment.dto.ts',
      code: `interface Foo { fecha: string; }`,
    },
    {
      filename: 'equipment.dto.ts',
      code: `interface Foo { fecha_inicio: string; }`,
    },
    // Single-char and short technical segments in domain list
    {
      filename: 'equipment.dto.ts',
      code: `interface Foo { id: number; }`,
    },
    // Non-dto file — rule skips entirely
    {
      filename: 'equipment.service.ts',
      code: `interface Foo { startDate: string; myField: string; }`,
    },
    // Word in per-rule allowlist
    {
      filename: 'auth.dto.ts',
      code: `interface Foo { access_token: string; }`,
      options: [{ allowlist: ['access', 'token'] }],
    },
    // Class property (PropertyDefinition) — valid
    {
      filename: 'report.dto.ts',
      code: `class Foo { fecha_inicio: string; }`,
    },
  ],

  invalid: [
    // camelCase → auto-fix to snake_case
    {
      filename: 'equipment.dto.ts',
      code: `interface Foo { fechaInicio: string; }`,
      errors: [{ messageId: 'notSnakeCase' }],
      output: `interface Foo { fecha_inicio: string; }`,
    },
    // camelCase with acronym
    {
      filename: 'equipment.dto.ts',
      code: `class Foo { estadoActual: string; }`,
      errors: [{ messageId: 'notSnakeCase' }],
      output: `class Foo { estado_actual: string; }`,
    },
    // All-caps segment — rule converts to snake_case (start_date)
    {
      filename: 'equipment.dto.ts',
      code: `interface Foo { START_DATE: string; }`,
      errors: [{ messageId: 'notSnakeCase' }],
      output: `interface Foo { start_date: string; }`,
    },
    // Valid snake_case but non-domain English word (no auto-fix)
    {
      filename: 'equipment.dto.ts',
      code: `interface Foo { start_date: string; }`,
      errors: [{ messageId: 'notDomainWord' }],
    },
    // Multiple segments, one invalid
    {
      filename: 'report.dto.ts',
      code: `interface Foo { fecha_deadline: string; }`,
      errors: [{ messageId: 'notDomainWord' }],
    },
    // TSPropertySignature in type alias
    {
      filename: 'payment.dto.ts',
      code: `type Foo = { startDate: string; };`,
      errors: [{ messageId: 'notSnakeCase' }],
      output: `type Foo = { start_date: string; };`,
    },
  ],
});

console.log('✓ dto-spanish-snake-case: all tests passed');
