import{jsxs as s,jsx as e}from"react/jsx-runtime";import{useState as i,useEffect as f}from"react";import{s as n}from"./router-CGXilZDG.js";import{g}from"./generateRegularCertificate--KBbzLXN.js";import{g as b}from"./generateApprovedSubjects-EWa5TXIX.js";import"@tanstack/react-router";import"lucide-react";import"@supabase/supabase-js";import"chart.js";import"jspdf-autotable";import"jspdf";function A(){const[t,c]=i(null),[d,o]=i([]);f(()=>{l()},[]);async function l(){const{data:m}=await n.auth.getUser(),{data:r}=await n.from("students").select(`
    *,
    program:programs(name)
  `).eq("user_id",m.user?.id).single();if(c(r),!r?.id){o([]);return}const{data:u}=await n.from("grades").select(`
    final_grade,
    enrollment:enrollments(
      subject:subjects(name)
    )
  `).eq("enrollment.student_id",r.id),p=u?.map(a=>({name:a.enrollment?.subject?.name,final_grade:a.final_grade})).filter(a=>a.name!=null);o(p||[])}return t?s("div",{className:"space-y-6",children:[e("h1",{className:"text-2xl font-bold",children:"Certificados"}),s("div",{className:"bg-white p-6 rounded-lg shadow space-y-4",children:[e("button",{type:"button",onClick:()=>g(t,t.program),className:"inline-flex items-center justify-center rounded-sm border border-emerald-900 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800",children:"Descargar Certificado Alumno Regular"}),e("button",{type:"button",onClick:()=>b(t,d),className:"btn-primary px-4 py-2",children:"Descargar Certificado Materias Aprobadas"})]})]}):s("div",{className:"space-y-6",children:[e("h1",{className:"text-2xl font-bold",children:"Certificados"}),e("p",{className:"text-gray-600 text-sm",children:"No se encontró tu ficha de estudiante. Contactá a secretaría."})]})}export{A as component};
