jest.unmock("@/lib/server/auth");

import { getInitialPendingSignup, verifyJwtToken } from "@/lib/server/auth";

const mockCreateRemoteJWKSet = jest.fn();
const mockJwtVerify = jest.fn();
const mockCookies = jest.fn();

jest.mock("jose", () => ({
  createRemoteJWKSet: (...args: unknown[]) => mockCreateRemoteJWKSet(...args),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

jest.mock("next/headers", () => ({
  cookies: (...args: unknown[]) => mockCookies(...args),
}));

jest.mock("@/utils/server/logger", () => ({
  createLogger: jest.fn().mockReturnValue({ error: jest.fn() }),
}));

describe("server auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateRemoteJWKSet.mockReturnValue(jest.fn());
  });

  it("returns a verified JWT payload", async () => {
    const payload = { email: "person@example.edu", sub: "user-1" };
    mockJwtVerify.mockResolvedValue({ payload });

    await expect(verifyJwtToken("valid-token")).resolves.toEqual(payload);
    expect(mockJwtVerify).toHaveBeenCalledWith(
      "valid-token",
      expect.any(Function),
      expect.objectContaining({ algorithms: ["RS256"] })
    );
  });

  it("returns null when JWT verification fails", async () => {
    const error = new Error("invalid token");
    mockJwtVerify.mockRejectedValue(error);
    await expect(verifyJwtToken("invalid-token")).resolves.toBeNull();
  });

  it("returns undefined when no pending SSO token cookie exists", async () => {
    mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) });

    await expect(getInitialPendingSignup()).resolves.toBeUndefined();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it("returns valid pending SSO signup fields from a verified token", async () => {
    mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue({ value: "pending-token" }) });
    mockJwtVerify.mockResolvedValue({
      payload: {
        email: "jane@example.edu",
        affiliationId: "example-affiliation",
        affiliation: "Example University",
        givenName: "Jane",
        surName: "Doe",
      },
    });

    await expect(getInitialPendingSignup()).resolves.toEqual({
      email: "jane@example.edu",
      affiliationId: "example-affiliation",
      affiliation: "Example University",
      givenName: "Jane",
      surName: "Doe",
    });
  });

  it("ignores a verified token payload without an email address", async () => {
    mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue({ value: "pending-token" }) });
    mockJwtVerify.mockResolvedValue({ payload: { email: 123 } });

    await expect(getInitialPendingSignup()).resolves.toBeUndefined();
  });
});
