import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export const Route = createFileRoute('/admin/attendance')({
component: AttendancePage,
})

function AttendancePage(){

const [subjects,setSubjects]=useState<any[]>([])
const [rows,setRows]=useState<any[]>([])
const [selected,setSelected]=useState('')
const { showToast } = useToast()

useEffect(()=>{ loadSubjects() },[])

async function loadSubjects(){
const { data } = await supabase.from("subjects").select("*")
setSubjects(data||[])
}

async function loadStudents(id:string){

const { data } = await supabase
.from("enrollments")
.select(`
id,
student:students(first_name,last_name),
attendance:attendance(*)
`)
.eq("subject_id",id)

setRows(data||[])
}

function update(i:number,val:number){
const copy=[...rows]
copy[i].percentage=val
setRows(copy)
}

async function save(){

for(const r of rows){

const existing = r.attendance?.[0]

if(existing){
await supabase.from("attendance")
.update({ percentage:r.percentage })
.eq("id",existing.id)
}else{
await supabase.from("attendance")
.insert({
enrollment_id:r.id,
percentage:r.percentage
})
}

}

showToast("Asistencia guardada")

}

return(

<div className="space-y-6">

<h1 className="text-2xl font-bold">
Asistencia por Materia
</h1>

<select
className="form-input"
value={selected}
onChange={e=>{
setSelected(e.target.value)
loadStudents(e.target.value)
}}
>
<option>Seleccionar materia</option>
{subjects.map(s=>(
<option key={s.id} value={s.id}>{s.name}</option>
))}
</select>

{rows.length>0 &&(

<table className="w-full">

<thead>
<tr className="table-header">
<th>Alumno</th>
<th>%</th>
</tr>
</thead>

<tbody>

{rows.map((r,i)=>(
<tr key={r.id}>

<td>
{r.student?.last_name}, {r.student?.first_name}
</td>

<td>
<input
type="number"
className="form-input"
value={r.percentage ?? ''}
onChange={e=>update(i,+e.target.value)}
/>
</td>

</tr>
))}

</tbody>

</table>

)}

<button onClick={save} className="btn-primary">
Guardar
</button>

</div>

)

}