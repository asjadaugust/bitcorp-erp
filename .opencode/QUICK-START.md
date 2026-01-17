# Quick Start: Using BitCorp Agent Skills

## Verify Skills Are Loaded

Start OpenCode and check:

```
What skills are available?
```

You should see 8 skills listed.

---

## Common Usage Patterns

### 1. Analyze Equipment Types from PRD

```
Use the bitcorp-prd-analyzer skill to extract all equipment
classifications and create a database enum for tipo_equipo.
```

### 2. Extract Text from Process Documents

```
Use the docx skill to extract the complete text from
docs/PRD-Raw/CORP-GEM-P-001 Gestión Equipo Mecánico V03.docx
```

### 3. Understand Valuation Timeline

```
Use bitcorp-prd-analyzer to explain the monthly valuation process
timeline with Day 5, 7, and 10 milestones.
```

### 4. Get Business Rule Details

```
Use bitcorp-prd-analyzer to list all equipment entry requirements
including documentation and operator qualifications.
```

### 5. Map PRD to Database Schema

```
Use bitcorp-prd-analyzer to design the contratos_alquiler table
structure based on CORP-GEM-F-001 contract requirements.
```

### 6. Understand Pricing Models

```
Use bitcorp-prd-analyzer to compare all Anexo B pricing models
and explain when to use each one.
```

### 7. Extract Form Requirements

```
Use bitcorp-prd-analyzer to list all CORP-GEM-F-XXX forms
referenced in the process documents with their purposes.
```

### 8. Create New Documentation

```
Use doc-coauthoring skill to help me write a technical specification
for the equipment management module based on CORP-GEM-P-001.
```

---

## Quick Reference: Spanish Terms

| Spanish                  | Use in Code                         |
| ------------------------ | ----------------------------------- |
| equipos                  | Table name, API endpoints           |
| proveedores              | Table name, relations               |
| contratos_alquiler       | Table name                          |
| valorizaciones           | Table name, process name            |
| parte_diario             | Daily usage logs                    |
| tipo_equipo              | Column for equipment classification |
| fecha_inicio / fecha_fin | Date columns                        |
| monto_bruto / monto_neto | Financial amounts                   |
| conformidad_proveedor    | Boolean approval flag               |

---

## Skills by Use Case

**Reading PRD Documents**:

- pdf (for presentation)
- docx (for Word documents)
- xlsx (for spreadsheets)
- bitcorp-prd-analyzer (for understanding context)

**Implementing Features**:

- bitcorp-prd-analyzer (business rules and validation)
- ARCHITECTURE.md (technical standards)

**Creating Documentation**:

- doc-coauthoring (structured writing workflow)
- bitcorp-prd-analyzer (terminology and cross-references)

**Designing UI**:

- frontend-design (aesthetic guidance)
- bitcorp-prd-analyzer (form requirements and workflows)

**Building Integrations**:

- mcp-builder (MCP server development)

**Creating More Skills**:

- skill-creator (skill development guide)

---

## Troubleshooting

**Skill not found?**

- Restart OpenCode
- Check `.opencode/skill/*/SKILL.md` exists
- Verify skill name in opencode.json

**Wrong context?**

- Be specific: "Use the bitcorp-prd-analyzer skill..."
- Reference specific documents or sections
- Ask for clarification if results don't match expectations

**Need deeper info?**

- Ask for cross-references between documents
- Request specific sections from process documents
- Ask for examples with Spanish terminology

---

## Next Steps

1. ✅ Skills installed and configured
2. → Test bitcorp-prd-analyzer with PRD questions
3. → Use when implementing equipment module
4. → Use when implementing valuation module
5. → Create additional custom skills as needed

See `.opencode/SKILLS-INTEGRATION.md` for complete documentation.
