import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function CalendarPage() {
  const [events, setEvents] = useState([]);
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
    } = await supabase.from("calendar_events").select("*").order("date");
    setEvents(data || []);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      created_at,
      ...data
    } = editing;
    if (id) await supabase.from("calendar_events").update(data).eq("id", id);
    else await supabase.from("calendar_events").insert(data);
    showToast("Evento guardado.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este evento?")) return;
    await supabase.from("calendar_events").delete().eq("id", id);
    showToast("Evento eliminado.", "info");
    load();
  };
  const typeLabel = {
    exam: "Examen",
    deadline: "Vencimiento",
    event: "Evento"
  };
  const typeColor = {
    exam: "bg-red-100 text-red-700",
    deadline: "bg-orange-100 text-orange-700",
    event: "bg-blue-100 text-blue-700"
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Calendario Académico" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setEditing({
          type: "event",
          date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
        });
        setModalOpen(true);
      }, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nuevo Evento"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "title",
      label: "Título"
    }, {
      key: "type",
      label: "Tipo",
      render: (r) => /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${typeColor[r.type] || ""}`, children: typeLabel[r.type] || r.type })
    }, {
      key: "date",
      label: "Fecha",
      render: (r) => new Date(r.date).toLocaleDateString("es-AR")
    }, {
      key: "description",
      label: "Descripción",
      render: (r) => r.description || "-"
    }], data: events, actions: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setEditing(row);
        setModalOpen(true);
      }, className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing.id ? "Editar Evento" : "Nuevo Evento", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Título *" }),
        /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.title || "", onChange: (e) => setEditing((p) => ({
          ...p,
          title: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Tipo *" }),
          /* @__PURE__ */ jsxs("select", { className: "form-input", required: true, value: editing.type || "event", onChange: (e) => setEditing((p) => ({
            ...p,
            type: e.target.value
          })), children: [
            /* @__PURE__ */ jsx("option", { value: "event", children: "Evento" }),
            /* @__PURE__ */ jsx("option", { value: "exam", children: "Examen" }),
            /* @__PURE__ */ jsx("option", { value: "deadline", children: "Vencimiento" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Fecha *" }),
          /* @__PURE__ */ jsx("input", { type: "date", className: "form-input", required: true, value: editing.date || "", onChange: (e) => setEditing((p) => ({
            ...p,
            date: e.target.value
          })) })
        ] })
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
  CalendarPage as component
};
