import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { S as StatusBadge } from "./StatusBadge-0xmLvY18.js";
import "@tanstack/react-router";
import "lucide-react";
import "@supabase/supabase-js";
import "chart.js";
function SubjectsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data: student
    } = await supabase.from("students").select("id").eq("user_id", user.id).single();
    if (student) {
      const {
        data
      } = await supabase.from("enrollments").select("*, subject:subjects(name, code, credits, year, professor:professors(name)), grade:grades(*), attendance:attendance(*)").eq("student_id", student.id).order("year", {
        ascending: false
      });
      setEnrollments(data || []);
    }
    setLoading(false);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mis Materias" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Todas tus inscripciones académicas" })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" }) : /* @__PURE__ */ jsx("div", { className: "card p-0 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "table-header", children: ["Materia", "Profesor", "Año", "Nota Parcial", "Nota Final", "Asistencia", "Estado"].map((h) => /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/90", children: h }, h)) }) }),
      /* @__PURE__ */ jsx("tbody", { children: enrollments.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-gray-400", children: "No tiene materias inscriptas." }) }) : enrollments.map((enr) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-50 hover:bg-gray-50", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-800", children: enr.subject?.name }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: enr.subject?.professor?.name || "-" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: enr.year }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: enr.grade?.[0]?.partial_grade ?? "-" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: enr.grade?.[0]?.final_grade ?? "-" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: enr.attendance?.[0]?.percentage != null ? `${enr.attendance[0].percentage}%` : "-" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(StatusBadge, { status: enr.grade?.[0]?.status || "in_progress" }) })
      ] }, enr.id)) })
    ] }) })
  ] });
}
export {
  SubjectsPage as component
};
