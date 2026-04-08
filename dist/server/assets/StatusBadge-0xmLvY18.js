import { jsx } from "react/jsx-runtime";
const badgeMap = {
  promoted: { className: "badge-promoted", label: "Promocionado" },
  regular: { className: "badge-regular", label: "Regular" },
  in_progress: { className: "badge-inprogress", label: "En Curso" },
  free: { className: "badge-free", label: "Libre" },
  failed: { className: "badge-failed", label: "Desaprobado" },
  passed: { className: "badge-passed", label: "Aprobado" }
};
function StatusBadge({ status }) {
  const badge = badgeMap[status] || { className: "badge-inprogress", label: status };
  return /* @__PURE__ */ jsx("span", { className: badge.className, children: badge.label });
}
export {
  StatusBadge as S
};
