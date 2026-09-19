-- Lightweight org-scoped departments for People classification.
-- One optional department per person. Not an org chart.

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT departments_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX departments_org_name_uidx
  ON public.departments (organization_id, lower(trim(name)));

CREATE INDEX departments_org_idx
  ON public.departments (organization_id);

ALTER TABLE public.people
  ADD COLUMN department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL;

CREATE INDEX people_department_idx
  ON public.people (department_id)
  WHERE department_id IS NOT NULL;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY departments_select ON public.departments
  FOR SELECT TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY departments_insert ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY departments_update ON public.departments
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY departments_delete ON public.departments
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id));

-- Reject assigning a department from another organisation.
CREATE OR REPLACE FUNCTION private.people_department_same_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NEW.department_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.departments d
    WHERE d.id = NEW.department_id
      AND d.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Department unavailable in this organisation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.people_department_same_org() FROM PUBLIC;

CREATE TRIGGER people_department_same_org
  BEFORE INSERT OR UPDATE OF department_id, organization_id ON public.people
  FOR EACH ROW EXECUTE FUNCTION private.people_department_same_org();
