import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    subject_id: "",
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    semester: 1
  });
  const {
    showToast
  } = useToast();
  useEffect(() => {
    load();
  }, []);
  async function load() {
    const [{
      data: e
    }, {
      data: s
    }, {
      data: sub
    }] = await Promise.all([supabase.from("enrollments").select("*, student:students(first_name, last_name, legajo), subject:subjects(name, code)").order("created_at", {
      ascending: false
    }), supabase.from("students").select("id, first_name, last_name, legajo").order("last_name"), supabase.from("subjects").select("id, name, code").order("name")]);
    setEnrollments(e || []);
    setStudents(s || []);
    setSubjects(sub || []);
  }
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      error
    } = await supabase.from("enrollments").insert(form);
    if (error) {
      showToast("Error al inscribir. Verifique que no exista ya.", "error");
      return;
    }
    showToast("Inscripción creada.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta inscripción?")) return;
    await supabase.from("enrollments").delete().eq("id", id);
    showToast("Inscripción eliminada.", "info");
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Inscripciones" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setModalOpen(true), className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nueva Inscripción"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "student",
      label: "Estudiante",
      render: (r) => `${r.student?.last_name}, ${r.student?.first_name}`
    }, {
      key: "legajo",
      label: "Legajo",
      render: (r) => r.student?.legajo
    }, {
      key: "subject",
      label: "Materia",
      render: (r) => r.subject?.name
    }, {
      key: "code",
      label: "Código",
      render: (r) => r.subject?.code
    }, {
      key: "year",
      label: "Año"
    }, {
      key: "semester",
      label: "Cuatrimestre"
    }], data: enrollments, actions: (row) => /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: "Nueva Inscripción", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Estudiante *" }),
        /* @__PURE__ */ jsxs("select", { className: "form-input", required: true, value: form.student_id, onChange: (e) => setForm((p) => ({
          ...p,
          student_id: e.target.value
        })), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Seleccionar..." }),
          students.map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
            s.last_name,
            ", ",
            s.first_name,
            " (",
            s.legajo,
            ")"
          ] }, s.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Materia *" }),
        /* @__PURE__ */ jsxs("select", { className: "form-input", required: true, value: form.subject_id, onChange: (e) => setForm((p) => ({
          ...p,
          subject_id: e.target.value
        })), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Seleccionar..." }),
          subjects.map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
            s.name,
            " (",
            s.code,
            ")"
          ] }, s.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Año lectivo" }),
          /* @__PURE__ */ jsx("input", { type: "number", className: "form-input", value: form.year, onChange: (e) => setForm((p) => ({
            ...p,
            year: +e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Cuatrimestre" }),
          /* @__PURE__ */ jsxs("select", { className: "form-input", value: form.semester, onChange: (e) => setForm((p) => ({
            ...p,
            semester: +e.target.value
          })), children: [
            /* @__PURE__ */ jsx("option", { value: 1, children: "1° Cuatrimestre" }),
            /* @__PURE__ */ jsx("option", { value: 2, children: "2° Cuatrimestre" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex-1", children: "Inscribir" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setModalOpen(false), className: "btn-secondary flex-1", children: "Cancelar" })
      ] })
    ] }) })
  ] });
}
export {
  EnrollmentsPage as component
};
