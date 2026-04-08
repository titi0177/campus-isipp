import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState({});
  const {
    showToast
  } = useToast();
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    const {
      data
    } = await supabase.from("programs").select("*").order("name");
    setPrograms(data || []);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      created_at,
      ...data
    } = editing;
    if (id) await supabase.from("programs").update(data).eq("id", id);
    else await supabase.from("programs").insert(data);
    showToast("Carrera guardada.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta carrera?")) return;
    await supabase.from("programs").delete().eq("id", id);
    showToast("Carrera eliminada.", "info");
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Carreras" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setEditing({});
        setModalOpen(true);
      }, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nueva Carrera"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "name",
      label: "Nombre de la Carrera"
    }, {
      key: "duration_years",
      label: "Duración (años)"
    }, {
      key: "description",
      label: "Descripción"
    }], data: programs, actions: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setEditing(row);
        setModalOpen(true);
      }, className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing.id ? "Editar Carrera" : "Nueva Carrera", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nombre *" }),
        /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.name || "", onChange: (e) => setEditing((p) => ({
          ...p,
          name: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Duración (años) *" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, max: 8, className: "form-input", required: true, value: editing.duration_years || "", onChange: (e) => setEditing((p) => ({
          ...p,
          duration_years: +e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Descripción" }),
        /* @__PURE__ */ jsx("textarea", { className: "form-input", rows: 3, value: editing.description || "", onChange: (e) => setEditing((p) => ({
          ...p,
          description: e.target.value
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
  ProgramsPage as component
};
