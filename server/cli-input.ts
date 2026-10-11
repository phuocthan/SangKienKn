import { emitKeypressEvents, type Key } from "node:readline";

type PasswordInput = NodeJS.ReadableStream & {
  setRawMode: (enabled: boolean) => unknown;
  isRaw?: boolean;
};

// Raw input prevents the terminal from echoing secrets, including pasted text.
export function readHiddenPassword(
  prompt: string,
  input: PasswordInput = process.stdin,
  output: NodeJS.WritableStream = process.stdout,
): Promise<string> {
  const wasRaw = !!input.isRaw;
  return new Promise((resolve, reject) => {
    const characters: string[] = [];
    function finish(error?: Error) {
      input.removeListener("keypress", keypress);
      input.removeListener("end", cancelled);
      input.removeListener("error", finish);
      input.setRawMode(wasRaw);
      input.pause();
      output.write("\n");
      if (error) reject(error);
      else resolve(characters.join(""));
    }
    function cancelled() {
      finish(new Error("Đã hủy tạo Admin."));
    }
    function keypress(value: string | undefined, key: Key) {
      if (key.ctrl && (key.name === "c" || key.name === "d"))
        return cancelled();
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") {
        if (characters.length) {
          characters.pop();
          output.write("\b \b");
        }
        return;
      }
      if (!value || key.ctrl || key.meta || /[\x00-\x1f\x7f]/.test(value))
        return;
      for (const character of value) {
        characters.push(character);
        output.write("*");
      }
    }
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.on("keypress", keypress);
    input.once("end", cancelled);
    input.once("error", finish);
    output.write(prompt);
    input.resume();
  });
}
