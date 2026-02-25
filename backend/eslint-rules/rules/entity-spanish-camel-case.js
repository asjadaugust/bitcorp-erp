/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';

const DOMAIN_WORDS = new Set(require('../data/domain-words.json'));

/** Convert snake_case to camelCase */
function toCamelCase(name) {
  return name.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/** Split camelCase into lowercase word segments: 'fechaInicio' → ['fecha', 'inicio'] */
function splitCamel(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-z])/g, '$1 $2')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .filter((seg) => !/^\d+$/.test(seg)); // skip pure-digit segments like '1', '2'
}

const CAMEL_RE = /^[a-z][a-zA-Z0-9]*$/;

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
      notCamelCase: 'Entity property "{{name}}" must be camelCase. Suggested fix: "{{fixed}}".',
      notDomainWord:
        'Entity properties must use valid Spanish words in camelCase. Non-domain segments: {{segments}}.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!filename.endsWith('.model.ts') && !filename.endsWith('.entity.ts')) return {};

    const allowlist = new Set((context.options[0] || {}).allowlist || []);

    function check(node) {
      if (!node.key || node.key.type !== 'Identifier') return;
      const name = node.key.name;

      // Phase 1 — casing
      if (!CAMEL_RE.test(name)) {
        const fixed = toCamelCase(name);
        context.report({
          node: node.key,
          messageId: 'notCamelCase',
          data: { name, fixed },
          fix: (fixer) => fixer.replaceText(node.key, fixed),
        });
        return;
      }

      // Phase 2 — domain words
      const bad = splitCamel(name).filter((seg) => !DOMAIN_WORDS.has(seg) && !allowlist.has(seg));

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
