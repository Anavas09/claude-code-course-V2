import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --- signIn ---

test("signIn returns result and navigates to existing project when no anon work", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "proj-1" }]);

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("a@b.com", "password123");
  });

  expect(signInAction).toHaveBeenCalledWith("a@b.com", "password123");
  expect(returnValue).toEqual({ success: true });
  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});

test("signIn creates new project when no anon work and no existing projects", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "new-proj" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("a@b.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/new-proj");
});

test("signIn saves anon work as a project and navigates to it", async () => {
  const anonWork = {
    messages: [{ role: "user", content: "hello" }],
    fileSystemData: { "/": { type: "directory" } },
  };
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(anonWork);
  (createProject as any).mockResolvedValue({ id: "anon-proj" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("a@b.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: anonWork.messages,
      data: anonWork.fileSystemData,
    })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(getProjects).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/anon-proj");
});

test("signIn does not navigate when sign-in fails", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("a@b.com", "wrong");
  });

  expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  expect(mockPush).not.toHaveBeenCalled();
  expect(getProjects).not.toHaveBeenCalled();
  expect(createProject).not.toHaveBeenCalled();
});

test("signIn resets isLoading to false after success", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "p1" }]);

  const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(false);

  await act(async () => {
    await result.current.signIn("a@b.com", "password123");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signIn resets isLoading to false after failure", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "err" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("a@b.com", "bad");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signIn resets isLoading even when action throws", async () => {
  (signInAction as any).mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("a@b.com", "password123").catch(() => {});
  });

  expect(result.current.isLoading).toBe(false);
});

// --- signUp ---

test("signUp returns result and navigates to existing project when no anon work", async () => {
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "proj-2" }]);

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("new@b.com", "password123");
  });

  expect(signUpAction).toHaveBeenCalledWith("new@b.com", "password123");
  expect(returnValue).toEqual({ success: true });
  expect(mockPush).toHaveBeenCalledWith("/proj-2");
});

test("signUp creates new project when no anon work and no existing projects", async () => {
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "brand-new" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@b.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/brand-new");
});

test("signUp saves anon work as a project and clears it", async () => {
  const anonWork = {
    messages: [{ role: "user", content: "hi" }],
    fileSystemData: { "/": { type: "directory" }, "/App.tsx": { type: "file" } },
  };
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(anonWork);
  (createProject as any).mockResolvedValue({ id: "saved-anon" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@b.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: anonWork.messages,
      data: anonWork.fileSystemData,
    })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/saved-anon");
});

test("signUp does not navigate when sign-up fails", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "Email already registered" });

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("a@b.com", "password123");
  });

  expect(returnValue).toEqual({ success: false, error: "Email already registered" });
  expect(mockPush).not.toHaveBeenCalled();
});

test("signUp resets isLoading to false after failure", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "err" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("a@b.com", "pass");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signUp resets isLoading even when action throws", async () => {
  (signUpAction as any).mockRejectedValue(new Error("Server error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("a@b.com", "password123").catch(() => {});
  });

  expect(result.current.isLoading).toBe(false);
});

// --- anon work edge cases ---

test("anon work with empty messages array is ignored", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue({ messages: [], fileSystemData: {} });
  (getProjects as any).mockResolvedValue([{ id: "p1" }]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("a@b.com", "password123");
  });

  // Should fall through to getProjects, not create anon project
  expect(getProjects).toHaveBeenCalled();
  expect(clearAnonWork).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/p1");
});

// --- isLoading state ---

test("isLoading is false initially", () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);
});

test("hook exposes signIn, signUp, and isLoading", () => {
  const { result } = renderHook(() => useAuth());
  expect(typeof result.current.signIn).toBe("function");
  expect(typeof result.current.signUp).toBe("function");
  expect(typeof result.current.isLoading).toBe("boolean");
});
