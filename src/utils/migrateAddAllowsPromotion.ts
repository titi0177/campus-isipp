import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nubtgvweebyqmjrshtnz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnRndndlZWJ5cW1qcnNodG56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MzYwNSwiZXhwIjoyMDkxMTI5NjA1fQ.UN4m-2AcjjzNU6e0_tcP4CkYBGzKLJFmuF76GzVP3nY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addAllowsPromotionColumn() {
  try {
    console.log('Agregando columna allows_promotion a la tabla subjects...')
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE subjects 
        ADD COLUMN IF NOT EXISTS allows_promotion BOOLEAN DEFAULT false;
      `
    })

    if (error) {
      console.log('Intentando con Postgres directo...')
      // Si rpc no funciona, usar query directo
      const response = await fetch(`${supabaseUrl}/rest/v1/subjects?select=id`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        console.log('✓ Tabla subjects existe. Intenta ejecutar el SQL manualmente en Supabase:')
        console.log(`
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS allows_promotion BOOLEAN DEFAULT false;
        `)
      }
    } else {
      console.log('✓ Columna agregada exitosamente')
    }
  } catch (err) {
    console.error('Error:', err)
    console.log('\nEjecuta este SQL manualmente en Supabase SQL Editor:')
    console.log(`
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS allows_promotion BOOLEAN DEFAULT false;
    `)
  }
}

addAllowsPromotionColumn()
