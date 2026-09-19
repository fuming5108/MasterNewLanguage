import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { emptyProgress, recordAnswer } from "./progress";
import type { AnswerResult, Word, WordProgress } from "./types";
import { WordCard } from "./WordCard";

const word: Word = {
  id: "livre",
  fr: "livre",
  ja: "本",
  exampleFr: "Je lis un livre.",
};

/** 親が学習記録を持つ実際の使われ方を再現する検証用ラッパー。 */
function ControlledWordCard({ onAnswer }: { onAnswer?: (result: AnswerResult) => void }) {
  const [progress, setProgress] = useState<WordProgress>(() => emptyProgress(word.id));

  return (
    <WordCard
      word={word}
      progress={progress}
      onAnswer={(result) => {
        setProgress((current) => recordAnswer(current, result));
        onAnswer?.(result);
      }}
    />
  );
}

describe("WordCard", () => {
  it("単語を表示し、意味は最初は隠れている", () => {
    render(<WordCard word={word} progress={emptyProgress(word.id)} onAnswer={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "livre" })).toBeInTheDocument();
    expect(screen.queryByTestId("meaning")).not.toBeInTheDocument();
  });

  it("「意味を見る」で語義と例文が表示される", async () => {
    const user = userEvent.setup();
    render(<WordCard word={word} progress={emptyProgress(word.id)} onAnswer={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "意味を見る" }));

    expect(screen.getByTestId("meaning")).toHaveTextContent("本");
    expect(screen.getByTestId("example")).toHaveTextContent("Je lis un livre.");
  });

  it("「わかる」を押すと正解が記録され、onAnswer が呼ばれる", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<ControlledWordCard onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: "わかる" }));

    expect(screen.getByTestId("score")).toHaveTextContent("正解 1 / 不正解 0");
    expect(onAnswer).toHaveBeenCalledWith("correct");
  });

  it("「わからない」を押すと不正解が記録される", async () => {
    const user = userEvent.setup();
    render(<ControlledWordCard />);

    await user.click(screen.getByRole("button", { name: "わからない" }));

    expect(screen.getByTestId("score")).toHaveTextContent("正解 0 / 不正解 1");
  });

  it("渡された学習記録をそのまま表示する", () => {
    render(
      <WordCard
        word={word}
        progress={{ wordId: word.id, correct: 4, incorrect: 2 }}
        onAnswer={vi.fn()}
      />,
    );

    expect(screen.getByTestId("score")).toHaveTextContent("正解 4 / 不正解 2");
  });
});
