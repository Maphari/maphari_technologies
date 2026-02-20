import { describe, expect, it } from "vitest";
import { resolveAuthRedirect } from "./route-guard";

describe("resolveAuthRedirect", () => {
  it("redirects anonymous portal request to login with encoded next path", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/portal",
      search: "?tab=files",
      role: null,
    });

    expect(redirect).toBe("/login?next=%2Fportal%3Ftab%3Dfiles");
  });

  it("redirects CLIENT away from admin paths", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/admin",
      search: "",
      role: "CLIENT",
    });

    expect(redirect).toBe("/portal");
  });

  it("redirects authenticated STAFF from login to staff home", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/login",
      search: "",
      role: "STAFF",
    });

    expect(redirect).toBe("/staff");
  });

  it("keeps authenticated user on login when next path is present", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/login",
      search: "?next=%2Fportal%2Fchat",
      role: "CLIENT",
    });

    expect(redirect).toBeNull();
  });

  it("keeps authenticated user on login even with legacy force query", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/login",
      search: "?next=%2Fadmin&force=1",
      role: "CLIENT",
    });

    expect(redirect).toBeNull();
  });

  it("ignores invalid next path and falls back to role home", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/login",
      search: "?next=https://malicious.example.com",
      role: "ADMIN",
    });

    expect(redirect).toBe("/admin");
  });

  it("returns null when no redirect is needed", () => {
    const redirect = resolveAuthRedirect({
      pathname: "/services",
      search: "",
      role: null,
    });

    expect(redirect).toBeNull();
  });
});
