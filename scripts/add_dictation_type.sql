-- Agregar columnas a la tabla subjects para tipo de dictado
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS dictation_type VARCHAR(20) DEFAULT 'anual' CHECK (dictation_type IN ('anual', 'cuatrimestral'));
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1 CHECK (semester IN (1, 2));

-- semester se usa solo si dictation_type = 'cuatrimestral'
-- semester 1 = primer cuatrimestre
-- semester 2 = segundo cuatrimestre
