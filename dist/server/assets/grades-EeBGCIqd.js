import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Pencil } from "lucide-react";
import { S as StatusBadge } from "./StatusBadge-0xmLvY18.js";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function GradesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState({});
  const {
    showToast
  } = useToast();
  useEffect(() => {
    load();
  }, []);
  async function load() {
    const {
      data
    } = await supabase.from("enrollments").select("*, student:students(first_name, last_name, legajo), subject:subjects(name, code), grade:grades(*)").order("created_at", {
      ascending: false
    });
    setEnrollments(data || []);
  }
  const openEdit = (enr) => {
    const g = enr.grade?.[0] || {};
    setEditing({
      enrollment_id: enr.id,
      ...g,
      studentName: `${enr.student?.last_name}, ${enr.student?.first_name}`,
      subjectName: enr.subject?.name
    });
    setModalOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      studentName,
      subjectName,
      created_at,
      ...data
    } = editing;
    if (id) {
      await supabase.from("grades").update(data).eq("id", id);
    } else {
      await supabase.from("grades").insert({
        ...data,
        status: data.status || "in_progress"
      });
    }
    showToast("Calificación guardada.");
    setModalOpen(false);
    load();
  };
  const STATUS_OPTIONS = ["promoted", "regular", "in_progress", "free", "failed", "passed"];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Calificaciones" }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "student",
      label: "Estudiante",
      render: (r) => `${r.student?.last_name}, ${r.student?.first_name}`
    }, {
      key: "subject",
      label: "Materia",
      render: (r) => r.subject?.name
    }, {
      key: "partial",
      label: "Parcial",
      render: (r) => r.grade?.[0]?.partial_grade ?? "-"
    }, {
      key: "exam",
      label: "Final Mesa",
      render: (r) => r.grade?.[0]?.final_exam_grade ?? "-"
    }, {
      key: "final",
      label: "Nota Final",
      render: (r) => r.grade?.[0]?.final_grade ?? "-"
    }, {
      key: "status",
      label: "Estado",
      render: (r) => /* @__PURE__ */ jsx(StatusBadge, { status: r.grade?.[0]?.status || "in_progress" })
    }], data: enrollments, actions: (row) => /* @__PURE__ */ jsx("button", { onClick: () => openEdit(row), className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: "Editar Calificación", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-3 bg-gray-50 rounded-lg text-sm", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: editing.studentName }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: editing.subjectName })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Parcial (1-10)" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 10, step: 0.1, className: "form-input", value: editing.partial_grade ?? "", onChange: (e) => setEditing((p) => ({
            ...p,
            partial_grade: e.target.value ? +e.target.value : null
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Final Mesa (1-10)" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 10, step: 0.1, className: "form-input", value: editing.final_exam_grade ?? "", onChange: (e) => setEditing((p) => ({
            ...p,
            final_exam_grade: e.target.value ? +e.target.value : null
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nota Final (1-10)" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 10, step: 0.1, className: "form-input", value: editing.final_grade ?? "", onChange: (e) => setEditing((p) => ({
            ...p,
            final_grade: e.target.value ? +e.target.value : null
          })) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Estado" }),
        /* @__PURE__ */ jsx("select", { className: "form-input", value: editing.status || "in_progress", onChange: (e) => setEditing((p) => ({
          ...p,
          status: e.target.value
        })), children: STATUS_OPTIONS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex-1", children: "Guardar" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setModalOpen(false), className: "btn-secondary flex-1", children: "Cancelar" })
      ] })
    ] }) })
  ] });
}
export {
  GradesPage as component
};
