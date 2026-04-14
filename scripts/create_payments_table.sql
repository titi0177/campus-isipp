-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('seguro', 'inscripcion', 'cuota_mensual')),
  month INTEGER,  -- 1-12 para cuota mensual, NULL para seguro e inscripción
  year INTEGER NOT NULL,  -- año del pago
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,  -- NULL si no está pagado
  status VARCHAR(20) NOT NULL DEFAULT 'deudor' CHECK (status IN ('pagado', 'deudor')),
  payment_method VARCHAR(50),  -- efectivo, transferencia, tarjeta, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Estudiantes leen sus propios pagos
CREATE POLICY "students_read_own_payments" ON payments
  FOR SELECT USING (
    student_id = (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Tesorería puede ver todos los pagos
CREATE POLICY "treasurer_read_all_payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'treasurer'
    )
  );

-- Tesorería puede crear/editar/eliminar pagos
CREATE POLICY "treasurer_manage_payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'treasurer'
    )
  );

-- Agregar role 'treasurer' a tabla profiles si no existe
-- (Asumiendo que la tabla profiles ya existe)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20);
