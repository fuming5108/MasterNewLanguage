import { WordCard } from "./features/vocabulary/WordCard";
import { words } from "./features/vocabulary/words";

export function App() {
  const word = words[0];

  return (
    <main>
      <h1>フランス語 語彙トレーニング</h1>
      <WordCard word={word} />
    </main>
  );
}
