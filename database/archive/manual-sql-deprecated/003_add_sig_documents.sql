-- Migration: Add documento_sig table for SIG (Sistema Integrado de Gestión)
-- Date: 2026-01-04
-- Description: Creates table for Quality, Environment, and Safety documentation

CREATE TABLE IF NOT EXISTS public.documento_sig (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(100),
  category VARCHAR(100),
  version VARCHAR(20) DEFAULT '1.0',
  file_url TEXT,
  file_size INTEGER,
  effective_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  project_id INTEGER REFERENCES proyectos.edt(id),
  company_id INTEGER,
  created_by INTEGER REFERENCES sistema.usuario(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documento_sig_number ON public.documento_sig(document_number);
CREATE INDEX IF NOT EXISTS idx_documento_sig_category ON public.documento_sig(category);
CREATE INDEX IF NOT EXISTS idx_documento_sig_status ON public.documento_sig(status);
CREATE INDEX IF NOT EXISTS idx_documento_sig_project ON public.documento_sig(project_id);
CREATE INDEX IF NOT EXISTS idx_documento_sig_dates ON public.documento_sig(effective_date, expiry_date);

-- Comments
COMMENT ON TABLE public.documento_sig IS 'Sistema Integrado de Gestión (SIG) - Quality, Environment, and Safety documents';
COMMENT ON COLUMN public.documento_sig.category IS 'Document category: Quality, Environment, or Safety';
COMMENT ON COLUMN public.documento_sig.status IS 'Document status: active, archived, expired, draft';
COMMENT ON COLUMN public.documento_sig.version IS 'Document version number';
