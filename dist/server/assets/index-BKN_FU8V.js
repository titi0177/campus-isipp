import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { S as StatCard } from "./StatCard-Bbuk70j6.js";
import { Users, BookOpen, GraduationCap, UserCheck, TrendingUp } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    programs: 0,
    professors: 0,
    enrollments: 0
  });
  const [gradeData, setGradeData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    const [{
      count: students
    }, {
      count: subjects
    }, {
      count: programs
    }, {
      count: professors
    }, {
      count: enrollments
    }, {
      data: grades
    }] = await Promise.all([supabase.from("students").select("*", {
      count: "exact",
      head: true
    }), supabase.from("subjects").select("*", {
      count: "exact",
      head: true
    }), supabase.from("programs").select("*", {
      count: "exact",
      head: true
    }), supabase.from("professors").select("*", {
      count: "exact",
      head: true
    }), supabase.from("enrollments").select("*", {
      count: "exact",
      head: true
    }), supabase.from("grades").select("status, final_grade")]);
    setStats({
      students: students || 0,
      subjects: subjects || 0,
      programs: programs || 0,
      professors: professors || 0,
      enrollments: enrollments || 0
    });
    if (grades) {
      const statusCounts = {};
      grades.forEach((g) => {
        statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
      });
      setStatusData({
        labels: ["Promocionado", "Regular", "En Curso", "Libre", "Desaprobado", "Aprobado"],
        datasets: [{
          data: [statusCounts["promoted"] || 0, statusCounts["regular"] || 0, statusCounts["in_progress"] || 0, statusCounts["free"] || 0, statusCounts["failed"] || 0, statusCounts["passed"] || 0],
          backgroundColor: ["#16a34a", "#2563eb", "#d97706", "#9333ea", "#dc2626", "#059669"]
        }]
      });
      const finalGrades = grades.filter((g) => g.final_grade != null).map((g) => g.final_grade);
      const dist = Array(10).fill(0);
      finalGrades.forEach((g) => {
        const idx = Math.min(Math.floor(g) - 1, 9);
        if (idx >= 0) dist[idx]++;
      });
      setGradeData({
        labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        datasets: [{
          label: "Cantidad de alumnos",
          data: dist,
          backgroundColor: "#7A1E2C",
          borderRadius: 4
        }]
      });
    }
    setLoading(false);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Panel de Administración" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Resumen del sistema académico ISIPP" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsx(StatCard, { title: "Estudiantes", value: stats.students, icon: /* @__PURE__ */ jsx(Users, { size: 22 }), color: "bordeaux" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Materias", value: stats.subjects, icon: /* @__PURE__ */ jsx(BookOpen, { size: 22 }), color: "blue" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Carreras", value: stats.programs, icon: /* @__PURE__ */ jsx(GraduationCap, { size: 22 }), color: "green" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Profesores", value: stats.professors, icon: /* @__PURE__ */ jsx(UserCheck, { size: 22 }), color: "orange" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Inscripciones", value: stats.enrollments, icon: /* @__PURE__ */ jsx(TrendingUp, { size: 22 }), color: "purple" })
    ] }),
    !loading && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-4", children: "Distribución de Notas Finales" }),
        gradeData ? /* @__PURE__ */ jsx(Bar, { data: gradeData, options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          }
        } }) : /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-8", children: "Sin datos" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-4", children: "Estado Académico de Alumnos" }),
        statusData ? /* @__PURE__ */ jsx(Doughnut, { data: statusData, options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        } }) : /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-8", children: "Sin datos" })
      ] })
    ] })
  ] });
}
export {
  AdminDashboard as component
};
