import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { App } from "./App";
import { PROGRESS_STORAGE_KEY } from "./features/vocabulary/storage";
import { LOAD_FAILED_WARNING, SAVE_FAILED_WARNING } from "./features/vocabulary/storageWarning";
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

/** localStorage からの読み出しを失敗させる。戻り値は getItem のスパイ。 */
function breakLoading(): MockInstance<(key: string) => string | null> {
  return vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("読み出しできません");
  });
}

/** localStorage の中身をそのまま（生の文字列のまま）写し取る。 */
function snapshotStorage(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key === null) continue;
    const value = localStorage.getItem(key);
    if (value === null) continue;
    snapshot[key] = value;
  }
  return snapshot;
}

/** 既存の学習記録を localStorage に直接書き込み、その生の文字列を返す。 */
function seedStoredProgress(progress: Record<string, unknown>): string {
  const raw = JSON.stringify(progress);
  localStorage.setItem(PROGRESS_STORAGE_KEY, raw);
  return raw;
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

  it("起動時に読み出しが失敗すると、読み込めなかった旨の警告を表示する", () => {
    breakLoading();

    render(<App />);

    const alert = screen.getByRole("alert");
    expect(alert).toBe(screen.getByTestId("storage-warning"));
    expect(alert.textContent).toBe("学習記録を読み込めなかったため、この回は保存されません。");
    expect(alert.textContent).toBe(LOAD_FAILED_WARNING);
    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 0 / 不正解 0");
  });

  it("読み出しに失敗した起動では、保存失敗の文言を表示しない", () => {
    breakLoading();

    render(<App />);

    expect(screen.getByTestId("storage-warning")).not.toHaveTextContent(
      "学習記録を保存できませんでした",
    );
  });

  it("保存に失敗した場合は、保存できなかった旨の従来の文言を表示する", async () => {
    breakSaving();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    const alert = screen.getByRole("alert");
    expect(alert).toBe(screen.getByTestId("storage-warning"));
    expect(alert).toHaveTextContent("学習記録を保存できませんでした");
    expect(alert.textContent).toBe(SAVE_FAILED_WARNING);
    expect(alert).not.toHaveTextContent("学習記録を読み込めなかったため");
  });

  it("読み出し失敗時と保存失敗時に画面へ出る文言は互いに異なる", async () => {
    breakLoading();
    const loadFailed = render(<App />);
    const loadFailedText = screen.getByTestId("storage-warning").textContent;
    loadFailed.unmount();
    vi.restoreAllMocks();

    breakSaving();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "わかる" }));
    const saveFailedText = screen.getByTestId("storage-warning").textContent;

    expect(loadFailedText).toBeTruthy();
    expect(saveFailedText).toBeTruthy();
    expect(loadFailedText).not.toBe(saveFailedText);
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

  it("読み出しに失敗した起動で「わかる」を押しても localStorage の内容が変化しない", async () => {
    seedStoredProgress({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
    });
    const before = snapshotStorage();
    breakLoading();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    vi.restoreAllMocks();
    expect(snapshotStorage()).toEqual(before);
  });

  it("読み出しに失敗した起動で「わからない」を押しても localStorage の内容が変化しない", async () => {
    seedStoredProgress({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
    });
    const before = snapshotStorage();
    breakLoading();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わからない" }));

    vi.restoreAllMocks();
    expect(snapshotStorage()).toEqual(before);
  });

  it("読み出しに失敗した起動でも回答を続けられ、次の単語に進める", async () => {
    breakLoading();
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: words[0].fr })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "わかる" }));
    expect(screen.getByRole("heading", { name: words[1].fr })).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: "わからない" });
    expect(nextButton).toBeEnabled();
    await user.click(nextButton);

    expect(screen.getByRole("heading", { name: words[2].fr })).toBeInTheDocument();
    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 1 / 不正解 1");
  });

  it("読み出しに失敗した起動では、回答しても警告が消えない", async () => {
    breakLoading();
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId("storage-warning")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "わかる" }));
    expect(screen.getByTestId("storage-warning")).toHaveTextContent(
      "学習記録を読み込めなかったため、この回は保存されません。",
    );
    expect(screen.getByRole("alert")).toBe(screen.getByTestId("storage-warning"));

    await user.click(screen.getByRole("button", { name: "わからない" }));
    expect(screen.getByTestId("storage-warning")).toHaveTextContent(
      "学習記録を読み込めなかったため、この回は保存されません。",
    );
    expect(screen.getByRole("alert")).toBe(screen.getByTestId("storage-warning"));
  });

  it("読み出しに失敗した起動で答えたあと、読み出せる状態で開き直すと元の記録が残っている", async () => {
    const before = seedStoredProgress({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
    });
    breakLoading();
    const user = userEvent.setup();
    const first = render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));
    await user.click(screen.getByRole("button", { name: "わからない" }));
    await user.click(screen.getByRole("button", { name: "わかる" }));
    first.unmount();

    vi.restoreAllMocks();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).toBe(before);

    render(<App />);

    expect(screen.getByTestId("total-score")).toHaveTextContent("累計 正解 3 / 不正解 2");
    expect(storedProgress()).toEqual({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
    });
  });

  it("読み出しに成功した起動では、既存の記録に回答が足されて localStorage に保存される", async () => {
    seedStoredProgress({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(storedProgress()).toEqual({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
      [words[1].id]: { wordId: words[1].id, correct: 1, incorrect: 0 },
    });
    expect(screen.queryByTestId("storage-warning")).not.toBeInTheDocument();
  });

  it("読み出しに失敗した起動では localStorage への書き込みが一度も行われない", async () => {
    seedStoredProgress({
      [words[0].id]: { wordId: words[0].id, correct: 3, incorrect: 2 },
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const getItem = breakLoading();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "わかる" }));
    await user.click(screen.getByRole("button", { name: "わからない" }));

    expect(setItem).not.toHaveBeenCalled();
    // 画面は起動時の読み出し結果だけで判断し、回答のたびに localStorage を読み直さない。
    expect(getItem).toHaveBeenCalledTimes(1);
  });
});
