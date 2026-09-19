import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { PROGRESS_STORAGE_KEY } from "./features/vocabulary/storage";
import { words } from "./features/vocabulary/words";

function storedProgress(): unknown {
  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (raw === null) return null;
  return JSON.parse(raw);
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
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
});
