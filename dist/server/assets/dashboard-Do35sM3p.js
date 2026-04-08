import { jsxs, jsx } from "react/jsx-runtime";
import { Outlet } from "@tanstack/react-router";
import { S as Sidebar, T as TopNav } from "./TopNav-CeYPedB-.js";
import { s as supabase } from "./router-CUMtMAij.js";
import { useState, useEffect } from "react";
import "lucide-react";
import "@supabase/supabase-js";
import "chart.js";
function DashboardLayout() {
  const [userName, setUserName] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({
      data: {
        user
      }
    }) => {
      if (user) {
        supabase.from("users").select("full_name").eq("id", user.id).single().then(({
          data
        }) => setUserName(data?.full_name || user.email || ""));
      }
    });
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-[#F4F4F4]", children: [
    /* @__PURE__ */ jsx(Sidebar, { role: "student" }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 ml-64 flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsx(TopNav, { userName, role: "student" }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 p-6", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] });
}
export {
  DashboardLayout as component
};
