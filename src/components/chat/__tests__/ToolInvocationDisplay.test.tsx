import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationDisplay, getToolLabel } from "../ToolInvocationDisplay";

// getToolLabel unit tests

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })).toBe("Creating Card.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/components/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/App.tsx" })).toBe("Inserting into App.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.ts" })).toBe("Reading index.ts");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/utils.ts" })).toBe("Reverting changes in utils.ts");
});

test("getToolLabel: str_replace_editor unknown command falls back to editing", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown", path: "src/foo.ts" })).toBe("Editing foo.ts");
});

test("getToolLabel: str_replace_editor no path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating ");
});

test("getToolLabel: file_manager rename with new_path", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" })).toBe("Renaming Old.tsx to New.tsx");
});

test("getToolLabel: file_manager rename without new_path", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "src/Old.tsx" })).toBe("Renaming Old.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/Unused.tsx" })).toBe("Deleting Unused.tsx");
});

test("getToolLabel: unknown tool falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { path: "src/foo.ts" })).toBe("some_other_tool");
});

// ToolInvocationDisplay rendering tests

test("shows label and green dot when done", () => {
  render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/Card.tsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
  // green dot present (no spinner text)
  expect(screen.queryByText("animate-spin")).toBeNull();
});

test("shows label and spinner when not done", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/Button.tsx" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
  // spinner svg should be present
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("shows file_manager delete label", () => {
  render(
    <ToolInvocationDisplay
      toolName="file_manager"
      args={{ command: "delete", path: "src/OldComponent.tsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Deleting OldComponent.tsx")).toBeDefined();
});
