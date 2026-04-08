import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/StatCard'

import {
Users,
BookOpen,
GraduationCap,
UserCheck,
TrendingUp,
Award,
ClipboardList
} from 'lucide-react'

import { Bar, Doughnut } from 'react-chartjs-2'

import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
ArcElement,
Title,
Tooltip,
Legend
} from 'chart.js'

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
ArcElement,
Title,
Tooltip,
Legend
)

export const Route = createFileRoute('/admin/')({
component: AdminDashboard,
})

function AdminDashboard() {

const [stats,setStats] = useState<any>({})
const [gradeData,setGradeData] = useState<any>(null)
const [statusData,setStatusData] = useState<any>(null)
const [topSubjects,setTopSubjects] = useState<any[]>([])
const [recentEnrollments,setRecentEnrollments] = useState<any[]>([])
const [recentGrades,setRecentGrades] = useState<any[]>([])
const [loading,setLoading] = useState(true)

useEffect(()=>{
loadData()
},[])

async function loadData(){

const [
{count:students},
{count:subjects},
{count:programs},
{count:professors},
{count:enrollments},
{data:grades}
] = await Promise.all([

supabase.from("students").select("*",{count:"exact",head:true}),
supabase.from("subjects").select("*",{count:"exact",head:true}),
supabase.from("programs").select("*",{count:"exact",head:true}),
supabase.from("professors").select("*",{count:"exact",head:true}),
supabase.from("enrollments").select("*",{count:"exact",head:true}),
supabase.from("grades").select("final_grade,status")

])

setStats({
students:students || 0,
subjects:subjects || 0,
programs:programs || 0,
professors:professors || 0,
enrollments:enrollments || 0
})

/* ---------- PROMEDIO GENERAL ---------- */

let avg = 0
if(grades?.length){
avg = grades.reduce((a,b)=>a+(b.final_grade || 0),0)/grades.length
}

setStats((s:any)=>({...s,avg:avg.toFixed(2)}))

/* ---------- ESTADO ACADEMICO ---------- */

if(grades){

const statusCounts:any={}

grades.forEach(g=>{
statusCounts[g.status]=(statusCounts[g.status]||0)+1
})

setStatusData({
labels:["Promocionado","Aprobado","Desaprobado","En Curso"],
datasets:[{
data:[
statusCounts["promoted"]||0,
statusCounts["passed"]||0,
statusCounts["failed"]||0,
statusCounts["in_progress"]||0
],
backgroundColor:[
"#16a34a",
"#2563eb",
"#dc2626",
"#d97706"
]
}]
})

}

/* ---------- DISTRIBUCION DE NOTAS ---------- */

if(grades){

const dist = Array(10).fill(0)

grades.forEach((g:any)=>{

if(g.final_grade){

const i=Math.min(Math.floor(g.final_grade)-1,9)

if(i>=0) dist[i]++

}

})

setGradeData({
labels:["1","2","3","4","5","6","7","8","9","10"],
datasets:[{
label:"Cantidad de alumnos",
data:dist,
backgroundColor:"#7A1E2C",
borderRadius:4
}]
})

}

/* ---------- MATERIAS MAS CURSADAS ---------- */

const {data:top} = await supabase
.from("enrollments")
.select(`
subject:subjects(name)
`)
limit(50)

if(top){

const count:any={}

top.forEach((e:any)=>{
const n=e.subject?.name
count[n]=(count[n]||0)+1
})

const sorted = Object.entries(count)
.sort((a:any,b:any)=>b[1]-a[1])
.slice(0,5)

setTopSubjects(sorted)

}

/* ---------- ULTIMAS INSCRIPCIONES ---------- */

const {data:recent} = await supabase
.from("enrollments")
.select(`
id,
created_at,
student:students(first_name,last_name),
subject:subjects(name)
`)
.order("created_at",{ascending:false})
.limit(5)

setRecentEnrollments(recent||[])

/* ---------- ULTIMAS NOTAS ---------- */

const {data:recentG} = await supabase
.from("grades")
.select(`
final_grade,
student:enrollments(
student:students(first_name,last_name)
),
subject:enrollments(
subject:subjects(name)
)
`)
.order("created_at",{ascending:false})
.limit(5)

setRecentGrades(recentG||[])

setLoading(false)

}

return (

<div className="space-y-6">

<div>
<h1 className="text-2xl font-bold text-gray-900">
Panel de Administración
</h1>
<p className="text-gray-500 text-sm mt-1">
Resumen del sistema académico
</p>
</div>

{/* STATS */}

<div className="grid grid-cols-2 lg:grid-cols-6 gap-4">

<StatCard title="Estudiantes" value={stats.students} icon={<Users size={22}/>} color="bordeaux"/>
<StatCard title="Materias" value={stats.subjects} icon={<BookOpen size={22}/>} color="blue"/>
<StatCard title="Carreras" value={stats.programs} icon={<GraduationCap size={22}/>} color="green"/>
<StatCard title="Profesores" value={stats.professors} icon={<UserCheck size={22}/>} color="orange"/>
<StatCard title="Inscripciones" value={stats.enrollments} icon={<TrendingUp size={22}/>} color="purple"/>
<StatCard title="Promedio" value={stats.avg} icon={<Award size={22}/>} color="bordeaux"/>

</div>

{/* CHARTS */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

<div className="card">
<h2 className="font-semibold mb-4">
Distribución de Notas
</h2>

{gradeData
? <Bar data={gradeData}/>
: <p className="text-gray-400">Sin datos</p>
}

</div>

<div className="card">

<h2 className="font-semibold mb-4">
Estado Académico
</h2>

{statusData
? <Doughnut data={statusData}/>
: <p className="text-gray-400">Sin datos</p>
}

</div>

</div>

{/* MATERIAS MAS CURSADAS */}

<div className="card">

<h2 className="font-semibold mb-4">
Materias con más alumnos
</h2>

<ul className="space-y-2">

{topSubjects.map((s:any,i:number)=>(
<li key={i} className="flex justify-between">

<span>{s[0]}</span>
<span className="font-semibold">{s[1]}</span>

</li>
))}

</ul>

</div>

{/* ULTIMAS INSCRIPCIONES */}

<div className="card">

<h2 className="font-semibold mb-4">
Últimas Inscripciones
</h2>

<ul className="space-y-2">

{recentEnrollments.map((e:any)=>(
<li key={e.id}>

{e.student?.first_name} {e.student?.last_name}
{" → "}
{e.subject?.name}

</li>
))}

</ul>

</div>

</div>

)

}