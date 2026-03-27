module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/apps/web/src/lib/auth/routing.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AUTH_ROLE_COOKIE",
    ()=>AUTH_ROLE_COOKIE,
    "isAdminPath",
    ()=>isAdminPath,
    "isClientPath",
    ()=>isClientPath,
    "isPortalPath",
    ()=>isPortalPath,
    "isProtectedPath",
    ()=>isProtectedPath,
    "isRole",
    ()=>isRole,
    "isStaffPath",
    ()=>isStaffPath,
    "roleHomePath",
    ()=>roleHomePath,
    "sanitizeNextPath",
    ()=>sanitizeNextPath
]);
const AUTH_ROLE_COOKIE = "maphari.auth.role";
const PROTECTED_PREFIXES = [
    "/client",
    "/portal",
    "/staff",
    "/admin"
];
function isRole(value) {
    return value === "CLIENT" || value === "STAFF" || value === "ADMIN";
}
function roleHomePath(role) {
    if (role === "CLIENT") return "/client";
    if (role === "STAFF") return "/staff";
    return "/admin";
}
function isClientPath(pathname) {
    return pathname === "/client" || pathname.startsWith("/client/");
}
function isPortalPath(pathname) {
    return pathname === "/portal" || pathname.startsWith("/portal/");
}
function isStaffPath(pathname) {
    return pathname === "/staff" || pathname.startsWith("/staff/");
}
function isAdminPath(pathname) {
    return pathname === "/admin" || pathname.startsWith("/admin/");
}
function isProtectedPath(pathname) {
    return PROTECTED_PREFIXES.some((prefix)=>pathname === prefix || pathname.startsWith(`${prefix}/`));
}
function sanitizeNextPath(nextPath) {
    if (!nextPath) return null;
    if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return null;
    if (isClientPath(nextPath) || isPortalPath(nextPath) || isStaffPath(nextPath) || isAdminPath(nextPath)) return nextPath;
    return null;
}
}),
"[project]/apps/web/src/lib/auth/route-guard.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveAuthRedirect",
    ()=>resolveAuthRedirect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/auth/routing.ts [middleware] (ecmascript)");
;
// Login/register pages nested inside protected directories — must be treated as public.
const NESTED_LOGIN_PATHS = [
    "/admin/login",
    "/staff/login",
    "/client/login",
    "/internal/login",
    "/internal/register"
];
function resolveAuthRedirect(input) {
    const { pathname, search, role } = input;
    const authenticated = Boolean(role);
    // Allow the dedicated login pages even though they live under /admin/ or /staff/
    if (NESTED_LOGIN_PATHS.some((p)=>pathname === p || pathname.startsWith(`${p}/`))) {
        if (authenticated) {
            // Already signed in — redirect to the appropriate home
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["roleHomePath"])(role);
        }
        return null;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isClientPath"])(pathname) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isPortalPath"])(pathname) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isStaffPath"])(pathname) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isAdminPath"])(pathname)) {
        if (!authenticated) {
            const loginParams = new URLSearchParams();
            const nextPath = `${pathname}${search}`;
            loginParams.set("next", nextPath);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isStaffPath"])(pathname) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isAdminPath"])(pathname)) {
                return `/internal/login?${loginParams.toString()}`;
            }
            return `/client/login?${loginParams.toString()}`;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isAdminPath"])(pathname)) {
            if (role === "CLIENT") return "/client";
            if (role === "STAFF") return "/staff";
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isStaffPath"])(pathname)) {
            if (role === "CLIENT") return "/client";
            if (role === "ADMIN") return "/admin";
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isClientPath"])(pathname) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isPortalPath"])(pathname)) {
            if (role === "STAFF") return "/staff";
            if (role === "ADMIN") return "/admin";
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isPortalPath"])(pathname) && role === "CLIENT") return "/client";
        }
    }
    if ((pathname === "/login" || pathname === "/client/login" || pathname === "/internal/login" || pathname === "/internal-login") && role) {
        const query = new URLSearchParams(search);
        const nextPath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["sanitizeNextPath"])(query.get("next"));
        if (nextPath) {
            // Avoid redirect loops when role cookie is present but session is stale.
            // Let the login page perform the real session handshake.
            return null;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["roleHomePath"])(role);
    }
    return null;
}
}),
"[project]/apps/web/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ════════════════════════════════════════════════════════════════════════════
// proxy.ts — Next.js 16 edge proxy (replaces middleware.ts convention)
//
// Responsibilities:
//   1. Detect subdomain → set x-app-type header
//   2. Block cross-subdomain route access
//   3. Enforce auth redirects (unauthenticated → login, wrong-role → home)
//
// Subdomain mapping:
//   client.mapharitechnologies.com → x-app-type: client
//   staff.mapharitechnologies.com  → x-app-type: staff
//   admin.mapharitechnologies.com  → x-app-type: admin
//   mapharitechnologies.com        → x-app-type: public
//
// Local dev override: NEXT_PUBLIC_APP_TYPE env var
//   values: 'client' | 'staff' | 'admin' | 'public' | 'both'
//   'both' shows staff + admin tabs simultaneously (development convenience)
// ════════════════════════════════════════════════════════════════════════════
__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_@babel+core@7.29.0_@playwright+test@1.58.2_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$route$2d$guard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/auth/route-guard.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/auth/routing.ts [middleware] (ecmascript)");
;
;
;
function detectAppType(host) {
    const envOverride = process.env.NEXT_PUBLIC_APP_TYPE;
    if (envOverride === "client" || envOverride === "staff" || envOverride === "admin" || envOverride === "public" || envOverride === "both") {
        return envOverride;
    }
    if (host.startsWith("client.")) return "client";
    if (host.startsWith("staff.")) return "staff";
    if (host.startsWith("admin.")) return "admin";
    return "public";
}
function proxy(request) {
    const host = request.headers.get("host") ?? "";
    const { pathname, search } = request.nextUrl;
    const appType = detectAppType(host);
    // ── Cross-subdomain route blocking ──────────────────────────────────────
    // client subdomain: only /client and /portal routes allowed
    if (appType === "client") {
        if (pathname === "/staff" || pathname.startsWith("/staff/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/client", request.url));
        }
        if (pathname === "/admin" || pathname.startsWith("/admin/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/client", request.url));
        }
        if (pathname === "/internal" || pathname.startsWith("/internal/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/client", request.url));
        }
    }
    // staff subdomain: only /staff routes allowed (not /admin, not /client)
    if (appType === "staff") {
        if (pathname === "/admin" || pathname.startsWith("/admin/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/staff", request.url));
        }
        if (pathname === "/client" || pathname.startsWith("/client/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/staff", request.url));
        }
    }
    // admin subdomain: only /admin routes allowed (not /staff, not /client)
    if (appType === "admin") {
        if (pathname === "/staff" || pathname.startsWith("/staff/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/admin", request.url));
        }
        if (pathname === "/client" || pathname.startsWith("/client/")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/admin", request.url));
        }
    }
    // ── Redirect /internal-login → /internal/login ───────────────────────────
    if (pathname === "/internal-login") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/internal/login${search}`, request.url));
    }
    // ── Redirect /internal/login to subdomain-specific page on staff/admin subdomains ──
    // On root domain / local dev, keep the combined two-tab page.
    if (pathname === "/internal/login" || pathname.startsWith("/internal/login/")) {
        if (appType === "admin") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/admin/login${search}`, request.url));
        }
        if (appType === "staff") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/staff/login${search}`, request.url));
        }
    }
    // ── Auth redirect logic ──────────────────────────────────────────────────
    const rawRole = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["AUTH_ROLE_COOKIE"])?.value;
    const role = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$routing$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["isRole"])(rawRole) ? rawRole : null;
    const redirectPath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2f$route$2d$guard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["resolveAuthRedirect"])({
        pathname,
        search,
        role
    });
    if (redirectPath) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(redirectPath, request.url));
    // ── Forward x-app-type header to page/layout server components ──────────
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-app-type", appType);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$playwright$2b$test$40$1$2e$58$2e$2_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request: {
            headers: requestHeaders
        }
    });
}
const config = {
    matcher: [
        "/client/:path*",
        "/portal/:path*",
        "/admin/:path*",
        "/staff/:path*",
        "/login",
        "/internal/:path*",
        "/internal-login"
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__37f86891._.js.map