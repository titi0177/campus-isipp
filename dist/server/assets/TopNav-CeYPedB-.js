import { jsxs, jsx } from "react/jsx-runtime";
import { useRouterState, Link } from "@tanstack/react-router";
import { GraduationCap, ChevronRight, LogOut, LayoutDashboard, Users, BookOpen, UserCheck, ClipboardList, Star, ClipboardCheck, Link2, BookMarked, Bell, BarChart3, Calendar, Settings, FileText, User, ChevronDown } from "lucide-react";
import { s as supabase } from "./router-CUMtMAij.js";
import { useState } from "react";
const adminNav = [
  { label: "Dashboard", href: "/admin", icon: /* @__PURE__ */ jsx(LayoutDashboard, { size: 18 }) },
  { label: "Estudiantes", href: "/admin/students", icon: /* @__PURE__ */ jsx(Users, { size: 18 }) },
  { label: "Carreras", href: "/admin/programs", icon: /* @__PURE__ */ jsx(GraduationCap, { size: 18 }) },
  { label: "Materias", href: "/admin/subjects", icon: /* @__PURE__ */ jsx(BookOpen, { size: 18 }) },
  { label: "Profesores", href: "/admin/professors", icon: /* @__PURE__ */ jsx(UserCheck, { size: 18 }) },
  { label: "Inscripciones", href: "/admin/enrollments", icon: /* @__PURE__ */ jsx(ClipboardList, { size: 18 }) },
  { label: "Calificaciones", href: "/admin/grades", icon: /* @__PURE__ */ jsx(Star, { size: 18 }) },
  { label: "Asistencia", href: "/admin/attendance", icon: /* @__PURE__ */ jsx(ClipboardCheck, { size: 18 }) },
  { label: "Correlativas", href: "/admin/correlatives", icon: /* @__PURE__ */ jsx(Link2, { size: 18 }) },
  { label: "Exámenes Finales", href: "/admin/final-exams", icon: /* @__PURE__ */ jsx(BookMarked, { size: 18 }) },
  { label: "Anuncios", href: "/admin/announcements", icon: /* @__PURE__ */ jsx(Bell, { size: 18 }) },
  { label: "Reportes", href: "/admin/reports", icon: /* @__PURE__ */ jsx(BarChart3, { size: 18 }) },
  { label: "Calendario", href: "/admin/calendar", icon: /* @__PURE__ */ jsx(Calendar, { size: 18 }) },
  { label: "Configuración", href: "/admin/settings", icon: /* @__PURE__ */ jsx(Settings, { size: 18 }) }
];
const studentNav = [
  { label: "Mi Panel", href: "/dashboard", icon: /* @__PURE__ */ jsx(LayoutDashboard, { size: 18 }) },
  { label: "Mis Materias", href: "/dashboard/subjects", icon: /* @__PURE__ */ jsx(BookOpen, { size: 18 }) },
  { label: "Historial Académico", href: "/dashboard/history", icon: /* @__PURE__ */ jsx(FileText, { size: 18 }) },
  { label: "Exámenes Finales", href: "/dashboard/exams", icon: /* @__PURE__ */ jsx(BookMarked, { size: 18 }) },
  { label: "Anuncios", href: "/dashboard/announcements", icon: /* @__PURE__ */ jsx(Bell, { size: 18 }) },
  { label: "Mi Perfil", href: "/dashboard/profile", icon: /* @__PURE__ */ jsx(UserCheck, { size: 18 }) }
];
function Sidebar({ role }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const navItems = role === "admin" ? adminNav : studentNav;
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  return /* @__PURE__ */ jsxs("aside", { className: "sidebar", children: [
    /* @__PURE__ */ jsx("div", { className: "px-4 py-6 border-b border-white/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-white rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(GraduationCap, { size: 22, className: "text-[#7A1E2C]" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-bold text-white text-sm leading-tight", children: "ISIPP" }),
        /* @__PURE__ */ jsx("div", { className: "text-white/60 text-xs", children: "Sistema Académico" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "px-4 py-3 border-b border-white/10", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-white/50", children: role === "admin" ? "Administración" : "Portal Estudiante" }) }),
    /* @__PURE__ */ jsx("nav", { className: "flex-1 py-4 space-y-1", children: navItems.map((item) => {
      const isActive = currentPath === item.href || item.href !== "/admin" && item.href !== "/dashboard" && currentPath.startsWith(item.href);
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: item.href,
          className: `sidebar-link ${isActive ? "active" : ""}`,
          children: [
            item.icon,
            /* @__PURE__ */ jsx("span", { className: "flex-1", children: item.label }),
            isActive && /* @__PURE__ */ jsx(ChevronRight, { size: 14 })
          ]
        },
        item.href
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-white/10", children: /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleLogout,
        className: "sidebar-link w-full text-left",
        children: [
          /* @__PURE__ */ jsx(LogOut, { size: 18 }),
          /* @__PURE__ */ jsx("span", { children: "Cerrar Sesión" })
        ]
      }
    ) })
  ] });
}
function TopNav({ userName = "Usuario", role }) {
  const [showMenu, setShowMenu] = useState(false);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  return /* @__PURE__ */ jsxs("header", { className: "bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold text-[#7A1E2C]", children: "ISIPP Academic System" }),
      /* @__PURE__ */ jsx("span", { className: "hidden md:inline text-gray-400", children: "|" }),
      /* @__PURE__ */ jsx("span", { className: "hidden md:inline text-sm text-gray-500", children: "Instituto Superior ISIPP" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("button", { className: "relative p-2 text-gray-500 hover:text-[#7A1E2C] hover:bg-gray-50 rounded-lg transition-colors", children: [
        /* @__PURE__ */ jsx(Bell, { size: 20 }),
        /* @__PURE__ */ jsx("span", { className: "absolute top-1 right-1 w-2 h-2 bg-[#7A1E2C] rounded-full" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowMenu(!showMenu),
            className: "flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors",
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-[#7A1E2C] rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { size: 16, className: "text-white" }) }),
              /* @__PURE__ */ jsxs("div", { className: "hidden md:block text-left", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium leading-tight", children: userName }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 capitalize", children: role })
              ] }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-gray-400" })
            ]
          }
        ),
        showMenu && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50", children: [
          /* @__PURE__ */ jsx("a", { href: role === "admin" ? "/admin" : "/dashboard/profile", className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50", children: "Mi Perfil" }),
          /* @__PURE__ */ jsx("hr", { className: "my-1 border-gray-100" }),
          /* @__PURE__ */ jsx("button", { onClick: handleLogout, className: "block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50", children: "Cerrar Sesión" })
        ] })
      ] })
    ] })
  ] });
}
export {
  Sidebar as S,
  TopNav as T
};
