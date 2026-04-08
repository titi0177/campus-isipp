import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { GraduationCap } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const {
      error: err
    } = await supabase.auth.updateUser({
      password
    });
    if (err) setError("Error al actualizar contraseña.");
    else setDone(true);
    setLoading(false);
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-[#4A0F18] via-[#7A1E2C] to-[#9B2535] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#7A1E2C] px-8 py-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx(GraduationCap, { size: 28, className: "text-[#7A1E2C]" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-white", children: "ISIPP" }),
      /* @__PURE__ */ jsx("p", { className: "text-white/70 text-sm", children: "Restablecer Contraseña" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-8", children: done ? /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-green-600 font-medium mb-4", children: "✓ Contraseña actualizada exitosamente." }),
      /* @__PURE__ */ jsx("a", { href: "/login", className: "btn-primary inline-block", children: "Ir al Inicio de Sesión" })
    ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      error && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Nueva Contraseña" }),
        /* @__PURE__ */ jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "form-input", placeholder: "••••••••" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "form-label", children: "Confirmar Contraseña" }),
        /* @__PURE__ */ jsx("input", { type: "password", value: confirm, onChange: (e) => setConfirm(e.target.value), required: true, className: "form-input", placeholder: "••••••••" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full py-3", children: loading ? "Guardando..." : "Actualizar Contraseña" })
    ] }) })
  ] }) });
}
export {
  ResetPasswordPage as component
};
