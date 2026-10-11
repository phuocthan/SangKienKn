import { test } from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { readHiddenPassword } from "./cli-input.js";

function terminal() {
  const input = Object.assign(new PassThrough(), {
    isRaw: false,
    setRawMode(enabled: boolean) {
      this.isRaw = enabled;
    },
  });
  const output = new PassThrough();
  let printed = "";
  output.on("data", (value) => {
    printed += value.toString();
  });
  return { input, output, printed: () => printed };
}

test("password prompt masks pasted Unicode text, handles backspace and restores terminal", async () => {
  const t = terminal();
  const password = readHiddenPassword("Password: ", t.input, t.output);
  assert.equal(t.input.isRaw, true);
  t.input.write("TạmPass🔒X\x7f!\r");
  assert.equal(await password, "TạmPass🔒!");
  assert.match(t.printed(), /^Password: \*+/);
  assert.equal(t.printed().includes("TạmPass"), false);
  assert.equal(t.printed().includes("🔒"), false);
  assert.equal(t.input.isRaw, false);
  assert.equal(t.input.listenerCount("keypress"), 0);
});

test("password prompt Ctrl+C cancels without resolving a secret or leaving raw mode enabled", async () => {
  const t = terminal();
  const password = readHiddenPassword("Password: ", t.input, t.output);
  t.input.write("Secret123!\x03");
  await assert.rejects(password, /Đã hủy/);
  assert.equal(t.printed().includes("Secret123!"), false);
  assert.equal(t.input.isRaw, false);
  assert.equal(t.input.listenerCount("keypress"), 0);
});
