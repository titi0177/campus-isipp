import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { S as StatCard } from "./StatCard-Bbuk70j6.js";
import { S as StatusBadge } from "./StatusBadge-0xmLvY18.js";
import { Star, CheckCircle, Clock, BookOpen, Award, Bell } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function StudentDashboard() {
  const [stats, setStats] = useState({
    passed: 0,
    inProgress: 0,
    gpa: "0.00",
    attendance: "0%",
    credits: 0
  });
  const [enrollments, setEnrollments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
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
        data: enrs
      } = await supabase.from("enrollments").select("*, subject:subjects(name, code, credits), grade:grades(*), attendance:attendance(*)").eq("student_id", student.id);
      setEnrollments(enrs || []);
      const grades = (enrs || []).map((e) => e.grade?.[0]).filter(Boolean);
      const passed = grades.filter((g) => ["promoted", "passed"].includes(g?.status)).length;
      const inProgress = grades.filter((g) => g?.status === "in_progress").length;
      const finalGrades = grades.filter((g) => g?.final_grade != null).map((g) => g.final_grade);
      const gpa = finalGrades.length ? (finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length).toFixed(2) : "0.00";
      const attValues = (enrs || []).map((e) => e.attendance?.[0]?.percentage).filter((v) => v != null);
      const attendance = attValues.length ? `${Math.round(attValues.reduce((a, b) => a + b, 0) / attValues.length)}%` : "0%";
      const credits = (enrs || []).filter((e) => ["promoted", "passed"].includes(e.grade?.[0]?.status)).reduce((sum, e) => sum + (e.subject?.credits || 0), 0);
      setStats({
        passed,
        inProgress,
        gpa,
        attendance,
        credits
      });
    }
    const {
      data: ann
    } = await supabase.from("announcements").select("*").order("date", {
      ascending: false
    }).limit(5);
    setAnnouncements(ann || []);
    const {
      data: ev
    } = await supabase.from("calendar_events").select("*").gte("date", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)).order("date").limit(5);
    setEvents(ev || []);
    setLoading(false);
  }
  if (loading) return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-4", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "card h-24 animate-pulse bg-gray-100" }, i)) }) });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mi Panel Académico" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Bienvenido al Sistema de Gestión Académica ISIPP" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsx(StatCard, { title: "Promedio General", value: stats.gpa, subtitle: "Escala 1-10", icon: /* @__PURE__ */ jsx(Star, { size: 22 }), color: "bordeaux" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Materias Aprobadas", value: stats.passed, icon: /* @__PURE__ */ jsx(CheckCircle, { size: 22 }), color: "green" }),
      /* @__PURE__ */ jsx(StatCard, { title: "En Cursada", value: stats.inProgress, icon: /* @__PURE__ */ jsx(Clock, { size: 22 }), color: "blue" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Asistencia Prom.", value: stats.attendance, icon: /* @__PURE__ */ jsx(BookOpen, { size: 22 }), color: "orange" }),
      /* @__PURE__ */ jsx(StatCard, { title: "Créditos", value: stats.credits, icon: /* @__PURE__ */ jsx(Award, { size: 22 }), color: "purple" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 card", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-4", children: "Materias en Cursada" }),
        enrollments.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-6", children: "No tiene materias inscriptas actualmente." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-xs text-gray-500 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx("th", { className: "pb-2 pr-4", children: "Materia" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 pr-4", children: "Nota Parcial" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 pr-4", children: "Asistencia" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2", children: "Estado" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: enrollments.slice(0, 8).map((enr) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-50 hover:bg-gray-50", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 font-medium text-gray-800", children: enr.subject?.name || "-" }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 text-gray-600", children: enr.grade?.[0]?.partial_grade ?? "-" }),
            /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 text-gray-600", children: enr.attendance?.[0]?.percentage != null ? `${enr.attendance[0].percentage}%` : "-" }),
            /* @__PURE__ */ jsx("td", { className: "py-2", children: /* @__PURE__ */ jsx(StatusBadge, { status: enr.grade?.[0]?.status || "in_progress" }) })
          ] }, enr.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-base font-semibold text-gray-900 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bell, { size: 16, className: "text-[#7A1E2C]" }),
            " Anuncios"
          ] }),
          announcements.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-3", children: "Sin anuncios." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: announcements.map((ann) => /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-[#7A1E2C] pl-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-800", children: ann.title }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: new Date(ann.date).toLocaleDateString("es-AR") })
          ] }, ann.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-3", children: "Próximos Eventos" }),
          events.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm text-center py-3", children: "Sin eventos próximos." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: events.map((ev) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#7A1E2C] rounded-full mt-1.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-800", children: ev.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: new Date(ev.date).toLocaleDateString("es-AR") })
            ] })
          ] }, ev.id)) })
        ] })
      ] })
    ] })
  ] });
}
export {
  StudentDashboard as component
};
