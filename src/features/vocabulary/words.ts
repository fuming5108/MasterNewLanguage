import type { Word } from "./types";

/**
 * 日常でよく使う基礎語彙。例文は短く平易な自作の文にしてある。
 * 出題順はこの配列の順序を基準にする（selectNextWord を参照）。
 */
export const words: Word[] = [
  { id: "livre", fr: "livre", ja: "本", exampleFr: "Je lis un livre." },
  { id: "maison", fr: "maison", ja: "家", exampleFr: "Ma maison est petite." },
  { id: "eau", fr: "eau", ja: "水", exampleFr: "Je bois de l'eau." },
  { id: "pain", fr: "pain", ja: "パン", exampleFr: "J'achète du pain." },
  { id: "ami", fr: "ami", ja: "友達", exampleFr: "Mon ami arrive demain." },
  { id: "ville", fr: "ville", ja: "町", exampleFr: "Cette ville est calme." },
  { id: "temps", fr: "temps", ja: "時間", exampleFr: "Je n'ai pas le temps." },
  { id: "matin", fr: "matin", ja: "朝", exampleFr: "Je travaille le matin." },
  { id: "nuit", fr: "nuit", ja: "夜", exampleFr: "La nuit est longue." },
  { id: "porte", fr: "porte", ja: "扉", exampleFr: "La porte est ouverte." },
  { id: "chemin", fr: "chemin", ja: "道", exampleFr: "Le chemin est long." },
  { id: "travail", fr: "travail", ja: "仕事", exampleFr: "Mon travail commence tôt." },
  { id: "enfant", fr: "enfant", ja: "子供", exampleFr: "L'enfant dort déjà." },
  { id: "manger", fr: "manger", ja: "食べる", exampleFr: "Nous mangeons à midi." },
  { id: "boire", fr: "boire", ja: "飲む", exampleFr: "Il boit du café." },
  { id: "parler", fr: "parler", ja: "話す", exampleFr: "Je parle avec ma mère." },
  { id: "ecrire", fr: "écrire", ja: "書く", exampleFr: "Elle écrit une lettre." },
  { id: "lire", fr: "lire", ja: "読む", exampleFr: "Je lis chaque soir." },
  { id: "voir", fr: "voir", ja: "見る", exampleFr: "Je vois la mer." },
  { id: "aller", fr: "aller", ja: "行く", exampleFr: "Nous allons au marché." },
  { id: "venir", fr: "venir", ja: "来る", exampleFr: "Tu viens avec moi." },
  { id: "prendre", fr: "prendre", ja: "取る", exampleFr: "Je prends le train." },
  { id: "donner", fr: "donner", ja: "与える", exampleFr: "Il donne un cadeau." },
  { id: "grand", fr: "grand", ja: "大きい", exampleFr: "Ce sac est grand." },
  { id: "petit", fr: "petit", ja: "小さい", exampleFr: "Le chat est petit." },
  { id: "nouveau", fr: "nouveau", ja: "新しい", exampleFr: "Voici mon nouveau vélo." },
  { id: "facile", fr: "facile", ja: "やさしい", exampleFr: "Cet exercice est facile." },
  { id: "content", fr: "content", ja: "うれしい", exampleFr: "Je suis content aujourd'hui." },
  { id: "fatigue", fr: "fatigué", ja: "疲れた", exampleFr: "Je suis fatigué ce soir." },
  { id: "toujours", fr: "toujours", ja: "いつも", exampleFr: "Elle arrive toujours tôt." },
];
