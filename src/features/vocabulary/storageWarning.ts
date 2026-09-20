/**
 * 保存状況から、画面に出す警告文言を決める純粋関数。
 * 「保存を試みて失敗した」場合と「そもそも保存しない（読み出しに失敗した）」場合は
 * 利用者にとって別の出来事なので、文言も分ける。
 */

/** 警告の種類。UI はこの値を直接組み立てず、storageWarningFor の結果だけを使う。 */
export type StorageWarningKind = "load-failed" | "save-failed";

/** 起動時の読み出しに失敗し、その回は保存を試みてすらいない場合の文言。 */
export const LOAD_FAILED_WARNING = "学習記録を読み込めなかったため、この回は保存されません。";

/** 保存を試みて失敗した場合の文言。 */
export const SAVE_FAILED_WARNING =
  "学習記録を保存できませんでした。このブラウザでは記録が残らないため、" +
  "ページを閉じたり再読み込みしたりすると学習内容が失われます。";

/** 警告の判断に必要な保存状況。UI の状態そのものではなく、storage 層の結果から作る。 */
export type StorageStatus = {
  /** この起動で保存してよいか（起動時の読み出しに成功したか）。 */
  readonly savingAllowed: boolean;
  /** 直近の読み書きが成功しているか。 */
  readonly persisted: boolean;
};

/** 表示すべき警告の種類。警告が不要なら undefined。 */
export function storageWarningKindFor(status: StorageStatus): StorageWarningKind | undefined {
  if (!status.savingAllowed) return "load-failed";
  if (!status.persisted) return "save-failed";
  return undefined;
}

/** 警告文言。警告が不要なら undefined。 */
export function storageWarningFor(status: StorageStatus): string | undefined {
  const kind = storageWarningKindFor(status);
  if (kind === undefined) return undefined;
  return kind === "load-failed" ? LOAD_FAILED_WARNING : SAVE_FAILED_WARNING;
}
