import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { D as DataTable, M as Modal } from "./Modal-B-BPuA4g.js";
import { Plus, Trash2 } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function CorrelativesPage() {
  const [correlatives, setCorrelatives] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    subject_id: "",
    requires_subject_id: ""
  });
  const {
    showToast
  } = useToast();
  useEffect(() => {
    load();
  }, []);
  async function load() {
    const [{
      data: c
    }, {
      data: s
    }] = await Promise.all([supabase.from("subject_correlatives").select("*, subject:subjects!subject_id(name, code), requires:subjects!requires_subject_id(name, code)"), supabase.from("subjects").select("id, name, code").order("name")]);
    setCorrelatives(c || []);
    setSubjects(s || []);
  }
  const handleSave = async (e) => {
    e.preventDefault();
    const {
      error
    } = await supabase.from("subject_correlatives").insert(form);
    if (error) {
      showToast("Error. Puede que ya exista esa correlativa.", "error");
      return;
    }
    showToast("Correlativa guardada.");
    setModalOpen(false);
    load();
  };
  const handleDelete = async (id) => {
    await supabase.from("subject_correlatives").delete().eq("id", id);
    showToast("Correlativa eliminada.", "info");
    load();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Correlativas" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mt-1", children: "Requisitos previos para cursar materias" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        setForm({
          subject_id: "",
          requires_subject_id: ""
        });
        setModalOpen(true);
      }, className: "btn-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { size: 16 }),
        " Nueva Correlativa"
      ] })
    ] }),
    /* @__PURE__ */ jsx(DataTable, { columns: [{
      key: "subject",
      label: "Materia",
      render: (r) => `${r.subject?.name} (${r.subject?.code})`
    }, {
      key: "requires",
      label: "Requiere aprobar",
      render: (r) => `${r.requires?.name} (${r.requires?.code})`
    }], data: correlatives, actions: (row) => /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(row.id), className: "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg", children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) }) }),
    /* @__PURE__ */ jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: "Nueva Correlativa", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Materia que tiene requisito *" }),
        /* @__PURE__ */ jsxs("select", { className: "form-input", required: true, value: form.subject_id, onChange: (e) => setForm((p) => ({
          ...p,
          subject_id: e.target.value
        })), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Seleccionar materia..." }),
          subjects.map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
            s.name,
            " (",
            s.code,
            ")"
          ] }, s.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Requiere tener aprobada *" }),
        /* @__PURE__ */ jsxs("select", { className: "form-input", required: true, value: form.requires_subject_id, onChange: (e) => setForm((p) => ({
          ...p,
          requires_subject_id: e.target.value
        })), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Seleccionar requisito..." }),
          subjects.filter((s) => s.id !== form.subject_id).map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
            s.name,
            " (",
            s.code,
            ")"
          ] }, s.id))
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
  CorrelativesPage as component
};
