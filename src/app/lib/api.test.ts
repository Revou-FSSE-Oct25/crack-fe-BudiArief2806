import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clearSessionMock = vi.fn();
const getTokenMock = vi.fn();

vi.mock("./auth", () => ({
  clearSession: clearSessionMock,
  getToken: getTokenMock,
}));

describe("client api helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    clearSessionMock.mockReset();
    getTokenMock.mockReset();
    getTokenMock.mockReturnValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends login request and parses JSON response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "token",
          tokenType: "Bearer",
          role: "admin",
          user: { id: "u1", name: "Admin", email: "admin@example.com", role: "admin" },
        }),
        { status: 200 },
      ),
    );

    const { api } = await import("./api");
    const result = await api.login({ email: "admin@example.com", password: "secret123" });

    expect(result.accessToken).toBe("token");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/auth/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("appends authorization header and query params when needed", async () => {
    getTokenMock.mockReturnValue("abc-token");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );

    const { api } = await import("./api");
    await api.listRooms({ hospitalId: "thb", doctorId: "d2" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/rooms?hospitalId=thb&doctorId=d2",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer abc-token",
        }),
      }),
    );
  });

  it("clears session on 401 responses", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    const { api } = await import("./api");

    await expect(api.me()).rejects.toEqual({
      message: "Unauthorized",
      status: 401,
    });
    expect(clearSessionMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to plain text message when response is not JSON", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response("Something broke", { status: 500 }));

    const { api } = await import("./api");

    await expect(api.listHospitals()).rejects.toEqual({
      message: "Something broke",
      status: 500,
    });
  });

  it("covers the remaining resource wrappers", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async () =>
      new Response(JSON.stringify({ item: { id: "b1" }, items: [] }), {
        status: 200,
      }),
    );

    const { api } = await import("./api");

    await api.register({ name: "Rina", email: "rina@example.com", password: "secret123" });
    await api.getMyBookings();
    await api.getBookings();
    await api.getBooking("b1");
    await api.updateBookingStatus("b1", { status: "CONFIRMED" });
    await api.deleteBooking("b1");
    await api.createBooking({
      hospitalId: "thb",
      doctorId: "d2",
      roomId: "r1",
      complaint: "Kontrol rutin diabetes",
    });
    await api.createPrescription("b1", {
      stage: "STADIUM_1",
      items: ["Metformin 500mg"],
      notes: "Kontrol 2 minggu",
    });
    await api.submitDoctorReview("b1", {
      symptoms: "Sering haus dan cepat lelah",
      diagnosis: "Diabetes tipe 2",
      estimatedCost: 350000,
      healthAdvice: "Kurangi gula",
      stage: "STADIUM_1",
      items: ["Metformin 500mg"],
      notes: "Kontrol 2 minggu",
    });

    expect(fetchMock).toHaveBeenCalledTimes(9);
  });
});
