import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState({});
  const {
    showToast
  } = useToast();
  useEffect(() => {
    load();
  }, []);
  async function load() {
    const [{
      data: s
    }, {
      data: p
    }, {
      data: pr
    }] = await Promise.all([supabase.from("subjects").select("*, program:programs(name), professor:professors(name)").order("name"), supabase.from("programs").select("*").order("name"), supabase.from("professors").select("*").order("name")]);
    setSubjects(s || []);
    setPrograms(p || []);
    setProfessors(pr || []);
  }
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      created_at,
      program,
      professor,
      ...data
    } = editing;
    if (id) await supabase.from("subjects").update(data).eq("id", id);
    else await supabase.from("subjects").insert(data);
    showToast("Materia guardada.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta materia?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    showToast("Materia eliminada.", "info");
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Materias" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setEditing({
          year: 1,
          credits: 4
        });
        setModalOpen(true);
      }, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nueva Materia"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "code",
      label: "Código"
    }, {
      key: "name",
      label: "Nombre"
    }, {
      key: "program",
      label: "Carrera",
      render: (r) => r.program?.name || "-"
    }, {
      key: "year",
      label: "Año"
    }, {
      key: "professor",
      label: "Profesor",
      render: (r) => r.professor?.name || "-"
    }, {
      key: "credits",
      label: "Créditos"
    }], data: subjects, actions: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setEditing(row);
        setModalOpen(true);
      }, className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing.id ? "Editar Materia" : "Nueva Materia", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nombre *" }),
          /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.name || "", onChange: (e) => setEditing((p) => ({
            ...p,
            name: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Código *" }),
          /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.code || "", onChange: (e) => setEditing((p) => ({
            ...p,
            code: e.target.value
          })) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Carrera" }),
          /* @__PURE__ */ jsxs("select", { className: "form-input", value: editing.program_id || "", onChange: (e) => setEditing((p) => ({
            ...p,
            program_id: e.target.value
          })), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Sin asignar" }),
            programs.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Año" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 6, className: "form-input", value: editing.year || 1, onChange: (e) => setEditing((p) => ({
            ...p,
            year: +e.target.value
          })) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Profesor" }),
          /* @__PURE__ */ jsxs("select", { className: "form-input", value: editing.professor_id || "", onChange: (e) => setEditing((p) => ({
            ...p,
            professor_id: e.target.value
          })), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Sin asignar" }),
            professors.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Créditos" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, className: "form-input", value: editing.credits || 4, onChange: (e) => setEditing((p) => ({
            ...p,
            credits: +e.target.value
          })) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex-1", children: "Guardar" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setModalOpen(false), className: "btn-secondary flex-1", children: "Cancelar" })
      ] })
    ] }) })
  ] });
}
export {
  SubjectsPage as component
};
