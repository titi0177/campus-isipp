import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-CUMtMAij.js";
import { Bell } from "lucide-react";
import "@tanstack/react-router";
import "@supabase/supabase-js";
import "chart.js";
function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("announcements").select("*").order("date", {
      ascending: false
    }).then(({
      data
    }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Anuncios Institucionales" }),
    loading ? /* @__PURE__ */ jsx("div", { className: "card animate-pulse h-64 bg-gray-100" }) : items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "card text-center py-12 text-gray-400", children: "No hay anuncios disponibles." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: items.map((ann) => /* @__PURE__ */ jsx("div", { className: "card hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-red-50 p-3 rounded-xl flex-shrink-0", children: /* @__PURE__ */ jsx(Bell, { size: 20, className: "text-[#7A1E2C]" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900", children: ann.title }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 flex-shrink-0", children: new Date(ann.date).toLocaleDateString("es-AR") })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mt-2 leading-relaxed", children: ann.description })
      ] })
    ] }) }, ann.id)) })
  ] });
}
export {
  AnnouncementsPage as component
};
