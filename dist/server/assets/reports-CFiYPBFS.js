import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Download } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function ReportsPage() {
  const [gradesBySubject, setGradesBySubject] = useState(null);
  const [passRates, setPassRates] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    load();
  }, []);
  async function load() {
    const [{
      data: grades
    }, {
      data: attendance
    }] = await Promise.all([supabase.from("enrollments").select("subject:subjects(name), grade:grades(final_grade, status)"), supabase.from("enrollments").select("subject:subjects(name), attendance:attendance(percentage)")]);
    if (grades) {
      const subjectGrades = {};
      grades.forEach((enr) => {
        const name = enr.subject?.name;
        if (!name) return;
        const fg = enr.grade?.[0]?.final_grade;
        if (fg != null) {
          if (!subjectGrades[name]) subjectGrades[name] = [];
          subjectGrades[name].push(fg);
        }
      });
      const subjectNames = Object.keys(subjectGrades).slice(0, 10);
      const avgs = subjectNames.map((n) => {
        const vals = subjectGrades[n];
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
      });
      setGradesBySubject({
        labels: subjectNames,
        datasets: [{
          label: "Promedio de notas",
          data: avgs,
          backgroundColor: "#7A1E2C",
          borderRadius: 4
        }]
      });
      const subjectStatus = {};
      grades.forEach((enr) => {
        const name = enr.subject?.name;
        if (!name) return;
        if (!subjectStatus[name]) subjectStatus[name] = {
          passed: 0,
          total: 0
        };
        subjectStatus[name].total++;
        if (["promoted", "passed"].includes(enr.grade?.[0]?.status)) subjectStatus[name].passed++;
      });
      const srNames = Object.keys(subjectStatus).slice(0, 10);
      const rates = srNames.map((n) => Math.round(subjectStatus[n].passed / subjectStatus[n].total * 100));
      setPassRates({
        labels: srNames,
        datasets: [{
          label: "% Aprobados",
          data: rates,
          borderColor: "#7A1E2C",
          backgroundColor: "rgba(122,30,44,0.1)",
          fill: true,
          tension: 0.4
        }]
      });
    }
    if (attendance) {
      const ranges = {
        "0-50%": 0,
        "51-74%": 0,
        "75-89%": 0,
        "90-100%": 0
      };
      attendance.forEach((enr) => {
        const pct = enr.attendance?.[0]?.percentage;
        if (pct == null) return;
        if (pct <= 50) ranges["0-50%"]++;
        else if (pct <= 74) ranges["51-74%"]++;
        else if (pct <= 89) ranges["75-89%"]++;
        else ranges["90-100%"]++;
      });
      setAttendanceData({
        labels: Object.keys(ranges),
        datasets: [{
          data: Object.values(ranges),
          backgroundColor: ["#dc2626", "#d97706", "#16a34a", "#059669"]
        }]
      });
    }
    setLoading(false);
  }
  const exportCSV = async () => {
    const {
      data
    } = await supabase.from("students").select("first_name, last_name, legajo, dni, email, status, program:programs(name)");
    if (!data) return;
    const header = "Apellido,Nombre,Legajo,DNI,Email,Estado,Carrera\n";
    const rows = data.map((s) => `${s.last_name},${s.first_name},${s.legajo},${s.dni},${s.email},${s.status},${s.program?.name || ""}`).join("\n");
    const blob = new Blob([header + rows], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estudiantes_isipp.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const chartOpts = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Reportes y Estadísticas" }),
      /* @__PURE__ */ jsxs("button", { onClick: exportCSV, className: "btn-secondary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Download, { size: 16 }),
        " Exportar Estudiantes CSV"
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-6", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" }, i)) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-4", children: "Promedio por Materia" }),
        gradesBySubject ? /* @__PURE__ */ jsx(Bar, { data: gradesBySubject, options: chartOpts }) : /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-8", children: "Sin datos" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-4", children: "Tasa de Aprobación por Materia (%)" }),
        passRates ? /* @__PURE__ */ jsx(Line, { data: passRates, options: chartOpts }) : /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-8", children: "Sin datos" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-4", children: "Distribución de Asistencia" }),
        attendanceData ? /* @__PURE__ */ jsx(Doughnut, { data: attendanceData, options: {
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
  ReportsPage as component
};
