export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          institution_id?: string | null
          role: 'admin' | 'profesor' | 'alumno' | 'operador' | string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          institution_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string
          institution_id?: string | null
          role?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id?: string | null
          institution_id?: string | null
          program_id?: string | null
          first_name: string
          last_name: string
          dni: string
          legajo: string
          email: string
          year: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          institution_id?: string | null
          program_id?: string | null
          first_name: string
          last_name: string
          dni: string
          legajo: string
          email: string
          year?: number
          status?: string
        }
        Update: {
          user_id?: string | null
          institution_id?: string | null
          program_id?: string | null
          first_name?: string
          last_name?: string
          dni?: string
          legajo?: string
          email?: string
          year?: number
          status?: string
        }
      }
      programs: {
        Row: {
          id: string
          institution_id?: string | null
          name: string
          duration_years: number
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          name: string
          duration_years: number
          description?: string
        }
        Update: {
          institution_id?: string | null
          name?: string
          duration_years?: number
          description?: string
        }
      }
      professors: {
        Row: {
          id: string
          institution_id?: string | null
          user_id?: string | null
          department_id?: string | null
          name: string
          email: string
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          user_id?: string | null
          department_id?: string | null
          name: string
          email: string
          department?: string
        }
        Update: {
          institution_id?: string | null
          user_id?: string | null
          department_id?: string | null
          name?: string
          email?: string
          department?: string
        }
      }
      subjects: {
        Row: {
          id: string
          institution_id?: string | null
          program_id?: string | null
          professor_id?: string | null
          name: string
          code: string
          year: number
          credits: number
          division?: 'A' | 'B' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          program_id?: string | null
          professor_id?: string | null
          name: string
          code: string
          year?: number
          credits?: number
          division?: 'A' | 'B' | null
        }
        Update: {
          institution_id?: string | null
          program_id?: string | null
          professor_id?: string | null
          name?: string
          code?: string
          year?: number
          credits?: number
          division?: 'A' | 'B' | null
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          academic_period_id?: string | null
          year: number
          semester: number
          division?: 'A' | 'B' | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          academic_period_id?: string | null
          year: number
          semester: number
          division?: 'A' | 'B' | null
          status?: string
        }
        Update: {
          academic_period_id?: string | null
          year?: number
          semester?: number
          division?: 'A' | 'B' | null
          status?: string
        }
      }
      grades: {
        Row: {
          id: string
          enrollment_id: string
          partial_grade?: number | null
          final_exam_grade?: number | null
          final_grade?: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          enrollment_id: string
          partial_grade?: number | null
          final_exam_grade?: number | null
          final_grade?: number | null
          status?: string
        }
        Update: {
          partial_grade?: number | null
          final_exam_grade?: number | null
          final_grade?: number | null
          status?: string
        }
      }
      attendance: {
        Row: {
          id: string
          enrollment_id: string
          percentage: number
          created_at: string
          updated_at: string
        }
        Insert: { id?: string; enrollment_id: string; percentage: number }
        Update: { percentage?: number }
      }
      final_exams: {
        Row: {
          id: string
          institution_id?: string | null
          subject_id: string
          professor_id?: string | null
          exam_room_id?: string | null
          exam_date: string
          location: string
          max_students?: number | null
          is_open?: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          subject_id: string
          professor_id?: string | null
          exam_room_id?: string | null
          exam_date: string
          location?: string
          max_students?: number | null
          is_open?: boolean | null
        }
        Update: {
          institution_id?: string | null
          subject_id?: string
          professor_id?: string | null
          exam_room_id?: string | null
          exam_date?: string
          location?: string
          max_students?: number | null
          is_open?: boolean | null
        }
      }
      exam_enrollments: {
        Row: { id: string; student_id: string; final_exam_id: string; created_at: string }
        Insert: { id?: string; student_id: string; final_exam_id: string }
        Update: Record<string, never>
      }
      exam_records: {
        Row: {
          id: string
          institution_id?: string | null
          subject_id: string
          professor_id?: string | null
          final_exam_id?: string | null
          exam_date: string
          title: string
          students_grades: unknown
          estado_acta: string
          firma_digital_profesor?: string | null
          firma_digital_institucion?: string | null
          pdf_storage_path?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          subject_id: string
          professor_id?: string | null
          final_exam_id?: string | null
          exam_date: string
          title?: string
          students_grades?: unknown
          estado_acta?: string
          firma_digital_profesor?: string | null
          firma_digital_institucion?: string | null
          pdf_storage_path?: string | null
        }
        Update: {
          institution_id?: string | null
          subject_id?: string
          professor_id?: string | null
          final_exam_id?: string | null
          exam_date?: string
          title?: string
          students_grades?: unknown
          estado_acta?: string
          firma_digital_profesor?: string | null
          firma_digital_institucion?: string | null
          pdf_storage_path?: string | null
        }
      }
      materials: {
        Row: {
          id: string
          subject_id: string
          professor_id?: string | null
          title: string
          description?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          professor_id?: string | null
          title: string
          description?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          professor_id?: string | null
        }
      }
      material_files: {
        Row: {
          id: string
          material_id: string
          storage_bucket: string
          storage_path: string
          file_name: string
          mime_type?: string | null
          bytes?: number | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          storage_bucket?: string
          storage_path: string
          file_name: string
          mime_type?: string | null
          bytes?: number | null
        }
        Update: {
          storage_path?: string
          file_name?: string
          mime_type?: string | null
          bytes?: number | null
        }
      }
      announcements: {
        Row: {
          id: string
          institution_id?: string | null
          title: string
          description: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          title: string
          description: string
          date?: string
        }
        Update: {
          institution_id?: string | null
          title?: string
          description?: string
          date?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          institution_id?: string | null
          title: string
          description?: string | null
          date: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          title: string
          description?: string | null
          date: string
          type: string
        }
        Update: {
          institution_id?: string | null
          title?: string
          description?: string | null
          date?: string
          type?: string
        }
      }
      subject_correlatives: {
        Row: { id: string; subject_id: string; requires_subject_id: string; created_at: string }
        Insert: { id?: string; subject_id: string; requires_subject_id: string }
        Update: Record<string, never>
      }
      audit_logs: {
        Row: {
          id: string
          institution_id?: string | null
          actor_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_record?: unknown
          new_record?: unknown
          created_at: string
        }
        Insert: {
          id?: string
          institution_id?: string | null
          actor_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_record?: unknown
          new_record?: unknown
        }
        Update: never
      }
    }
    Functions: {
      calcular_promedio_alumno: {
        Args: { p_estudiante: string }
        Returns: number | null
      }
      calcular_progreso_carrera: {
        Args: { p_estudiante: string }
        Returns: {
          total_materias: number
          aprobadas: number
          en_curso: number
          pendientes: number
          porcentaje: number
        }[]
      }
      validar_correlativas: {
        Args: { p_estudiante: string; p_materia: string }
        Returns: boolean
      }
      validar_inscripcion_materia: {
        Args: { p_estudiante: string; p_materia: string }
        Returns: boolean
      }
      validar_cupo_examen: {
        Args: { p_mesa: string }
        Returns: boolean
      }
    }
  }
}
