import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../extension/src/App";

const state = vi.hoisted(() => ({ snippets: [{ id: "one", title: "Alpha", content: "Hello\nWORLD", category: "Code", createdAt: 1, updatedAt: 2 }, { id: "two", title: "Beta", content: "Other", category: "Work", createdAt: 1, updatedAt: 1 }], create: vi.fn(), update: vi.fn(), remove: vi.fn(), copy: vi.fn() }));
vi.mock("../../extension/src/hooks/useSnippets", () => ({ useSnippets: () => ({ snippets: state.snippets, loading: false, loadError: null, usage: null, usageError: false, create: state.create, update: state.update, remove: state.remove }) }));
vi.mock("../../extension/src/services/clipboard", () => ({ copyText: state.copy }));
beforeEach(() => { vi.clearAllMocks(); state.copy.mockResolvedValue(undefined); HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);
describe("SnipVault keyboard and interaction rules", () => {
  it("searches titles and full content case-insensitively locally", () => {
    render(<App />); fireEvent.change(screen.getByRole("textbox", { name: "Search snippets" }), { target: { value: "world" } });
    expect(screen.getByRole("article", { name: "Alpha" })).toBeInTheDocument(); expect(screen.queryByRole("article", { name: "Beta" })).toBeNull();
  });
  it.each([false, true])("Ctrl/Cmd K focuses search, N opens add, and Enter saves multiline content (meta=%s)", async (meta) => {
    render(<App />); const modifier = meta ? { metaKey: true } : { ctrlKey: true };
    fireEvent.keyDown(document.body, { key: "k", ...modifier }); expect(screen.getByRole("textbox", { name: "Search snippets" })).toHaveFocus();
    fireEvent.keyDown(document.body, { key: "n", ...modifier });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New title" } });
    fireEvent.change(screen.getByLabelText("Content"), { target: { value: "one\ntwo" } });
    fireEvent.keyDown(screen.getByLabelText("Content"), { key: "Enter", ...modifier });
    await waitFor(() => expect(state.create).toHaveBeenCalledWith({ title: "New title", content: "one\ntwo", category: "General" }));
  });
  it("arrows select filtered snippets and Enter copies complete line breaks", async () => {
    render(<App />); const search = screen.getByRole("textbox", { name: "Search snippets" });
    fireEvent.keyDown(search, { key: "ArrowDown" }); expect(screen.getByRole("article", { name: "Alpha" })).toHaveAttribute("aria-current", "true");
    fireEvent.keyDown(search, { key: "ArrowDown" }); expect(screen.getByRole("article", { name: "Beta" })).toHaveAttribute("aria-current", "true");
    fireEvent.keyDown(search, { key: "ArrowUp" }); fireEvent.keyDown(search, { key: "Enter" });
    await waitFor(() => expect(state.copy).toHaveBeenCalledWith("Hello\nWORLD"));
  });
  it("preserves the search query after copying and canceling editing with Escape", async () => {
    render(<App />); const search = screen.getByRole("textbox", { name: "Search snippets" }); fireEvent.change(search, { target: { value: "Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy Alpha" })); await waitFor(() => expect(state.copy).toHaveBeenCalledWith("Hello\nWORLD"));
    fireEvent.click(screen.getByRole("button", { name: "Edit Alpha" }));
    fireEvent.keyDown(screen.getByLabelText("Content"), { key: "n", ctrlKey: true }); expect(screen.getByLabelText("Title")).toHaveValue("Alpha");
    fireEvent.keyDown(screen.getByLabelText("Content"), { key: "Escape" }); expect(screen.queryByRole("dialog")).toBeNull(); expect(search).toHaveValue("Alpha"); expect(state.update).not.toHaveBeenCalled();
  });
  it("does not delete until the user confirms", async () => {
    render(<App />); fireEvent.click(screen.getByRole("button", { name: "Delete Alpha" })); expect(state.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(state.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete Alpha" })); fireEvent.click(screen.getByRole("button", { name: "Delete", exact: true }));
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith("one"));
  });
  it("reports clipboard failure without success feedback", async () => {
    state.copy.mockRejectedValue(new Error("Denied")); render(<App />); fireEvent.click(screen.getByRole("button", { name: "Copy Alpha" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument()); expect(screen.queryByText("Copied")).toBeNull();
  });
});
