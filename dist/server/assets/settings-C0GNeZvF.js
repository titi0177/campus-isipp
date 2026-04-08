import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useToast, s as supabase } from "./router-CUMtMAij.js";
import { Settings, Lock } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function SettingsPage() {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const {
    showToast
  } = useToast();
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
      showToast("Contraseña actualizada.");
      setNewPass("");
      setConfirmPass("");
    }
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-2xl", children: [
    /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Settings, { size: 24, className: "text-[#7A1E2C]" }),
      " Configuración"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-base font-semibold text-gray-900 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Lock, { size: 16, className: "text-[#7A1E2C]" }),
        " Cambiar Contraseña del Administrador"
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleChangePassword, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nueva Contraseña" }),
          /* @__PURE__ */ jsx("input", { type: "password", value: newPass, onChange: (e) => setNewPass(e.target.value), required: true, className: "form-input", placeholder: "••••••••" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "form-label", children: "Confirmar Contraseña" }),
          /* @__PURE__ */ jsx("input", { type: "password", value: confirmPass, onChange: (e) => setConfirmPass(e.target.value), required: true, className: "form-input", placeholder: "••••••••" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: saving, className: "btn-primary", children: saving ? "Guardando..." : "Actualizar Contraseña" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900 mb-2", children: "Información del Sistema" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-gray-600", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Institución:" }),
          " Instituto Superior ISIPP"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Sistema:" }),
          " ISIPP Academic System v1.0"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Backend:" }),
          " Supabase PostgreSQL"
        ] })
      ] })
    ] })
  ] });
}
export {
  SettingsPage as component
};
