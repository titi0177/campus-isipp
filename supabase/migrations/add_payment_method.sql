-- =========================================================================
-- Agregar campo: payment_method a tabla payments
-- =========================================================================

ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'cheque', 'otro'));

-- Comentario descriptivo
COMMENT ON COLUMN public.payments.payment_method IS 'Método de pago: efectivo, transferencia, tarjeta de crédito, tarjeta de débito, cheque, otro';
