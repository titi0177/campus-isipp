import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateRegularCertificate } from '@/utils/generateRegularCertificate'
import { generateApprovedSubjects } from '@/utils/generateApprovedSubjects'

export const Route = createFileRoute('/dashboard/certificates')({
component: CertificatesPage,
})

function CertificatesPage(){

const [student,setStudent] = useState<any>(null)
const [subjects,setSubjects] = useState<any[]>([])

useEffect(()=>{
load()
},[])

async function load(){

const { data:userData } = await supabase.auth.getUser()

const { data: studentData } = await supabase
  .from('students')
  .select(`
    *,
    program:programs(name)
  `)
  .eq('auth_user_id',userData.user?.id)
  .single()

setStudent(studentData)

const { data } = await supabase
  .from('grades')
  .select(`
    final_grade,
    enrollment:enrollments(
      subject:subjects(name)
    )
  `)
  .eq('enrollment.student_id',studentData.id)

const formatted = data?.map((g:any)=>({
  name:g.enrollment.subject.name,
  final_grade:g.final_grade
}))

setSubjects(formatted || [])

}

if(!student) return null

return(

<div className="space-y-6">

  <h1 className="text-2xl font-bold">
    Certificados
  </h1>

  <div className="bg-white p-6 rounded-lg shadow space-y-4">

    <button
      onClick={()=>generateRegularCertificate(student,student.program)}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Descargar Certificado Alumno Regular
    </button>

    <button
      onClick={()=>generateApprovedSubjects(student,subjects)}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Descargar Certificado Materias Aprobadas
    </button>

  </div>

</div>

)
}
