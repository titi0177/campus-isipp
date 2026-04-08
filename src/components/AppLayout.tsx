import { Link, Outlet } from '@tanstack/react-router'
import { LayoutDashboard, BookOpen, CalendarDays, FileText, User } from 'lucide-react'

export default function AppLayout(){

return(

<div className="flex h-screen bg-gray-100">

{/* SIDEBAR */}

<div className="w-64 bg-white border-r flex flex-col">

<div className="p-6 border-b">

<h1 className="text-lg font-bold text-[#7A1E2C]">
Sistema Académico
</h1>

</div>

<nav className="flex-1 p-4 space-y-2">

<Link
to="/dashboard"
className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
>
<LayoutDashboard size={18}/>
Dashboard
</Link>

<Link
to="/dashboard/subjects"
className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
>
<BookOpen size={18}/>
Materias
</Link>

<Link
to="/dashboard/exams"
className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
>
<CalendarDays size={18}/>
Mesas de examen
</Link>

<Link
to="/dashboard/history"
className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
>
<FileText size={18}/>
Historial académico
</Link>

<Link
to="/dashboard/profile"
className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
>
<User size={18}/>
Perfil
</Link>

</nav>

</div>

{/* CONTENIDO */}

<div className="flex-1 overflow-y-auto p-8">

<Outlet/>

</div>

</div>

)

}