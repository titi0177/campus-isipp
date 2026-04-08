import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Buscar...",
  actions,
  emptyMessage = "No hay datos disponibles"
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filtered = searchable ? data.filter(
    (row) => Object.values(row).some(
      (val) => String(val).toLowerCase().includes(search.toLowerCase())
    )
  ) : data;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  return /* @__PURE__ */ jsxs("div", { className: "card p-0 overflow-hidden", children: [
    searchable && /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-gray-100", children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-sm", children: [
      /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: search,
          onChange: (e) => {
            setSearch(e.target.value);
            setPage(1);
          },
          placeholder: searchPlaceholder,
          className: "form-input pl-9"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "table-header", children: [
        columns.map((col) => /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/90", children: col.label }, col.key)),
        actions && /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/90", children: "Acciones" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: paginated.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: columns.length + (actions ? 1 : 0), className: "px-4 py-8 text-center text-gray-400", children: emptyMessage }) }) : paginated.map((row, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-50 hover:bg-gray-50 transition-colors", children: [
        columns.map((col) => /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-700", children: col.render ? col.render(row) : String(row[col.key] ?? "-") }, col.key)),
        actions && /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: actions(row) })
      ] }, i)) })
    ] }) }),
    totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-gray-100 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
        filtered.length,
        " registros — Página ",
        page,
        " de ",
        totalPages
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPage((p) => Math.max(1, p - 1)),
            disabled: page === 1,
            className: "p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed",
            children: /* @__PURE__ */ jsx(ChevronLeft, { size: 16 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
            disabled: page === totalPages,
            className: "p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed",
            children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
          }
        )
      ] })
    ] })
  ] });
}
function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  const sizeClass = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return /* @__PURE__ */ jsx("div", { className: "modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: `modal-content w-full ${sizeClass}`,
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900", children: title }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
              children: /* @__PURE__ */ jsx(X, { size: 20 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6", children })
      ]
    }
  ) });
}
export {
  DataTable as D,
  Modal as M
};
