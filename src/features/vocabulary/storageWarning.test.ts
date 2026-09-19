import { describe, expect, it } from "vitest";
import {
  LOAD_FAILED_WARNING,
  SAVE_FAILED_WARNING,
  storageWarningFor,
  storageWarningKindFor,
} from "./storageWarning";

describe("storageWarningFor", () => {
  it("読み書きできている状態では警告を出さない", () => {
    expect(storageWarningFor({ savingAllowed: true, persisted: true })).toBeUndefined();
    expect(storageWarningKindFor({ savingAllowed: true, persisted: true })).toBeUndefined();
  });

  it("読み出しに失敗した起動では、読み込めなかったことを伝える文言を返す", () => {
    const message = storageWarningFor({ savingAllowed: false, persisted: false });

    expect(message).toBe(LOAD_FAILED_WARNING);
    expect(message).toContain("学習記録を読み込めなかったため、この回は保存されません。");
    expect(storageWarningKindFor({ savingAllowed: false, persisted: false })).toBe("load-failed");
  });

  it("保存に失敗した場合は、保存できなかったことを伝える文言を返す", () => {
    const message = storageWarningFor({ savingAllowed: true, persisted: false });

    expect(message).toBe(SAVE_FAILED_WARNING);
    expect(message).toContain("学習記録を保存できませんでした");
    expect(storageWarningKindFor({ savingAllowed: true, persisted: false })).toBe("save-failed");
  });

  it("読み出し失敗の文言と保存失敗の文言は一致しない", () => {
    expect(LOAD_FAILED_WARNING).not.toBe(SAVE_FAILED_WARNING);
    expect(LOAD_FAILED_WARNING).not.toContain("学習記録を保存できませんでした");
    expect(SAVE_FAILED_WARNING).not.toContain("学習記録を読み込めなかったため");
    expect(storageWarningFor({ savingAllowed: false, persisted: false })).not.toBe(
      storageWarningFor({ savingAllowed: true, persisted: false }),
    );
  });
});
