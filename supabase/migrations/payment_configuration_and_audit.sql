-- =========================================================================
-- Tablas de Configuración de Pagos y Auditoría
-- Políticas RLS para Tesorero
-- =========================================================================

-- Función helper para verificar si el usuario es tesorero
CREATE OR REPLACE FUNCTION public.is_treasurer()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'treasurer'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =========================================================================
-- Tabla: payment_configuration
-- Almacena montos de seguro, inscripción y cuota BASE por carrera
-- NOTA: El incremento del 15% se aplica automáticamente en paymentUtils.ts
-- si el pago se realiza DESPUÉS del vencimiento + primer día hábil del 10
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payment_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  insurance_amount NUMERIC(10,2) NOT NULL DEFAULT 2000.00 CHECK (insurance_amount > 0),
  enrollment_amount NUMERIC(10,2) NOT NULL DEFAULT 15000.00 CHECK (enrollment_amount > 0),
  monthly_quota_amount NUMERIC(10,2) NOT NULL DEFAULT 5000.00 CHECK (monthly_quota_amount > 0),
  increment_percentage NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (increment_percentage >= 0),
  increment_day INTEGER NOT NULL DEFAULT 10 CHECK (increment_day BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(program_id)
);

-- =========================================================================
-- Tabla: payment_configuration_audit
-- Registro de auditoría de cambios en configuración de pagos
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payment_configuration_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_config_id UUID NOT NULL REFERENCES public.payment_configuration(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- RLS: payment_configuration
-- Solo admin y tesorero pueden leer y escribir
-- =========================================================================
ALTER TABLE public.payment_configuration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_config_read" ON public.payment_configuration;
DROP POLICY IF EXISTS "payment_config_insert" ON public.payment_configuration;
DROP POLICY IF EXISTS "payment_config_update" ON public.payment_configuration;
DROP POLICY IF EXISTS "payment_config_delete" ON public.payment_configuration;

CREATE POLICY "payment_config_read" ON public.payment_configuration
  FOR SELECT
  USING (public.is_admin() OR public.is_treasurer());

CREATE POLICY "payment_config_insert" ON public.payment_configuration
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_treasurer());

CREATE POLICY "payment_config_update" ON public.payment_configuration
  FOR UPDATE
  USING (public.is_admin() OR public.is_treasurer());

CREATE POLICY "payment_config_delete" ON public.payment_configuration
  FOR DELETE
  USING (public.is_admin());

-- =========================================================================
-- RLS: payment_configuration_audit
-- Solo admin y tesorero pueden leer; escritura automática via trigger
-- =========================================================================
ALTER TABLE public.payment_configuration_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_audit_read" ON public.payment_configuration_audit;
DROP POLICY IF EXISTS "payment_audit_insert" ON public.payment_configuration_audit;

CREATE POLICY "payment_audit_read" ON public.payment_configuration_audit
  FOR SELECT
  USING (public.is_admin() OR public.is_treasurer());

CREATE POLICY "payment_audit_insert" ON public.payment_configuration_audit
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_treasurer());

-- =========================================================================
-- Trigger: Auditoría automática en payment_configuration
-- Registra INSERT, UPDATE, DELETE en payment_configuration_audit
-- =========================================================================
CREATE OR REPLACE FUNCTION public.audit_payment_configuration()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.payment_configuration_audit (
      payment_config_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      'INSERT',
      NULL,
      to_jsonb(NEW),
      COALESCE(auth.uid(), NEW.created_by)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.payment_configuration_audit (
      payment_config_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      COALESCE(auth.uid(), NEW.updated_by)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.payment_configuration_audit (
      payment_config_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL,
      auth.uid()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_payment_configuration ON public.payment_configuration;
CREATE TRIGGER trigger_audit_payment_configuration
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_configuration
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_configuration();

-- =========================================================================
-- Índices para performance
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_payment_configuration_program_id ON public.payment_configuration(program_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_config_id ON public.payment_configuration_audit(payment_config_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_changed_at ON public.payment_configuration_audit(changed_at);
