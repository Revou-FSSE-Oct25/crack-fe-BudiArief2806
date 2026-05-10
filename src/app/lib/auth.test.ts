import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearSession, getRole, getToken, getUser, saveSession } from "./auth";

describe("auth helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "diabstrok_token=; Max-Age=0; Path=/";
    document.cookie = "diabstrok_role=; Max-Age=0; Path=/";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves session to localStorage and cookies", () => {
    saveSession({
      token: "token-123",
      role: "admin",
      user: {
        id: "u1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },
    });

    expect(localStorage.getItem("crack_token")).toBe("token-123");
    expect(localStorage.getItem("crack_role")).toBe("admin");
    expect(getToken()).toBe("token-123");
    expect(getRole()).toBe("admin");
    expect(getUser()).toEqual({
      id: "u1",
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      doctorId: undefined,
    });
  });

  it("clears session from localStorage and cookies", () => {
    saveSession({
      token: "token-123",
      role: "doctor",
      user: {
        id: "u2",
        name: "Doctor",
        email: "doctor@example.com",
        role: "doctor",
        doctorId: "d1",
      },
    });

    clearSession();

    expect(localStorage.getItem("crack_token")).toBeNull();
    expect(localStorage.getItem("crack_role")).toBeNull();
    expect(localStorage.getItem("crack_user")).toBeNull();
    expect(getToken()).toBeNull();
    expect(getRole()).toBeNull();
  });

  it("reads token and role from cookies when localStorage is empty", () => {
    document.cookie = "diabstrok_token=cookie-token; Path=/";
    document.cookie = "diabstrok_role=user; Path=/";

    expect(getToken()).toBe("cookie-token");
    expect(getRole()).toBe("user");
  });

  it("returns null for invalid role or malformed user payload", () => {
    localStorage.setItem("crack_role", "guest");
    localStorage.setItem("crack_user", "not-json");

    expect(getRole()).toBeNull();
    expect(getUser()).toBeNull();

    localStorage.setItem(
      "crack_user",
      JSON.stringify({
        id: "u3",
        name: "Broken User",
        email: "broken@example.com",
        role: "guest",
      }),
    );

    expect(getUser()).toBeNull();
  });

  it("keeps optional doctorId when user payload is valid", () => {
    localStorage.setItem("crack_role", "doctor");
    localStorage.setItem(
      "crack_user",
      JSON.stringify({
        id: "u4",
        name: "dr. Siti",
        email: "siti@example.com",
        role: "doctor",
        doctorId: "d2",
      }),
    );

    expect(getUser()).toEqual({
      id: "u4",
      name: "dr. Siti",
      email: "siti@example.com",
      role: "doctor",
      doctorId: "d2",
    });
  });
});
