import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { S as StatusBadge } from "./StatusBadge-0xmLvY18.js";
import { Download } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function HistoryPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [student, setStudent] = useState(null);
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
      data: s
    } = await supabase.from("students").select("*, program:programs(name)").eq("user_id", user.id).single();
    setStudent(s);
    if (s) {
      const {
        data
      } = await supabase.from("enrollments").select("*, subject:subjects(name, code, year, credits, professor:professors(name)), grade:grades(*), attendance:attendance(*)").eq("student_id", s.id).order("year", {
        ascending: true
      });
      setEnrollments(data || []);
    }
    setLoading(false);
  }
  const handlePrint = () => window.print();
  const byYear = enrollments.reduce((acc, enr) => {
    const y = enr.subject?.year || enr.year;
    if (!acc[y]) acc[y] = [];
    acc[y].push(enr);
    return acc;
  }, {});
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Historial Académico" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Registro completo de tu trayectoria académica" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: handlePrint, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Download, { size: 16 }),
        " Descargar PDF"
      ] })
    ] }),
    student && /* @__PURE__ */ jsx("div", { className: "card", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Alumno:" }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
          student.first_name,
          " ",
          student.last_name
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Legajo:" }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: student.legajo })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "DNI:" }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: student.dni })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Carrera:" }),
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: student.program?.name || "-" })
      ] })
    ] }) }),
    loading ? /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" }) : Object.keys(byYear).map((year) => /* @__PURE__ */ jsxs("div", { className: "card p-0 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-[#4A0F18] px-4 py-2", children: /* @__PURE__ */ jsxs("h3", { className: "text-white font-semibold text-sm", children: [
        year,
        "° Año"
      ] }) }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-gray-50 text-xs text-gray-500 border-b", children: ["Materia", "Código", "Profesor", "Parcial", "Final", "Asistencia", "Estado"].map((h) => /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left font-medium", children: h }, h)) }) }),
        /* @__PURE__ */ jsx("tbody", { children: byYear[year].map((enr) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-50 hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: enr.subject?.name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-500", children: enr.subject?.code }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600", children: enr.subject?.professor?.name || "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: enr.grade?.[0]?.partial_grade ?? "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: enr.grade?.[0]?.final_grade ?? "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: enr.attendance?.[0]?.percentage != null ? `${enr.attendance[0].percentage}%` : "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(StatusBadge, { status: enr.grade?.[0]?.status || "in_progress" }) })
        ] }, enr.id)) })
      ] })
    ] }, year))
  ] });
}
export {
  HistoryPage as component
};
