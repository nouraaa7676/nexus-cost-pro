
-- Enums
DO $$ BEGIN
  CREATE TYPE public.capex_stage AS ENUM ('draft','commercial','budget_review','department_manager','senior_manager','svp','finance','completed','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_action AS ENUM ('approve','reject','return');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.priority_level AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CAPEX Requests
CREATE TABLE IF NOT EXISTS public.capex_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT UNIQUE NOT NULL DEFAULT ('CPX-' || to_char(now(),'YYYY') || '-' || lpad((floor(random()*99999))::text,5,'0')),
  project_name TEXT NOT NULL,
  business_unit TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_owner TEXT NOT NULL,
  business_justification TEXT,
  scope_of_work TEXT,
  expected_benefits TEXT,
  estimated_budget NUMERIC(18,2) NOT NULL DEFAULT 0,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  expected_start_date DATE,
  expected_completion_date DATE,
  vendor_id UUID REFERENCES public.vendors(id),
  department_id UUID REFERENCES public.departments(id),
  stage public.capex_stage NOT NULL DEFAULT 'draft',
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capex_requests TO authenticated;
GRANT ALL ON public.capex_requests TO service_role;
ALTER TABLE public.capex_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capex_requests_read" ON public.capex_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "capex_requests_insert" ON public.capex_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "capex_requests_update" ON public.capex_requests FOR UPDATE TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_director') OR has_role(auth.uid(),'budget_team') OR has_role(auth.uid(),'department_manager') OR submitted_by = auth.uid()
);
CREATE TRIGGER tg_capex_requests_updated BEFORE UPDATE ON public.capex_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Reviews
CREATE TABLE IF NOT EXISTS public.capex_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.capex_requests(id) ON DELETE CASCADE,
  scope_ok BOOLEAN DEFAULT false,
  financial_ok BOOLEAN DEFAULT false,
  budget_available BOOLEAN DEFAULT false,
  business_case_ok BOOLEAN DEFAULT false,
  risk_ok BOOLEAN DEFAULT false,
  roi_ok BOOLEAN DEFAULT false,
  category_ok BOOLEAN DEFAULT false,
  comments TEXT,
  reviewer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capex_reviews TO authenticated;
GRANT ALL ON public.capex_reviews TO service_role;
ALTER TABLE public.capex_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "capex_reviews_read" ON public.capex_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "capex_reviews_write" ON public.capex_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_capex_reviews_updated BEFORE UPDATE ON public.capex_reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- CESR Records
CREATE TABLE IF NOT EXISTS public.cesr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cesr_number TEXT UNIQUE NOT NULL DEFAULT ('CESR-' || to_char(now(),'YYYYMM') || '-' || lpad((floor(random()*99999))::text,5,'0')),
  request_id UUID REFERENCES public.capex_requests(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  proposal_attachment TEXT,
  procurement_approval TEXT,
  scope_details TEXT,
  technical_details TEXT,
  financial_details TEXT,
  budget_line TEXT,
  budget_code TEXT,
  capex_category TEXT,
  department_id UUID REFERENCES public.departments(id),
  cost_center TEXT,
  project_owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cesr_records TO authenticated;
GRANT ALL ON public.cesr_records TO service_role;
ALTER TABLE public.cesr_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cesr_read" ON public.cesr_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "cesr_write" ON public.cesr_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_cesr_updated BEFORE UPDATE ON public.cesr_records FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Approvals audit trail
CREATE TABLE IF NOT EXISTS public.project_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.capex_requests(id) ON DELETE CASCADE,
  stage public.capex_stage NOT NULL,
  action public.approval_action NOT NULL,
  comments TEXT,
  actor_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.project_approvals TO authenticated;
GRANT ALL ON public.project_approvals TO service_role;
ALTER TABLE public.project_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approvals_read" ON public.project_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "approvals_insert" ON public.project_approvals FOR INSERT TO authenticated WITH CHECK (true);

-- Finance processing
CREATE TABLE IF NOT EXISTS public.financial_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.capex_requests(id) ON DELETE CASCADE,
  budget_line_validated BOOLEAN DEFAULT false,
  available_budget_verified BOOLEAN DEFAULT false,
  financial_reference TEXT,
  final_approved BOOLEAN DEFAULT false,
  budget_released BOOLEAN DEFAULT false,
  released_amount NUMERIC(18,2),
  notes TEXT,
  finance_user UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_processing TO authenticated;
GRANT ALL ON public.financial_processing TO service_role;
ALTER TABLE public.financial_processing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finproc_read" ON public.financial_processing FOR SELECT TO authenticated USING (true);
CREATE POLICY "finproc_write" ON public.financial_processing FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_director') OR has_role(auth.uid(),'budget_team')
) WITH CHECK (true);
CREATE TRIGGER tg_finproc_updated BEFORE UPDATE ON public.financial_processing FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Documents
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.capex_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_kind TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_read" ON public.project_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs_write" ON public.project_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "docs_delete" ON public.project_documents FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR has_role(auth.uid(),'admin'));

-- Cash flow forecast
CREATE TABLE IF NOT EXISTS public.cash_flow_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.capex_requests(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  planned_outflow NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual_outflow NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow_forecast TO authenticated;
GRANT ALL ON public.cash_flow_forecast TO service_role;
ALTER TABLE public.cash_flow_forecast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_flow_read" ON public.cash_flow_forecast FOR SELECT TO authenticated USING (true);
CREATE POLICY "cash_flow_write" ON public.cash_flow_forecast FOR ALL TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_director') OR has_role(auth.uid(),'budget_team')
) WITH CHECK (true);
CREATE TRIGGER tg_cash_flow_updated BEFORE UPDATE ON public.cash_flow_forecast FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
