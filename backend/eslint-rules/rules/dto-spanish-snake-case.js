'use strict';

/* eslint-disable @typescript-eslint/no-var-requires */
const DOMAIN_WORDS = new Set(require('../data/domain-words.json'));

/** Convert camelCase or PascalCase identifier to snake_case */
function toSnakeCase(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

const SNAKE_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowlist: { type: 'array', items: { type: 'string' }, default: [] },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      notSnakeCase: 'DTO property "{{name}}" must be snake_case. Suggested fix: "{{fixed}}".',
      notDomainWord:
        'DTO properties must use valid Spanish words in snake_case. Non-domain segments: {{segments}}.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.dto.ts')) return {};

    const allowlist = new Set((context.options[0] || {}).allowlist || []);

    function check(node) {
      if (!node.key || node.key.type !== 'Identifier') return;
      const name = node.key.name;

      // Phase 1 — casing
      if (!SNAKE_RE.test(name)) {
        const fixed = toSnakeCase(name);
        context.report({
          node: node.key,
          messageId: 'notSnakeCase',
          data: { name, fixed },
          fix: (fixer) => fixer.replaceText(node.key, fixed),
        });
        return; // don't check words until casing is fixed
      }

      // Phase 2 — domain words
      const bad = name.split('_').filter((seg) => !DOMAIN_WORDS.has(seg) && !allowlist.has(seg));

      if (bad.length > 0) {
        context.report({
          node: node.key,
          messageId: 'notDomainWord',
          data: { segments: bad.join(', ') },
        });
      }
    }

    return {
      PropertyDefinition: check,
      TSPropertySignature: check,
    };
  },
};
