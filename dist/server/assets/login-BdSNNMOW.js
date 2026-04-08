import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { GraduationCap, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { s as supabase } from "./router-CUMtMAij.js";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const {
      error: err
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (err) {
      setError("Credenciales inválidas. Verifique su email y contraseña.");
      setLoading(false);
      return;
    }
    window.location.href = "/";
  };
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setResetSent(true);
    setLoading(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-[#4A0F18] via-[#7A1E2C] to-[#9B2535] flex items-center justify-center p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-10", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0", style: {
      backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
      backgroundSize: "40px 40px"
    } }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#7A1E2C] px-8 py-8 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(GraduationCap, { size: 32, className: "text-[#7A1E2C]" }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "ISIPP" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/80 text-sm mt-1", children: "Instituto Superior ISIPP" }),
          /* @__PURE__ */ jsx("p", { className: "text-white/60 text-xs mt-2", children: "Sistema de Gestión Académica" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-8 py-8", children: !forgotMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-6", children: "Iniciar Sesión" }),
          error && /* @__PURE__ */ jsx("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm", children: error }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "form-label", children: "Correo Electrónico" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Mail, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }),
                /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "form-input pl-9", placeholder: "usuario@isipp.edu.ar" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "form-label", children: "Contraseña" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Lock, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }),
                /* @__PURE__ */ jsx("input", { type: showPass ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "form-input pl-9 pr-10", placeholder: "••••••••" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPass(!showPass), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPass ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed", children: loading ? "Ingresando..." : "Ingresar al Sistema" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setForgotMode(true), className: "mt-4 text-sm text-[#7A1E2C] hover:underline w-full text-center", children: "¿Olvidó su contraseña?" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Recuperar Contraseña" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-6", children: "Ingrese su email para recibir instrucciones." }),
          resetSent ? /* @__PURE__ */ jsx("div", { className: "p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center", children: "✓ Se envió un email con instrucciones para recuperar su contraseña." }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleReset, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "form-label", children: "Correo Electrónico" }),
              /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "form-input", placeholder: "usuario@isipp.edu.ar" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full py-3", children: loading ? "Enviando..." : "Enviar Instrucciones" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setForgotMode(false);
            setResetSent(false);
          }, className: "mt-4 text-sm text-gray-500 hover:underline w-full text-center", children: "← Volver al inicio de sesión" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-white/50 text-xs mt-6", children: "© 2025 Instituto Superior ISIPP — Sistema Académico v1.0" })
    ] })
  ] });
}
export {
  LoginPage as component
};
