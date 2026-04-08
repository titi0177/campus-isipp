import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function AnnouncementsAdminPage() {
  const [items, setItems] = useState([]);
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
    } = await supabase.from("announcements").select("*").order("date", {
      ascending: false
    });
    setItems(data || []);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      id,
      created_at,
      ...data
    } = editing;
    if (id) await supabase.from("announcements").update(data).eq("id", id);
    else await supabase.from("announcements").insert(data);
    showToast("Anuncio guardado.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este anuncio?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    showToast("Anuncio eliminado.", "info");
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Anuncios" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setEditing({
          date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
        });
        setModalOpen(true);
      }, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nuevo Anuncio"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "title",
      label: "Título"
    }, {
      key: "description",
      label: "Descripción",
      render: (r) => /* @__PURE__ */ jsx("span", { className: "line-clamp-1", children: r.description })
    }, {
      key: "date",
      label: "Fecha",
      render: (r) => new Date(r.date).toLocaleDateString("es-AR")
    }], data: items, actions: (row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setEditing(row);
        setModalOpen(true);
      }, className: "p-1.5 text-gray-500 hover:text-[#7A1E2C] hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Pencil, { size: 15 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
    ] }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing.id ? "Editar Anuncio" : "Nuevo Anuncio", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Título *" }),
        /* @__PURE__ */ jsx("input", { className: "form-input", required: true, value: editing.title || "", onChange: (e) => setEditing((p) => ({
          ...p,
          title: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Descripción *" }),
        /* @__PURE__ */ jsx("textarea", { className: "form-input", rows: 4, required: true, value: editing.description || "", onChange: (e) => setEditing((p) => ({
          ...p,
          description: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Fecha *" }),
        /* @__PURE__ */ jsx("input", { type: "date", className: "form-input", required: true, value: editing.date || "", onChange: (e) => setEditing((p) => ({
          ...p,
          date: e.target.value
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex-1", children: "Publicar" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setModalOpen(false), className: "btn-secondary flex-1", children: "Cancelar" })
      ] })
    ] }) })
  ] });
}
export {
  AnnouncementsAdminPage as component
};
