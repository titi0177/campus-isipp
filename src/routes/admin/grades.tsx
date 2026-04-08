import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export const Route = createFileRoute('/admin/grades')({
  component: GradesPage,
})

function GradesPage() {

const [subjects,setSubjects] = useState<any[]>([])
const [selected,setSelected] = useState('')
const [rows,setRows] = useState<any[]>([])
const { showToast } = useToast()

useEffect(()=>{ loadSubjects() },[])

async function loadSubjects(){
const { data } = await supabase.from("subjects").select("*")
setSubjects(data||[])
}

async function loadStudents(subjectId:string){

const { data } = await supabase
.from("enrollments")
.select(`
id,
student:students(first_name,last_name),
grade:grades(*)
`)
.eq("subject_id",subjectId)

setRows(data||[])

}

function updateValue(i:number,key:string,val:any){

const copy=[...rows]
copy[i]={...copy[i],[key]:val}
setRows(copy)

}

async function saveAll(){

for(const r of rows){

const existing = r.grade?.[0]

const final =
r.final_exam_grade ?? r.partial_grade

const status =
final >=7 ? "promoted"
: final >=4 ? "passed"
: "failed"

if(existing){
await supabase.from("grades")
.update({
partial_grade:r.partial_grade,
final_exam_grade:r.final_exam_grade,
final_grade:final,
status
})
.eq("id",existing.id)
}else{
await supabase.from("grades")
.insert({
enrollment_id:r.id,
partial_grade:r.partial_grade,
final_exam_grade:r.final_exam_grade,
final_grade:final,
status
})
}

}

showToast("Notas guardadas correctamente")

}

return (

<div className="space-y-6">

<h1 className="text-2xl font-bold">Carga de Notas</h1>

<select
className="form-input"
value={selected}
onChange={e=>{
setSelected(e.target.value)
loadStudents(e.target.value)
}}
>
<option value="">Seleccionar materia</option>
{subjects.map(s=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}
</select>

{rows.length > 0 && (

<div className="card p-4">

<table className="w-full text-sm">

<thead>
<tr className="table-header">
<th>Alumno</th>
<th>Parcial</th>
<th>Final</th>
<th>Nota</th>
</tr>
</thead>

<tbody>

{rows.map((r,i)=>{

const final = r.final_exam_grade ?? r.partial_grade

return (

<tr key={r.id} className="border-b">

<td>
{r.student?.last_name}, {r.student?.first_name}
</td>

<td>
<input
type="number"
className="form-input"
value={r.partial_grade ?? ''}
onChange={e=>updateValue(i,'partial_grade',+e.target.value)}
/>
</td>

<td>
<input
type="number"
className="form-input"
value={r.final_exam_grade ?? ''}
onChange={e=>updateValue(i,'final_exam_grade',+e.target.value)}
/>
</td>

<td>{final ?? '-'}</td>

</tr>

)

})}

</tbody>

</table>

<button
onClick={saveAll}
className="btn-primary mt-4"
>
Guardar todo
</button>

</div>

)}

</div>

)

}