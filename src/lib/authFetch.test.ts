import { describe, it, expect, vi, beforeEach } from "vitest";

const MOCK_ANON_KEY = "test-anon-key-123";

// Mock import.meta.env
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", MOCK_ANON_KEY);
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");

// Use vi.hoisted so the mock fn is available when vi.mock factory runs
const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

// Mock the supabase client module
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

// Import after mocks are set up
import { getAuthHeader } from "./authFetch";

describe("getAuthHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Bearer + JWT token when user is authenticated", async () => {
    const fakeJwt = "eyJhbGciOiJIUzI1NiJ9.test-jwt-token";
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: fakeJwt } },
      error: null,
    });

    const header = await getAuthHeader();

    expect(header).toBe(`Bearer ${fakeJwt}`);
    expect(mockGetSession).toHaveBeenCalledOnce();
  });

  it("returns Bearer + anon key when session is null (unauthenticated)", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const header = await getAuthHeader();

    expect(header).toBe(`Bearer ${MOCK_ANON_KEY}`);
    expect(mockGetSession).toHaveBeenCalledOnce();
  });

  it("returns Bearer + anon key when getSession throws (errored state)", async () => {
    mockGetSession.mockRejectedValue(new Error("Network failure"));

    const header = await getAuthHeader();

    expect(header).toBe(`Bearer ${MOCK_ANON_KEY}`);
    expect(mockGetSession).toHaveBeenCalledOnce();
  });

  it("does not throw regardless of session state", async () => {
    mockGetSession.mockRejectedValue(new Error("Unexpected error"));

    await expect(getAuthHeader()).resolves.not.toThrow();
  });

  it("returns Bearer + anon key when data is undefined", async () => {
    mockGetSession.mockResolvedValue({
      data: undefined,
      error: null,
    });

    const header = await getAuthHeader();

    expect(header).toBe(`Bearer ${MOCK_ANON_KEY}`);
  });
});
