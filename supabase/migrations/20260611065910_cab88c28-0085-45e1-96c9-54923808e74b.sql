
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM (
  'executive','finance_director','budget_team','department_manager','business_user','admin'
);
CREATE TYPE public.budget_type AS ENUM ('CAPEX','OPEX');
CREATE TYPE public.alert_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.alert_status AS ENUM ('open','acknowledged','resolved');
CREATE TYPE public.invoice_status AS ENUM ('pending','approved','rejected','paid','flagged');
CREATE TYPE public.risk_level AS ENUM ('low','medium','high');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  department_id UUID,
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Trigger: auto profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'business_user');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========================================
-- DEPARTMENTS
-- =========================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  manager_id UUID REFERENCES auth.users(id),
  annual_budget NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_departments_updated BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- VENDORS
-- =========================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  contact_email TEXT,
  performance_rating NUMERIC(3,2) DEFAULT 0,
  risk_rating risk_level DEFAULT 'low',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_vendors_updated BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- CONTRACTS
-- =========================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  value NUMERIC(18,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_contracts_updated BEFORE UPDATE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- PROJECTS
-- =========================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  budget_type budget_type NOT NULL DEFAULT 'CAPEX',
  planned_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  risk risk_level DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_projects_updated BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- BUDGETS (period-level allocations)
-- =========================================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id),
  budget_type budget_type NOT NULL,
  category TEXT,
  fiscal_year INTEGER NOT NULL,
  period_month INTEGER, -- nullable for annual
  planned_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_budgets_updated BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- INVOICES
-- =========================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  department_id UUID REFERENCES public.departments(id),
  project_id UUID REFERENCES public.projects(id),
  budget_type budget_type,
  category TEXT,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status invoice_status NOT NULL DEFAULT 'pending',
  file_url TEXT,
  ai_flags JSONB DEFAULT '[]'::jsonb,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_vendor ON public.invoices(vendor_id);
CREATE INDEX idx_invoices_department ON public.invoices(department_id);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_invoices_updated BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- FORECASTS
-- =========================================
CREATE TABLE public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL, -- 'company','department','project'
  scope_ref UUID,
  fiscal_year INTEGER NOT NULL,
  period_month INTEGER,
  budget_type budget_type,
  forecast_amount NUMERIC(18,2) NOT NULL,
  confidence NUMERIC(5,2),
  risk risk_level DEFAULT 'low',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forecasts TO authenticated;
GRANT ALL ON public.forecasts TO service_role;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ALERTS
-- =========================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity alert_severity NOT NULL DEFAULT 'medium',
  status alert_status NOT NULL DEFAULT 'open',
  impact_amount NUMERIC(18,2),
  source TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- =========================================
-- REPORTS
-- =========================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  content TEXT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =========================================
-- AUDIT LOGS
-- =========================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================
-- POLICIES (broad read for authenticated; admin/exec/finance can write to operational data)
-- =========================================

-- profiles
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'finance_director'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- helper: any-authenticated read; finance/admin/exec/budget_team manage; managers can update their dept project status
CREATE POLICY "departments_read" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'));

CREATE POLICY "vendors_read" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendors_write" ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'));

CREATE POLICY "contracts_read" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_write" ON public.contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'));

CREATE POLICY "projects_read" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_write" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team') OR public.has_role(auth.uid(),'department_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team') OR public.has_role(auth.uid(),'department_manager'));

CREATE POLICY "budgets_read" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "budgets_write" ON public.budgets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'));

CREATE POLICY "invoices_read" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'));
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director'));

CREATE POLICY "forecasts_read" ON public.forecasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "forecasts_write" ON public.forecasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'finance_director') OR public.has_role(auth.uid(),'budget_team'));

CREATE POLICY "alerts_read" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts_write" ON public.alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "reports_read" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "reports_write" ON public.reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "audit_logs_read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'executive') OR public.has_role(auth.uid(),'finance_director'));
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notifications_self_read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_self_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
