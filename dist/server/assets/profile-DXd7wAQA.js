import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { User, Lock, Save } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function ProfilePage() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const {
    showToast
  } = useToast();
  useEffect(() => {
    supabase.auth.getUser().then(({
      data: {
        user
      }
    }) => {
      if (!user) return;
      supabase.from("students").select("*, program:programs(name)").eq("user_id", user.id).single().then(({
        data
      }) => {
        setStudent(data);
        setLoading(false);
      });
    });
  }, []);
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast("Las contraseñas no coinciden.", "error");
      return;
    }
    if (newPass.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }
    setSaving(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password: newPass
    });
    if (error) showToast("Error al cambiar contraseña.", "error");
    else {
      showToast("Contraseña actualizada exitosamente.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    }
    setSaving(false);
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-2xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Mi Perfil" }),
    /* @__PURE__ */ jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-[#7A1E2C] rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { size: 28, className: "text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-gray-900", children: [
            student?.first_name,
            " ",
            student?.last_name
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-sm", children: [
            "Legajo: ",
            student?.legajo
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [["Nombre", `${student?.first_name} ${student?.last_name}`], ["DNI", student?.dni], ["Legajo", student?.legajo], ["Email", student?.email], ["Carrera", student?.program?.name || "-"], ["Año", `${student?.year}°`], ["Estado", student?.status]].map(([label, value]) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
          label,
          ":"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "font-medium mt-0.5 capitalize", children: value })
      ] }, label)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-base font-semibold text-gray-900 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Lock, { size: 16, className: "text-[#7A1E2C]" }),
        " Cambiar Contraseña"
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleChangePassword, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nueva Contraseña" }),
          /* @__PURE__ */ jsx("input", { type: "password", value: newPass, onChange: (e) => setNewPass(e.target.value), required: true, className: "form-input", placeholder: "••••••••" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Confirmar Nueva Contraseña" }),
          /* @__PURE__ */ jsx("input", { type: "password", value: confirmPass, onChange: (e) => setConfirmPass(e.target.value), required: true, className: "form-input", placeholder: "••••••••" })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "submit", disabled: saving, className: "btn-primary flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Save, { size: 16 }),
          " ",
          saving ? "Guardando..." : "Actualizar Contraseña"
        ] })
      ] })
    ] })
  ] });
}
export {
  ProfilePage as component
};
