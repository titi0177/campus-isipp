#!/usr/bin/env python3
import re

filepath = 'src/components/ProfessorGradeLoader.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazo exacto de la lógica
old = """          if (parcial !== undefined && parcial !== null && parcial >= 6) {
            // Parcial >= 6, usa Parcial
            notasAUsar.push(parcial)
          } else if (rec !== undefined && rec !== null) {
            // Parcial < 6, usa Recuperatorio
            if (rec < 6) {
              // Recuperatorio < 6: RETORNA directamente
              return rec as any // Fuerza retorno de la función
            }
            notasAUsar.push(rec)
          } else if (parcial !== undefined && parcial !== null) {
            // No hay Rec, usa Parcial (aunque sea < 6)
            notasAUsar.push(parcial)
          }"""

new = """          if (rec !== undefined && rec !== null) {
            if (parcial !== undefined && parcial !== null && parcial >= 6) {
              notasAUsar.push(parcial)
            } else if (rec < 6) {
              return rec as any
            } else {
              notasAUsar.push(rec)
            }
          } else {
            if (parcial !== undefined && parcial !== null) {
              notasAUsar.push(parcial)
            }
          }"""

content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Reemplazo completado")
