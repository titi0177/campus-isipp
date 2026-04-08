import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Pencil } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function AttendancePage() {
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
    } = await supabase.from("enrollments").select("*, student:students(first_name, last_name, legajo), subject:subjects(name), attendance:attendance(*)").order("created_at", {
      ascending: false
    });
    setEnrollments(data || []);
  }
  const openEdit = (enr) => {
    const a = enr.attendance?.[0] || {};
    setEditing({
      enrollment_id: enr.id,
      ...a,
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
    if (id) await supabase.from("attendance").update({
      percentage: data.percentage
    }).eq("id", id);
    else await supabase.from("attendance").insert(data);
    showToast("Asistencia guardada.");
    setModalOpen(false);
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Asistencia" }),
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
      key: "attendance",
      label: "Asistencia",
      render: (r) => {
        const pct = r.attendance?.[0]?.percentage;
        if (pct == null) return "-";
        const color = pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600";
        return /* @__PURE__ */ jsxs("span", { className: `font-semibold ${color}`, children: [
          pct,
          "%"
        ] });
      }
    }], data: enrollments, actions: (row) => /* @__PURE__ */ jsx("button", { onClick: () => openEdit(row), className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: "Editar Asistencia", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-3 bg-gray-50 rounded-lg text-sm", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: editing.studentName }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: editing.subjectName })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Porcentaje de Asistencia (0-100)" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 0, max: 100, className: "form-input", required: true, value: editing.percentage ?? "", onChange: (e) => setEditing((p) => ({
          ...p,
          percentage: +e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex-1", children: "Guardar" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setModalOpen(false), className: "btn-secondary flex-1", children: "Cancelar" })
      ] })
    ] }) })
  ] });
}
export {
  AttendancePage as component
};
