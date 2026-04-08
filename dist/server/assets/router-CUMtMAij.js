import { createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement, Filler } from "chart.js";
const ToastContext = createContext({ showToast: () => {
} });
function useToast() {
  return useContext(ToastContext);
}
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4e3);
  }, []);
  return /* @__PURE__ */ jsxs(ToastContext.Provider, { value: { showToast }, children: [
    children,
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 right-4 z-[100] space-y-2", children: toasts.map((toast) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm min-w-[280px] ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"}`,
        children: [
          toast.type === "success" && /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
          toast.type === "error" && /* @__PURE__ */ jsx(XCircle, { size: 18 }),
          toast.type === "info" && /* @__PURE__ */ jsx(AlertCircle, { size: 18 }),
          /* @__PURE__ */ jsx("span", { className: "flex-1", children: toast.message }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)),
              className: "text-white/80 hover:text-white",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ]
      },
      toast.id
    )) })
  ] });
}
const Route$p = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ISIPP Academic System" }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "es", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(ToastProvider, { children }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$o = () => import("./reset-password-H_N8tx3m.js");
const Route$o = createFileRoute("/reset-password")({
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const supabaseUrl = "https://lgljkqohoidxhrcycyvb.supabase.co";
const supabaseAnonKey = "sb_publishable_jyA5Ipi3M_5Ab8RO0snEOw_zOjS3FFi";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const $$splitComponentImporter$n = () => import("./login-BdSNNMOW.js");
const Route$n = createFileRoute("/login")({
  beforeLoad: async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user) throw redirect({
      to: "/"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./dashboard-Do35sM3p.js");
const Route$m = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) throw redirect({
      to: "/login"
    });
    const {
      data: profile
    } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") throw redirect({
      to: "/admin"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./admin-BZk03AjZ.js");
const Route$l = createFileRoute("/admin")({
  beforeLoad: async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) throw redirect({
      to: "/login"
    });
    const {
      data: profile
    } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw redirect({
      to: "/dashboard"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./index-BTU5dmpx.js");
const Route$k = createFileRoute("/")({
  beforeLoad: async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) throw redirect({
      to: "/login"
    });
    const {
      data: profile
    } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") throw redirect({
      to: "/admin"
    });
    throw redirect({
      to: "/dashboard"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./index-DxO8VD8S.js");
const Route$j = createFileRoute("/dashboard/")({
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./index-BKN_FU8V.js");
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);
const Route$i = createFileRoute("/admin/")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./subjects-BK_xR_l7.js");
const Route$h = createFileRoute("/dashboard/subjects")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./profile-DXd7wAQA.js");
const Route$g = createFileRoute("/dashboard/profile")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./history-S-j4Rlb3.js");
const Route$f = createFileRoute("/dashboard/history")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./exams-B5TVp1AG.js");
const Route$e = createFileRoute("/dashboard/exams")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./announcements-y9LrfYxq.js");
const Route$d = createFileRoute("/dashboard/announcements")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./subjects-xwauMXQo.js");
const Route$c = createFileRoute("/admin/subjects")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./students-DXZRb1el.js");
const Route$b = createFileRoute("/admin/students")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./settings-C0GNeZvF.js");
const Route$a = createFileRoute("/admin/settings")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./reports-CFiYPBFS.js");
Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
const Route$9 = createFileRoute("/admin/reports")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./programs-29W_AKYL.js");
const Route$8 = createFileRoute("/admin/programs")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./professors-BKqSYYGf.js");
const Route$7 = createFileRoute("/admin/professors")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./grades-EeBGCIqd.js");
const Route$6 = createFileRoute("/admin/grades")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./final-exams-jAiC6bCE.js");
const Route$5 = createFileRoute("/admin/final-exams")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./enrollments-DU3zbXFM.js");
const Route$4 = createFileRoute("/admin/enrollments")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./correlatives-CbbtcFvm.js");
const Route$3 = createFileRoute("/admin/correlatives")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./calendar-C-d1Edup.js");
const Route$2 = createFileRoute("/admin/calendar")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./attendance-DexQKOfp.js");
const Route$1 = createFileRoute("/admin/attendance")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./announcements-Cbc7vKsy.js");
const Route = createFileRoute("/admin/announcements")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const ResetPasswordRoute = Route$o.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => Route$p
});
const LoginRoute = Route$n.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$p
});
const DashboardRoute = Route$m.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$p
});
const AdminRoute = Route$l.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$p
});
const IndexRoute = Route$k.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$p
});
const DashboardIndexRoute = Route$j.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const AdminIndexRoute = Route$i.update({
  id: "/",
  path: "/",
  getParentRoute: () => AdminRoute
});
const DashboardSubjectsRoute = Route$h.update({
  id: "/subjects",
  path: "/subjects",
  getParentRoute: () => DashboardRoute
});
const DashboardProfileRoute = Route$g.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => DashboardRoute
});
const DashboardHistoryRoute = Route$f.update({
  id: "/history",
  path: "/history",
  getParentRoute: () => DashboardRoute
});
const DashboardExamsRoute = Route$e.update({
  id: "/exams",
  path: "/exams",
  getParentRoute: () => DashboardRoute
});
const DashboardAnnouncementsRoute = Route$d.update({
  id: "/announcements",
  path: "/announcements",
  getParentRoute: () => DashboardRoute
});
const AdminSubjectsRoute = Route$c.update({
  id: "/subjects",
  path: "/subjects",
  getParentRoute: () => AdminRoute
});
const AdminStudentsRoute = Route$b.update({
  id: "/students",
  path: "/students",
  getParentRoute: () => AdminRoute
});
const AdminSettingsRoute = Route$a.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AdminRoute
});
const AdminReportsRoute = Route$9.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => AdminRoute
});
const AdminProgramsRoute = Route$8.update({
  id: "/programs",
  path: "/programs",
  getParentRoute: () => AdminRoute
});
const AdminProfessorsRoute = Route$7.update({
  id: "/professors",
  path: "/professors",
  getParentRoute: () => AdminRoute
});
const AdminGradesRoute = Route$6.update({
  id: "/grades",
  path: "/grades",
  getParentRoute: () => AdminRoute
});
const AdminFinalExamsRoute = Route$5.update({
  id: "/final-exams",
  path: "/final-exams",
  getParentRoute: () => AdminRoute
});
const AdminEnrollmentsRoute = Route$4.update({
  id: "/enrollments",
  path: "/enrollments",
  getParentRoute: () => AdminRoute
});
const AdminCorrelativesRoute = Route$3.update({
  id: "/correlatives",
  path: "/correlatives",
  getParentRoute: () => AdminRoute
});
const AdminCalendarRoute = Route$2.update({
  id: "/calendar",
  path: "/calendar",
  getParentRoute: () => AdminRoute
});
const AdminAttendanceRoute = Route$1.update({
  id: "/attendance",
  path: "/attendance",
  getParentRoute: () => AdminRoute
});
const AdminAnnouncementsRoute = Route.update({
  id: "/announcements",
  path: "/announcements",
  getParentRoute: () => AdminRoute
});
const AdminRouteChildren = {
  AdminAnnouncementsRoute,
  AdminAttendanceRoute,
  AdminCalendarRoute,
  AdminCorrelativesRoute,
  AdminEnrollmentsRoute,
  AdminFinalExamsRoute,
  AdminGradesRoute,
  AdminProfessorsRoute,
  AdminProgramsRoute,
  AdminReportsRoute,
  AdminSettingsRoute,
  AdminStudentsRoute,
  AdminSubjectsRoute,
  AdminIndexRoute
};
const AdminRouteWithChildren = AdminRoute._addFileChildren(AdminRouteChildren);
const DashboardRouteChildren = {
  DashboardAnnouncementsRoute,
  DashboardExamsRoute,
  DashboardHistoryRoute,
  DashboardProfileRoute,
  DashboardSubjectsRoute,
  DashboardIndexRoute
};
const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AdminRoute: AdminRouteWithChildren,
  DashboardRoute: DashboardRouteWithChildren,
  LoginRoute,
  ResetPasswordRoute
};
const routeTree = Route$p._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  router as r,
  supabase as s,
  useToast as u
};
