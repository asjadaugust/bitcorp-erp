# BitCorp ERP - Agent Skills Integration

## Overview

This document describes the integration of Agent Skills into the BitCorp ERP project. Skills are modular, self-contained packages that extend OpenCode's capabilities with specialized knowledge, workflows, and tools.

**Integration Date**: January 17, 2026  
**Total Skills**: 8 (7 from Anthropics + 1 custom)  
**Total Size**: ~1.7MB

---

## Installed Skills

### Document Processing Skills (Production-Grade from Anthropics)

#### 1. **pdf** skill

- **Purpose**: Comprehensive PDF manipulation toolkit
- **Capabilities**:
  - Extract text and tables from PDFs
  - Create new PDFs programmatically
  - Merge and split PDF documents
  - Fill PDF forms
  - Process documents at scale
- **Size**: 92KB (includes Python scripts and reference materials)
- **Usage**: Analyzing SoftGEM presentation, extracting process documentation
- **License**: Proprietary (Anthropics source-available)

#### 2. **docx** skill

- **Purpose**: Professional document creation, editing, and analysis
- **Capabilities**:
  - Create new Word documents (.docx)
  - Modify existing documents preserving formatting
  - Work with tracked changes and comments
  - Extract text while preserving structure
  - Handle complex OOXML operations
- **Size**: 1.3MB (includes OOXML processing utilities)
- **Usage**: Processing contract templates (CORP-GEM-F-001), process documents (CORP-GEM-P-001/002), Anexo B variants
- **License**: Proprietary (Anthropics source-available)

#### 3. **xlsx** skill

- **Purpose**: Comprehensive spreadsheet creation, editing, and analysis
- **Capabilities**:
  - Create spreadsheets with formulas and formatting
  - Read and analyze data
  - Modify existing spreadsheets preserving formulas
  - Data analysis and visualization
  - Financial modeling with zero formula errors
- **Size**: 24KB
- **Usage**: Analyzing Anexo A.xlsx, processing reference data
- **License**: Proprietary (Anthropics source-available)

### Workflow & Collaboration Skills

#### 4. **doc-coauthoring** skill

- **Purpose**: Structured workflow for collaborative documentation
- **Capabilities**:
  - Guided 3-stage process: Context Gathering → Refinement → Reader Testing
  - Iterative section-by-section development
  - Built-in quality checks and blind spot detection
  - Progressive disclosure approach
- **Size**: 16KB
- **Usage**: Creating new documentation from PRD analysis, writing technical specifications
- **License**: Apache 2.0 (Open Source)

#### 5. **skill-creator** skill

- **Purpose**: Guide for creating effective custom skills
- **Capabilities**:
  - Best practices for skill design
  - Appropriate degrees of freedom guidance
  - Progressive disclosure patterns
  - Skill anatomy and structure
- **Size**: 60KB
- **Usage**: Creating additional domain-specific skills as needed
- **License**: Apache 2.0 (Open Source)

### Development & Integration Skills

#### 6. **mcp-builder** skill

- **Purpose**: Guide for creating high-quality MCP (Model Context Protocol) servers
- **Capabilities**:
  - FastMCP (Python) development patterns
  - MCP SDK (Node/TypeScript) development
  - API coverage vs. workflow tools balance
  - Tool naming and discoverability best practices
- **Size**: 144KB
- **Usage**: Building MCP servers to integrate external APIs or services
- **License**: Apache 2.0 (Open Source)

#### 7. **frontend-design** skill

- **Purpose**: Create distinctive, production-grade frontend interfaces
- **Capabilities**:
  - High design quality with bold aesthetic direction
  - Avoid generic "AI slop" aesthetics
  - Typography, color, layout, and animation guidance
  - Component-driven development
- **Size**: 20KB
- **Usage**: Creating UI components based on PRD specifications and mockups
- **License**: Apache 2.0 (Open Source)

### Custom BitCorp Skills

#### 8. **bitcorp-prd-analyzer** skill (CUSTOM)

- **Purpose**: Deep analysis of BitCorp ERP PRD documents
- **Capabilities**:
  - **Domain Knowledge**: Mechanical equipment rental management (GEM - Gestión Equipo Mecánico)
  - **Document Understanding**: Process definitions (CORP-GEM-P-001/002), contracts (CORP-GEM-F-001), pricing models (Anexo B variants)
  - **Business Rules**: Equipment lifecycle, valuation workflows, contract management, regulatory compliance
  - **Terminology**: Comprehensive Spanish business term glossary (equipos, proveedores, valorización, etc.)
  - **Architecture Mapping**: PRD concepts → technical implementation (ARCHITECTURE.md principles)
  - **Cross-References**: Navigate relationships between PRD documents
  - **Validation Logic**: Equipment entry rules, valuation calculations, contract legalization, operator requirements
  - **Database Schema**: Spanish table/column names with proper structure
  - **API Design**: snake_case DTOs with standard response contracts
- **Size**: 36KB (928 lines of comprehensive documentation)
- **Usage**:
  - Analyzing PRD-Raw documents
  - Implementing features from business specifications
  - Understanding equipment lifecycle and valuation processes
  - Mapping requirements to technical architecture
  - Validating implementation against business rules
- **Language**: Spanish for business terms (equipos, proveedores, contratos), English for technical instructions
- **License**: Proprietary - BitCorp Internal Use

---

## Skills Directory Structure

```
.opencode/
└── skill/
    ├── bitcorp-prd-analyzer/    # Custom BitCorp domain skill
    │   ├── SKILL.md
    │   └── references/          # (Reserved for future extensions)
    ├── doc-coauthoring/         # Collaborative documentation workflow
    │   └── SKILL.md
    ├── docx/                    # Word document processing
    │   ├── SKILL.md
    │   ├── ooxml/              # OOXML utilities
    │   └── references/
    ├── frontend-design/         # UI design guidance
    │   ├── SKILL.md
    │   └── references/
    ├── mcp-builder/             # MCP server development
    │   ├── SKILL.md
    │   └── references/
    ├── pdf/                     # PDF processing
    │   ├── SKILL.md
    │   ├── references/
    │   └── scripts/
    ├── skill-creator/           # Skill creation guide
    │   ├── SKILL.md
    │   └── references/
    └── xlsx/                    # Spreadsheet processing
        ├── SKILL.md
        └── scripts/
```

---

## Configuration

### opencode.json Settings

The project's `opencode.json` has been updated with explicit skill permissions:

```json
{
  "permission": {
    "*": "allow",
    "skill": {
      "*": "allow",
      "bitcorp-prd-analyzer": "allow",
      "pdf": "allow",
      "docx": "allow",
      "xlsx": "allow",
      "doc-coauthoring": "allow",
      "skill-creator": "allow",
      "mcp-builder": "allow",
      "frontend-design": "allow"
    }
  }
}
```

All skills are set to `"allow"` for immediate access. You can change individual skills to `"ask"` (prompt before use) or `"deny"` (block access) as needed.

---

## How Skills Work

### Skill Discovery

When you start OpenCode, it automatically discovers skills in:

1. `.opencode/skill/*/SKILL.md` (project-local - this project)
2. `~/.config/opencode/skill/*/SKILL.md` (global user skills)
3. `.claude/skills/*/SKILL.md` (Claude-compatible locations)

### Progressive Disclosure

Skills use a three-tier loading strategy:

1. **Metadata** (~100 tokens): `name` and `description` loaded at startup for all skills
2. **Instructions** (full SKILL.md): Loaded when skill is activated
3. **Resources** (scripts, references): Loaded only when explicitly needed

### Skill Activation

Skills are activated in two ways:

1. **Automatic**: OpenCode matches your request to skill descriptions
2. **Manual**: You explicitly request a skill: "Use the bitcorp-prd-analyzer skill to..."

---

## Usage Examples

### Example 1: Analyzing PRD Documents

```
Use the bitcorp-prd-analyzer skill to extract all equipment types
from CORP-GEM-P-001 and create a database enum.
```

The skill will:

- Understand Spanish terminology (equipos menores, vehículos pesados, etc.)
- Extract equipment classifications from Section 4.1 Definiciones
- Map to database schema with Spanish names (per ARCHITECTURE.md)
- Generate enum with all equipment types

### Example 2: Extracting Text from PDF

```
Use the pdf skill to extract text from
docs/PRD-Raw/03. Presentación SoftGEM V7-2.pdf
```

The skill will:

- Use pypdf or pdfplumber for text extraction
- Preserve document structure
- Handle Spanish characters correctly
- Return formatted text for analysis

### Example 3: Processing Contract Template

```
Use the docx skill to read CORP-GEM-F-001 Contrato de Alquiler
and extract the contract structure and required fields.
```

The skill will:

- Use pandoc or python-docx for reading
- Extract document structure
- Identify form fields and placeholders
- Preserve formatting information

### Example 4: Creating Documentation

```
Use the doc-coauthoring skill to help me write a technical
specification for the equipment valuation module.
```

The skill will:

- Guide through 3-stage workflow (Context → Refinement → Testing)
- Ask clarifying questions about requirements
- Build document section-by-section
- Test with fresh Claude instance for blind spots

### Example 5: Understanding Valuation Process

```
Use the bitcorp-prd-analyzer skill to explain the monthly
valuation timeline and what happens on Day 5, 7, and 10.
```

The skill will:

- Reference CORP-GEM-P-002 valuation process
- Explain timeline milestones
- Identify responsible roles
- List required forms and reports
- Explain approval workflow

---

## Integration with BitCorp Architecture

The **bitcorp-prd-analyzer** skill is deeply integrated with your ARCHITECTURE.md:

### Database Schema Compliance

✅ All table names in Spanish (equipos, proveedores, contratos_alquiler)  
✅ Column names in Spanish (codigo_equipo, tipo_equipo, fecha_inicio)  
✅ Follows 001_init_schema.sql patterns

### API Design Compliance

✅ Standard response contract (success, data, pagination/error)  
✅ snake_case field naming in API responses  
✅ DTOs transform database camelCase → API snake_case  
✅ No raw entity returns

### Service Layer Compliance

✅ Business logic in services (not controllers)  
✅ Controllers handle request/response transformation  
✅ Explicit DTO transformations  
✅ Reusable utilities in backend/src/utils/

### Frontend Compliance

✅ Reusable, composable components  
✅ Generic tables, filters, wizards  
✅ Consistent design patterns  
✅ Services unwrap API responses

---

## PRD Document Coverage

The bitcorp-prd-analyzer skill provides comprehensive coverage of:

### Process Documents

- ✅ CORP-GEM-P-001: Gestión Equipo Mecánico V03 (Equipment Management)
- ✅ CORP-GEM-P-002: Valorización de Equipo Mecánico V01 (Monthly Valuation)

### Contract Templates

- ✅ CORP-GEM-F-001: Contrato de Alquiler de Equipo V01 (Rental Contract)
- ✅ Anexo B-TarifaDiariaConDiasMin.docx (Daily with minimums)
- ✅ Anexo B-TarifaDiariaSinDiasMin.docx (Daily without minimums)
- ✅ Anexo B-TarifaHorariaConHorasMin.docx (Hourly with minimums)
- ✅ Anexo B-TarifaHorariaSinHorasMin.docx (Hourly without minimums)
- ✅ Anexo B-TarifaMensual.docx (Monthly flat rate)

### Reference Data

- ✅ Anexo A.xlsx (Supporting data tables)
- ✅ BitCorp.csv (Control center features)

### Presentations

- ✅ 03. Presentación SoftGEM V7-2.pdf (System overview)

### Visual References

- ✅ image0.png through image12.png (Process flows and mockups)

---

## Extracted Business Knowledge

The custom skill contains **deep extraction** of:

### Equipment Classification

- 4 main categories (equipos menores, vehículos livianos/pesados, maquinaria pesada)
- 30+ specific equipment types with Spanish names
- Equipment codification standards (CORP-GEM-C-001)

### Business Processes

- 5-stage equipment lifecycle (Requerimiento → Cotización → Incorporación → Contrato → Valorización → Cierre)
- Detailed process steps with roles and responsibilities
- 15+ form templates (CORP-GEM-F-XXX codes)
- Timeline requirements (Day 5, 7, 10 milestones)

### Business Rules

- Equipment entry authorization requirements
- Minimum quotation rules (2 suppliers or justification)
- Documentation completeness checks (SOAT, SCTR, technical inspection, etc.)
- Operator qualification requirements
- Monthly valuation calculation rules
- Deduction types and application logic
- Contract legalization workflow

### Terminology Glossary

- 50+ Spanish business terms with English context
- Equipment types vocabulary
- Process terminology
- Financial/accounting terms
- Regulatory/safety terms
- Document code formats

### Database Schema

- Complete table structures for equipos, contratos_alquiler, partes_diarios_equipo, valorizaciones_equipo
- Spanish column names
- Proper foreign key relationships
- Status enums and constraints

### API DTOs

- Response contract structures
- DTO examples for equipment lists, valuation details
- snake_case field transformations
- Pagination patterns

---

## Testing Skills Integration

### Quick Test Commands

Test if skills are loaded:

```bash
# Start OpenCode in the project directory
opencode

# In OpenCode, try:
/skills                        # List available skills
What skills are available?     # Ask about skills
```

Test specific skills:

```
Use the bitcorp-prd-analyzer skill to list all equipment types.
Use the pdf skill to check if pypdf is available.
Use the docx skill to explain how to extract text from a .docx file.
```

### Validation Checklist

✅ All 8 skills present in `.opencode/skill/`  
✅ Each skill has a `SKILL.md` file  
✅ `opencode.json` updated with skill permissions  
✅ bitcorp-prd-analyzer skill contains 928 lines of deep analysis  
✅ Skills cover all PRD-Raw document formats (PDF, DOCX, XLSX)  
✅ Custom skill integrated with ARCHITECTURE.md principles  
✅ Spanish terminology preserved in business context  
✅ English used for technical instructions

---

## Maintenance and Extension

### Adding New Skills

1. Create directory: `.opencode/skill/<skill-name>/`
2. Create `SKILL.md` with proper frontmatter
3. Add skill permission to `opencode.json`
4. Restart OpenCode to discover new skill

### Updating Custom Skill

The `bitcorp-prd-analyzer` skill should be updated when:

- New PRD documents are added to `docs/PRD-Raw/`
- Business processes change (new versions of CORP-GEM-P-XXX)
- New equipment types or contract models are introduced
- ARCHITECTURE.md principles are updated

### Creating Additional Custom Skills

Use the `skill-creator` skill for guidance:

```
Use the skill-creator skill to help me create a new skill
for [specific domain or task].
```

Potential future custom skills:

- `bitcorp-safety-compliance`: SSOMA regulations and checklist automation
- `bitcorp-logistics`: Movimientos logística processes
- `bitcorp-finance`: Accounting integration and valuation posting
- `bitcorp-reporting`: Standard report generation and analytics

---

## Troubleshooting

### Skills Not Loading

1. Check file location: `.opencode/skill/*/SKILL.md`
2. Verify SKILL.md has proper YAML frontmatter
3. Check skill name matches directory name
4. Restart OpenCode

### Skill Permission Denied

1. Check `opencode.json` permission settings
2. Ensure skill name matches exactly (case-sensitive)
3. Set permission to `"allow"` or `"ask"`

### Custom Skill Not Activating

1. Verify SKILL.md frontmatter is valid YAML
2. Check `description` field is specific enough
3. Explicitly request the skill by name
4. Check for syntax errors in SKILL.md

---

## Resources

### Agent Skills Standard

- Specification: https://agentskills.io/specification
- GitHub: https://github.com/agentskills/agentskills

### OpenCode Documentation

- Skills Guide: https://opencode.ai/docs/skills/
- Configuration: https://opencode.ai/docs/config/
- Permissions: https://opencode.ai/docs/permissions/

### Anthropics Skills Repository

- Source: https://github.com/anthropics/skills
- Examples: Browse individual skills for patterns
- License: Check each skill's license field

---

## License Information

### Anthropics Skills (pdf, docx, xlsx)

- License: Proprietary (source-available for reference)
- Terms: See LICENSE.txt in each skill directory
- Usage: Permitted under Claude subscription

### Open Source Skills (doc-coauthoring, skill-creator, mcp-builder, frontend-design)

- License: Apache 2.0
- Source: https://github.com/anthropics/skills
- Free to use, modify, and distribute

### Custom Skills (bitcorp-prd-analyzer)

- License: Proprietary - BitCorp Internal Use
- Usage: BitCorp ERP project only
- Contains proprietary business process knowledge

---

## Support and Feedback

For issues or questions about:

- **OpenCode skills system**: https://github.com/anomalyco/opencode/issues
- **Anthropics skills**: https://github.com/anthropics/skills/issues
- **BitCorp custom skill**: Internal dev team

---

## Version History

### v1.0.0 (2026-01-17)

- ✅ Initial skills integration
- ✅ 7 Anthropics skills copied (pdf, docx, xlsx, doc-coauthoring, skill-creator, mcp-builder, frontend-design)
- ✅ 1 custom BitCorp skill created (bitcorp-prd-analyzer with 928 lines)
- ✅ Deep analysis of CORP-GEM-P-001, CORP-GEM-P-002, contracts, pricing models
- ✅ Complete terminology glossary (50+ terms)
- ✅ Business rules extraction and validation logic
- ✅ Database schema and API DTO examples
- ✅ Integration with ARCHITECTURE.md principles
- ✅ Updated opencode.json with skill permissions
- ✅ Total installation size: ~1.7MB

---

**Next Steps**:

1. Start OpenCode and verify skills are loaded
2. Test bitcorp-prd-analyzer skill with PRD questions
3. Use skills when implementing equipment and valuation modules
4. Create additional custom skills as domain knowledge grows
