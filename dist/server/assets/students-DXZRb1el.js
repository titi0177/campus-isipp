import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
const EMPTY = {
  first_name: "",
  last_name: "",
  dni: "",
  legajo: "",
  email: "",
  year: 1,
  status: "active"
};
function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const {
    showToast
  } = useToast();
  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    const [{
      data: s
    }, {
      data: p
    }] = await Promise.all([supabase.from("students").select("*, program:programs(name)").order("last_name"), supabase.from("programs").select("*")]);
    setStudents(s || []);
    setPrograms(p || []);
    setLoading(false);
  }
  const openNew = () => {
    setEditing(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setModalOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      program,
      ...data
    } = editing;
    if (id) {
      const {
        error
      } = await supabase.from("students").update(data).eq("id", id);
      if (error) {
        showToast("Error al actualizar.", "error");
        return;
      }
      showToast("Estudiante actualizado.");
    } else {
      const {
        error
      } = await supabase.from("students").insert(data);
      if (error) {
        showToast("Error al crear estudiante.", "error");
        return;
      }
      showToast("Estudiante creado.");
    }
    setModalOpen(false);
    loadData();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este estudiante?")) return;
    await supabase.from("students").delete().eq("id", id);
    showToast("Estudiante eliminado.", "info");
    loadData();
  };
  const columns = [{
    key: "last_name",
    label: "Apellido"
  }, {
    key: "first_name",
    label: "Nombre"
  }, {
    key: "legajo",
    label: "Legajo"
  }, {
    key: "dni",
    label: "DNI"
  }, {
    key: "email",
    label: "Email"
  }, {
    key: "program",
    label: "Carrera",
    render: (r) => r.program?.name || "-"
  }, {
    key: "year",
    label: "Año"
  }, {
    key: "status",
    label: "Estado",
    render: (r) => /* @__PURE__ */ jsx("span", { className: "capitalize", children: r.status })
  }];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Estudiantes" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Gestión del padrón de alumnos" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: openNew, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nuevo Estudiante"
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" }) : /* @__PURE__ */ jsx(DataTable, { columns, data: students, searchPlaceholder: "Buscar por nombre, legajo, DNI...", actions: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => openEdit(row), className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing.id ? "Editar Estudiante" : "Nuevo Estudiante", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nombre *" }),
          /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.first_name || "", onChange: (e) => setEditing((p) => ({
            ...p,
            first_name: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Apellido *" }),
          /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.last_name || "", onChange: (e) => setEditing((p) => ({
            ...p,
            last_name: e.target.value
          })) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "DNI *" }),
          /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.dni || "", onChange: (e) => setEditing((p) => ({
            ...p,
            dni: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Legajo *" }),
          /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.legajo || "", onChange: (e) => setEditing((p) => ({
            ...p,
            legajo: e.target.value
          })) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Email *" }),
        /* @__PURE__ */ jsx("input", { type: "email", className: "form-input", required: true, value: editing.email || "", onChange: (e) => setEditing((p) => ({
          ...p,
          email: e.target.value
        })) })
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
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Estado" }),
        /* @__PURE__ */ jsxs("select", { className: "form-input", value: editing.status || "active", onChange: (e) => setEditing((p) => ({
          ...p,
          status: e.target.value
        })), children: [
          /* @__PURE__ */ jsx("option", { value: "active", children: "Activo" }),
          /* @__PURE__ */ jsx("option", { value: "inactive", children: "Inactivo" }),
          /* @__PURE__ */ jsx("option", { value: "graduated", children: "Egresado" }),
          /* @__PURE__ */ jsx("option", { value: "suspended", children: "Suspendido" })
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
  StudentsPage as component
};
