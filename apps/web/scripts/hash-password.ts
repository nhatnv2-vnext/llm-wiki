#!/usr/bin/env tsx
/**
 * Sinh bcrypt hash cho mật khẩu, để khai báo user trong AUTH_USERS (.env.local).
 *
 * Dùng:
 *   cd apps/web && npm run hash-password -- 'matkhau' ban@example.com
 *   # hoặc nhập tương tác:
 *   cd apps/web && npm run hash-password
 *
 * In ra dòng `email:hash` để dán vào AUTH_USERS (nối nhiều user bằng dấu phẩy).
 */
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import bcrypt from "bcryptjs";

const ROUNDS = 10;

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  if (hidden) {
    // Ẩn ký tự khi gõ mật khẩu.
    const orig = (rl as unknown as { _writeToOutput: (s: string) => void })
      ._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
      function (s: string) {
        if (s.includes("\n")) orig.call(rl, s);
      };
    void orig;
  }
  const answer = await rl.question(question);
  rl.close();
  if (hidden) stdout.write("\n");
  return answer.trim();
}

async function main() {
  const [argPassword, argEmail] = process.argv.slice(2);

  const password = argPassword || (await prompt("Mật khẩu: ", true));
  if (!password) {
    console.error("❌ Mật khẩu trống.");
    process.exit(1);
  }

  const email = argEmail || (await prompt("Email: "));
  const hash = await bcrypt.hash(password, ROUNDS);

  console.log("\n✅ Thêm dòng sau vào AUTH_USERS trong .env.local:\n");
  if (email) {
    console.log(`${email.toLowerCase()}:${hash}`);
  } else {
    console.log(`<email>:${hash}`);
  }
  console.log(
    "\n(Nhiều user: nối các cặp email:hash bằng dấu phẩy trong AUTH_USERS.)",
  );
}

main();
