import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { BookMarked, Calendar, User, MapPin } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const {
    showToast
  } = useToast();
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
      setStudentId(student.id);
      const {
        data: ex
      } = await supabase.from("final_exams").select("*, subject:subjects(name, code), professor:professors(name)").gte("date", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)).order("date");
      setExams(ex || []);
      const {
        data: ee
      } = await supabase.from("exam_enrollments").select("final_exam_id").eq("student_id", student.id);
      setEnrolled((ee || []).map((e) => e.final_exam_id));
    }
    setLoading(false);
  }
  const enroll = async (examId) => {
    const {
      error
    } = await supabase.from("exam_enrollments").insert({
      student_id: studentId,
      final_exam_id: examId
    });
    if (error) showToast("Error al inscribirse.", "error");
    else {
      showToast("Inscripción realizada exitosamente.");
      setEnrolled((prev) => [...prev, examId]);
    }
  };
  const unenroll = async (examId) => {
    await supabase.from("exam_enrollments").delete().eq("student_id", studentId).eq("final_exam_id", examId);
    showToast("Inscripción cancelada.", "info");
    setEnrolled((prev) => prev.filter((id) => id !== examId));
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Exámenes Finales" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm -mt-4", children: "Mesas de examen disponibles para inscripción" }),
    loading ? /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" }) : exams.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card text-center py-12 text-gray-400", children: "No hay exámenes disponibles en este momento." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: exams.map((ex) => {
      const isEnrolled = enrolled.includes(ex.id);
      return /* @__PURE__ */ jsx("div", { className: "card hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "bg-red-50 p-3 rounded-xl flex-shrink-0", children: /* @__PURE__ */ jsx(BookMarked, { size: 20, className: "text-[#7A1E2C]" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900", children: ex.subject?.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-0.5", children: [
              "Código: ",
              ex.subject?.code
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-2 text-xs text-gray-600", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Calendar, { size: 12 }),
                new Date(ex.date).toLocaleDateString("es-AR")
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(User, { size: 12 }),
                ex.professor?.name || "-"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(MapPin, { size: 12 }),
                ex.location
              ] })
            ] })
          ] })
        ] }),
        isEnrolled ? /* @__PURE__ */ jsx("button", { onClick: () => unenroll(ex.id), className: "btn-secondary text-xs px-3 py-1.5 whitespace-nowrap", children: "Cancelar Inscripción" }) : /* @__PURE__ */ jsx("button", { onClick: () => enroll(ex.id), className: "btn-primary text-xs px-3 py-1.5 whitespace-nowrap", children: "Inscribirse" })
      ] }) }, ex.id);
    }) })
  ] });
}
export {
  ExamsPage as component
};
