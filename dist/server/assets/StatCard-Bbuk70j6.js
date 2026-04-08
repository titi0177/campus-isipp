import { jsx, jsxs } from "react/jsx-runtime";
const colorMap = {
  bordeaux: { bg: "bg-[#7A1E2C]", light: "bg-red-50", text: "text-[#7A1E2C]" },
  green: { bg: "bg-green-600", light: "bg-green-50", text: "text-green-700" },
  blue: { bg: "bg-blue-600", light: "bg-blue-50", text: "text-blue-700" },
  orange: { bg: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700" },
  purple: { bg: "bg-purple-600", light: "bg-purple-50", text: "text-purple-700" }
};
function StatCard({ title, value, subtitle, icon, color = "bordeaux" }) {
  const c = colorMap[color];
  return /* @__PURE__ */ jsx("div", { className: "card hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 font-medium", children: title }),
      /* @__PURE__ */ jsx("p", { className: `text-3xl font-bold mt-1 ${c.text}`, children: value }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: subtitle })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `${c.light} p-3 rounded-xl`, children: /* @__PURE__ */ jsx("div", { className: c.text, children: icon }) })
  ] }) });
}
export {
  StatCard as S
};
