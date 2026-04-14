/**
 * SCRIPT SQL: Auto-generación de pagos por estudiante
 * =====================================================
 * Crear tabla de configuración de montos por carrera
 * Crear trigger para auto-generar pagos
 */

-- =============================================
-- 1. TABLA: Configuración de montos por carrera
-- =============================================

CREATE TABLE IF NOT EXISTS payment_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Carrera a la que aplica
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  
  -- Montos
  insurance_amount NUMERIC(10, 2) NOT NULL DEFAULT 2000,      -- Seguro
  enrollment_amount NUMERIC(10, 2) NOT NULL DEFAULT 15000,    -- Inscripción
  monthly_quota_amount NUMERIC(10, 2) NOT NULL DEFAULT 5000,  -- Cuota mensual
  
  -- Incremento después del día 10
  increment_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10,     -- 10%
  increment_day INTEGER NOT NULL DEFAULT 10,                  -- Día del mes
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Único por programa
  CONSTRAINT unique_program UNIQUE (program_id)
);

CREATE INDEX idx_payment_config_program ON payment_configuration(program_id);

-- =============================================
-- 2. FUNCIÓN: Auto-generar pagos iniciales
-- =============================================

CREATE OR REPLACE FUNCTION generate_student_payments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_id UUID;
  v_config payment_configuration;
  v_month INTEGER;
  v_base_amount NUMERIC;
  v_final_amount NUMERIC;
  v_due_date DATE;
BEGIN
  -- Obtener program_id del estudiante
  SELECT program_id INTO v_program_id FROM students WHERE id = NEW.id;
  
  -- Obtener configuración de montos para esta carrera
  SELECT * INTO v_config 
  FROM payment_configuration 
  WHERE program_id = v_program_id;
  
  -- Si no existe configuración, usar valores por defecto
  IF v_config IS NULL THEN
    v_config.insurance_amount := 2000;
    v_config.enrollment_amount := 15000;
    v_config.monthly_quota_amount := 5000;
    v_config.increment_percentage := 10;
    v_config.increment_day := 10;
  END IF;

  -- 1. SEGURO (sin vencimiento específico, digamos fin de año)
  INSERT INTO payments (
    student_id, payment_type, amount, status, due_date, year
  ) VALUES (
    NEW.id,
    'seguro',
    v_config.insurance_amount,
    'deudor',
    DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '12 months' - INTERVAL '1 day',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT
  );

  -- 2. INSCRIPCIÓN (vencimiento a finales de marzo)
  INSERT INTO payments (
    student_id, payment_type, amount, status, due_date, year
  ) VALUES (
    NEW.id,
    'inscripcion',
    v_config.enrollment_amount,
    'deudor',
    DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT
  );

  -- 3. CUOTAS MENSUALES (abril a diciembre)
  FOR v_month IN 4..12 LOOP
    -- Calcular fecha de vencimiento (último día del mes)
    v_due_date := DATE_TRUNC('month', 
      DATE_TRUNC('year', CURRENT_DATE) + (v_month || ' months')::INTERVAL
    ) + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- Calcular monto con incremento si es después del día 10
    v_base_amount := v_config.monthly_quota_amount;
    
    -- Aplicar incremento del 10% si el vencimiento es después del 10
    IF EXTRACT(DAY FROM v_due_date) >= v_config.increment_day THEN
      v_final_amount := v_base_amount * (1 + v_config.increment_percentage / 100);
    ELSE
      v_final_amount := v_base_amount;
    END IF;
    
    -- Insertar cuota
    INSERT INTO payments (
      student_id, payment_type, month, amount, status, due_date, year
    ) VALUES (
      NEW.id,
      'cuota_mensual',
      v_month,
      v_final_amount,
      'deudor',
      v_due_date,
      EXTRACT(YEAR FROM CURRENT_DATE)::INT
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- =============================================
-- 3. TRIGGER: Ejecutar al crear estudiante
-- =============================================

DROP TRIGGER IF EXISTS trg_generate_payments ON students;

CREATE TRIGGER trg_generate_payments
AFTER INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION generate_student_payments();

-- =============================================
-- 4. TABLA DE AUDITORÍA: Cambios en configuración
-- =============================================

CREATE TABLE IF NOT EXISTS payment_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  config_id UUID NOT NULL REFERENCES payment_configuration(id) ON DELETE CASCADE,
  program_name TEXT,
  
  -- Qué cambió
  old_insurance_amount NUMERIC(10, 2),
  new_insurance_amount NUMERIC(10, 2),
  old_enrollment_amount NUMERIC(10, 2),
  new_enrollment_amount NUMERIC(10, 2),
  old_monthly_quota NUMERIC(10, 2),
  new_monthly_quota NUMERIC(10, 2),
  old_increment_percentage NUMERIC(5, 2),
  new_increment_percentage NUMERIC(5, 2),
  
  -- Auditoría
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX idx_audit_config ON payment_config_audit(config_id);

-- =============================================
-- 5. FUNCIÓN: Registrar cambios en configuración
-- =============================================

CREATE OR REPLACE FUNCTION audit_payment_config_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO payment_config_audit (
      config_id, program_name,
      old_insurance_amount, new_insurance_amount,
      old_enrollment_amount, new_enrollment_amount,
      old_monthly_quota, new_monthly_quota,
      old_increment_percentage, new_increment_percentage,
      changed_by
    ) VALUES (
      NEW.id, NEW.program_name,
      OLD.insurance_amount, NEW.insurance_amount,
      OLD.enrollment_amount, NEW.enrollment_amount,
      OLD.monthly_quota_amount, NEW.monthly_quota_amount,
      OLD.increment_percentage, NEW.increment_percentage,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_payment_config ON payment_configuration;

CREATE TRIGGER trg_audit_payment_config
AFTER UPDATE ON payment_configuration
FOR EACH ROW
EXECUTE FUNCTION audit_payment_config_changes();

-- =============================================
-- 6. VISTA: Montos actuales por carrera
-- =============================================

CREATE OR REPLACE VIEW payment_amounts_by_program AS
SELECT 
  pc.program_id,
  pc.program_name,
  pc.insurance_amount,
  pc.enrollment_amount,
  pc.monthly_quota_amount,
  pc.increment_percentage,
  pc.increment_day,
  (pc.insurance_amount + pc.enrollment_amount + (pc.monthly_quota_amount * 9)) as total_without_increment,
  ROUND(
    pc.insurance_amount + pc.enrollment_amount + 
    (pc.monthly_quota_amount * 9 * (1 + pc.increment_percentage / 100)),
    2
  ) as total_with_increment
FROM payment_configuration pc
ORDER BY pc.program_name;

-- =============================================
-- 7. FUNCIÓN: Obtener monto con incremento para mes
-- =============================================

CREATE OR REPLACE FUNCTION calculate_monthly_amount(
  p_program_id UUID,
  p_month INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_config payment_configuration;
  v_base_amount NUMERIC;
  v_final_amount NUMERIC;
  v_days_in_month INTEGER;
  v_increment_day INTEGER;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_config
  FROM payment_configuration
  WHERE program_id = p_group_id;
  
  IF v_config IS NULL THEN
    RETURN 5000; -- Default
  END IF;
  
  v_base_amount := v_config.monthly_quota_amount;
  v_increment_day := v_config.increment_day;
  
  -- Si el mes tiene vencimiento después del día 10, aplicar incremento
  IF v_increment_day <= 28 THEN
    v_final_amount := v_base_amount * (1 + v_config.increment_percentage / 100);
  ELSE
    v_final_amount := v_base_amount;
  END IF;
  
  RETURN v_final_amount;
END;
$$;

-- =============================================
-- 8. POLÍTICAS RLS: Solo tesoreros pueden editar configuración
-- =============================================

ALTER TABLE payment_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tesoreros ven configuración"
  ON payment_configuration
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tesorero', 'admin')
    )
  );

CREATE POLICY "Solo tesoreros editan configuración"
  ON payment_configuration
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tesorero', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tesorero', 'admin')
    )
  );

CREATE POLICY "Tesoreros crean configuración"
  ON payment_configuration
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('treasurer', 'admin')
    )
  );
