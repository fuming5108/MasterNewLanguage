import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { PROGRESS_STORAGE_KEY } from "./features/vocabulary/storage";
import { words } from "./features/vocabulary/words";

/** localStorage への保存を失敗させる。戻り値を呼ぶと保存できる状態に戻る。 */
function breakSaving(): () => void {
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  return () => {
    spy.mockRestore();
  };
}

/** localStorage からの読み出しを失敗させる。 */
function breakLoading(): void {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("読み出しできません");
  });
}

function storedProgress(): unknown {
  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (raw === null) return null;
  return JSON.parse(raw);
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("localStorage が空でもエラーにならず初期状態で起動する", () => {
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();

    expect(() => render(<App />)).not.toThrow();

    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 0 / 不正解 0");
    expect(screen.getByRole("heading", { name: words[0].fr })).toBeInTheDocument();
  });

  it("localStorage に壊れた JSON が入っていてもクラッシュせず初期状態で起動する", () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, "{壊れた JSON");

    expect(() => render(<App />)).not.toThrow();

    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 0 / 不正解 0");
    expect(screen.getByRole("heading", { name: words[0].fr })).toBeInTheDocument();
  });

  it("壊れた JSON のあとでも回答を記録して保存できる", async () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, "]]壊れた[[");
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(storedProgress()).toEqual({
      [words[0].id]: { wordId: words[0].id, correct: 1, incorrect: 0 },
    });
  });

  it("「わかる」を押すとその単語の correct が localStorage に保存される", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(storedProgress()).toEqual({
      [words[0].id]: { wordId: words[0].id, correct: 1, incorrect: 0 },
    });
  });

  it("「わからない」を押すと incorrect が localStorage に保存される", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わからない" }));

    expect(storedProgress()).toEqual({
      [words[0].id]: { wordId: words[0].id, correct: 0, incorrect: 1 },
    });
  });

  it("マウントし直しても保存された正解数・不正解数が復元される", async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));
    await user.click(screen.getByRole("button", { name: "わからない" }));
    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 1 / 不正解 1");

    first.unmount();
    render(<App />);

    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 1 / 不正解 1");
  });

  it("保存済みの記録がある状態で起動すると、その正解数・不正解数から始まる", () => {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
      }),
    );

    render(<App />);

    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 3 / 不正解 2");
  });

  it("学習済みの単語は飛ばし、未学習の単語を出題する", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: words[0].fr })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(screen.getByRole("heading", { name: words[1].fr })).toBeInTheDocument();
    expect(screen.getByTestId("score")).toHaveTextContent("正解 0 / 不正解 0");
  });

  it("マウントし直しても学習済みの単語は再出題されない", async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));
    first.unmount();

    render(<App />);

    expect(screen.getByRole("heading", { name: words[1].fr })).toBeInTheDocument();
  });

  it("保存に成功しているあいだは警告を表示しない", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByTestId("storage-warning")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByTestId("storage-warning")).not.toBeInTheDocument();
  });

  it("保存済みの記録を読み出せた起動時にも警告を表示しない", () => {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
      }),
    );

    render(<App />);

    expect(screen.queryByTestId("storage-warning")).not.toBeInTheDocument();
  });

  it("保存が失敗する状態で「わかる」を押すと保存できていない旨の警告が出る", async () => {
    breakSaving();
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByTestId("storage-warning")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(screen.getByTestId("storage-warning")).toBeInTheDocument();
    expect(screen.getByTestId("storage-warning")).toHaveTextContent("保存できませんでした");
  });

  it('保存できていない警告は role="alert" を持つ', async () => {
    breakSaving();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    const alert = screen.getByRole("alert");
    expect(alert).toBe(screen.getByTestId("storage-warning"));
  });

  it("保存に失敗しても回答を続けられ、次の単語に進める", async () => {
    breakSaving();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(screen.getByTestId("storage-warning")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: words[1].fr })).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: "わからない" });
    expect(nextButton).toBeEnabled();
    await user.click(nextButton);

    expect(screen.getByRole("heading", { name: words[2].fr })).toBeInTheDocument();
    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 1 / 不正解 1");
  });

  it("保存が再び成功すると警告が消える", async () => {
    const restoreSaving = breakSaving();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));
    expect(screen.getByTestId("storage-warning")).toBeInTheDocument();

    restoreSaving();
    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(screen.queryByTestId("storage-warning")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(storedProgress()).toEqual({
      [words[0].id]: { wordId: words[0].id, correct: 1, incorrect: 0 },
      [words[1].id]: { wordId: words[1].id, correct: 1, incorrect: 0 },
    });
  });

  it("起動時に読み出しが失敗すると同じ警告を表示する", () => {
    breakLoading();

    render(<App />);

    const alert = screen.getByRole("alert");
    expect(alert).toBe(screen.getByTestId("storage-warning"));
    expect(alert).toHaveTextContent("保存できませんでした");
    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 0 / 不正解 0");
  });

  it("小数の回数が保存されていると、その単語は初期状態として扱われる", () => {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        [words[0].id]: { wordId: words[0].id, correct: 1.5, incorrect: 0 },
      }),
    );

    render(<App />);

    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 0 / 不正解 0");
    expect(screen.getByRole("heading", { name: words[0].fr })).toBeInTheDocument();
    expect(screen.getByTestId("score")).toHaveTextContent("正解 0 / 不正解 0");
  });
});
