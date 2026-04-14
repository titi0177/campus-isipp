import{r,s as n,j as e}from"./main-CXqQa1NE.js";import{g as f}from"./generateRegularCertificate-BChUnqnJ.js";import{g as p}from"./generateApprovedSubjects-D7jGB-AB.js";import"./jspdf.es.min-Cm_hcyLj.js";function j(){const[t,i]=r.useState(null),[c,o]=r.useState([]);r.useEffect(()=>{d()},[]);async function d(){const{data:l}=await n.auth.getUser(),{data:s}=await n.from("students").select(`
    *,
    program:programs(name)
  `).eq("user_id",l.user?.id).single();if(i(s),!s?.id){o([]);return}const{data:m}=await n.from("grades").select(`
    final_grade,
    enrollment:enrollments(
      subject:subjects(name)
    )
  `).eq("enrollment.student_id",s.id),u=m?.map(a=>({name:a.enrollment?.subject?.name,final_grade:a.final_grade})).filter(a=>a.name!=null);o(u||[])}return t?e.jsxs("div",{className:"space-y-6",children:[e.jsx("h1",{className:"text-2xl font-bold",children:"Certificados"}),e.jsxs("div",{className:"bg-white p-6 rounded-lg shadow space-y-4",children:[e.jsx("button",{type:"button",onClick:()=>f(t,t.program),className:"inline-flex items-center justify-center rounded-sm border border-emerald-900 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800",children:"Descargar Certificado Alumno Regular"}),e.jsx("button",{type:"button",onClick:()=>p(t,c),className:"btn-primary px-4 py-2",children:"Descargar Certificado Materias Aprobadas"})]})]}):e.jsxs("div",{className:"space-y-6",children:[e.jsx("h1",{className:"text-2xl font-bold",children:"Certificados"}),e.jsx("p",{className:"text-gray-600 text-sm",children:"No se encontró tu ficha de estudiante. Contactá a secretaría."})]})}export{j as component};
