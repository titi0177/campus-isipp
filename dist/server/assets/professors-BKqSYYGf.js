import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function ProfessorsPage() {
  const [professors, setProfessors] = useState([]);
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
    } = await supabase.from("professors").select("*").order("name");
    setProfessors(data || []);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      created_at,
      ...data
    } = editing;
    if (id) await supabase.from("professors").update(data).eq("id", id);
    else await supabase.from("professors").insert(data);
    showToast("Profesor guardado.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este profesor?")) return;
    await supabase.from("professors").delete().eq("id", id);
    showToast("Profesor eliminado.", "info");
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Profesores" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setEditing({});
        setModalOpen(true);
      }, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nuevo Profesor"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "name",
      label: "Nombre"
    }, {
      key: "email",
      label: "Email"
    }, {
      key: "department",
      label: "Departamento"
    }], data: professors, actions: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setEditing(row);
        setModalOpen(true);
      }, className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing.id ? "Editar Profesor" : "Nuevo Profesor", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nombre completo *" }),
        /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.name || "", onChange: (e) => setEditing((p) => ({
          ...p,
          name: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Email *" }),
        /* @__PURE__ */ jsx("input", { type: "email", className: "form-input", required: true, value: editing.email || "", onChange: (e) => setEditing((p) => ({
          ...p,
          email: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Departamento *" }),
        /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.department || "", onChange: (e) => setEditing((p) => ({
          ...p,
          department: e.target.value
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
  ProfessorsPage as component
};
