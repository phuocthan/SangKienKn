import { test, expect } from "@playwright/test";
import { crc32 } from "node:zlib";

for (const role of ["teacher", "student"] as const) {
  test(`${role} picks, saves and resets avatar; reload retains choice`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const deepLink = await page.request.get("/account");
    expect(deepLink.status()).toBe(200);
    expect(await deepLink.text()).toContain("GreenEdu");
    await page.goto("/");
    await page
      .getByLabel("Email", { exact: true })
      .fill(
        role === "teacher" ? "giaovien@greenedu.nk" : "hocsinh@greenedu.nk",
      );
    await page.getByLabel("Mật khẩu", { exact: true }).fill("GreenEdu123!");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByRole("button", { name: "Đổi avatar", exact: true }).click();
    const picker = page.getByRole("region", { name: "Avatar của bạn" });
    await expect(picker.locator(".avatar-choice")).toHaveCount(
      role === "student" ? 24 : 40,
    );
    if (role === "student") {
      await expect(
        picker.getByRole("button", { name: "Chibi giáo viên", exact: true }),
      ).toHaveCount(0);
      await expect(
        picker.getByRole("button", { name: "Cô giáo áo dài", exact: true }),
      ).toHaveCount(0);
      const rejected = await page.request.post("/api/auth/avatar", {
        data: { avatarId: "teacher-1" },
      });
      expect(rejected.status()).toBe(403);
    }
    await expect(picker.locator(".avatar-collection h3").first()).toContainText(
      role === "teacher" ? "Chibi giáo viên" : "Chibi học sinh",
    );
    const name = role === "teacher" ? "Cô giáo áo dài" : "Bạn nam khoa học";
    const id = role === "teacher" ? "teacher-1" : "student-4";
    await picker.getByRole("button", { name, exact: true }).click();
    await expect(
      picker.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await picker
      .getByRole("button", { name: "Lưu avatar", exact: true })
      .click();
    await expect(picker.getByRole("status")).toContainText(
      "Đã cập nhật avatar",
    );
    await expect(page.locator(".profile .avatar")).toHaveClass(/avatar-art/);
    expect(
      (await (await page.request.get("/api/auth/me")).json()).avatarId,
    ).toBe(id);
    const asset = role === "teacher" ? "teachers" : "students";
    expect(
      (await page.request.get(`/assets/avatars-${asset}-v1.png`)).ok(),
    ).toBeTruthy();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        ["teachers", "students", "nature"].map(
          (group) =>
            new Promise<void>((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve();
              image.onerror = reject;
              image.src = `/assets/avatars-${group}-v1.png`;
            }),
        ),
      );
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `.local/ui-${info.project.name}-avatars-${role}.png`,
      fullPage: true,
    });
    await page.reload();
    await page.getByRole("button", { name: "Đổi avatar", exact: true }).click();
    await expect(
      picker.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await picker
      .getByRole("button", { name: "Mầm, chồi & cây", exact: true })
      .click();
    await expect(picker.locator(".avatar-choice")).toHaveCount(16);
    const natureName =
      role === "teacher" ? "Mầm xanh hai lá" : "Hạt sồi nảy mầm";
    const natureId = role === "teacher" ? "nature-2" : "nature-16";
    await picker.getByRole("button", { name: natureName, exact: true }).click();
    await expect(picker.locator(".avatar-preview strong")).toHaveText(
      natureName,
    );
    await picker
      .getByRole("button", { name: "Lưu avatar", exact: true })
      .click();
    await expect(picker.getByRole("status")).toContainText(
      "Đã cập nhật avatar",
    );
    expect(
      (await (await page.request.get("/api/auth/me")).json()).avatarId,
    ).toBe(natureId);
    await expect(page.locator(".profile .avatar")).toHaveCSS(
      "background-image",
      /avatars-nature-v1\.png/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `.local/ui-${info.project.name}-avatars-nature-${role}.png`,
      fullPage: true,
    });
    await page.reload();
    await page.getByRole("button", { name: "Đổi avatar", exact: true }).click();
    await expect(
      picker.getByRole("button", { name: natureName, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const mime = role === "teacher" ? "image/png" : "image/jpeg";
    let photo = await page.screenshot({
      type: role === "teacher" ? "png" : "jpeg",
    });
    if (role === "teacher") {
      // A valid PNG between the old 2 MB and new 3 MB limits must pass the UI.
      const chunk = Buffer.alloc(2.5 * 1024 * 1024 - photo.length, 120);
      chunk.writeUInt32BE(chunk.length - 12, 0);
      chunk.write("tEXt", 4, "ascii");
      chunk.write("note\0", 8, "ascii");
      chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
      photo = Buffer.concat([
        photo.subarray(0, -12),
        chunk,
        photo.subarray(-12),
      ]);
    }
    await picker.getByLabel("Chọn ảnh avatar").setInputFiles({
      name: role === "teacher" ? "avatar.png" : "avatar.jpg",
      mimeType: mime,
      buffer: photo,
    });
    await expect(picker.locator(".avatar-preview strong")).toHaveText(
      "Ảnh bạn tải lên",
    );
    await expect(picker.locator(".avatar-preview .avatar")).toHaveCSS(
      "background-image",
      /data:image/,
    );
    await picker
      .getByRole("button", { name: "Lưu avatar", exact: true })
      .click();
    await expect(picker.getByRole("status")).toContainText(
      "Đã cập nhật avatar",
    );
    const uploaded = (await (await page.request.get("/api/auth/me")).json())
      .avatarId;
    expect(uploaded).toMatch(/^upload-/);
    const imageResponse = await page.request.get(`/api/avatars/${uploaded}`);
    expect(imageResponse.ok()).toBeTruthy();
    expect(await imageResponse.body()).toEqual(photo);
    await page.reload();
    await page.getByRole("button", { name: "Đổi avatar", exact: true }).click();
    await expect(picker.locator(".avatar-preview strong")).toHaveText(
      "Ảnh cá nhân",
    );
    await picker.getByLabel("Chọn ảnh avatar").setInputFiles({
      name: "invalid.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
    await expect(picker.getByRole("alert")).toContainText("JPG, PNG hoặc WebP");
    await expect(picker.locator(".avatar-preview strong")).toHaveText(
      "Ảnh cá nhân",
    );
    await picker
      .getByRole("button", { name: "Mầm, chồi & cây", exact: true })
      .click();
    await picker.getByRole("button", { name: natureName, exact: true }).click();
    await picker
      .getByRole("button", { name: "Lưu avatar", exact: true })
      .click();
    await expect(picker.getByRole("status")).toContainText(
      "Đã cập nhật avatar",
    );
    await picker
      .getByRole("button", { name: "Dùng ảnh đã tải", exact: true })
      .click();
    await picker
      .getByRole("button", { name: "Lưu avatar", exact: true })
      .click();
    await expect(picker.getByRole("status")).toContainText(
      "Đã cập nhật avatar",
    );
    expect(
      (await (await page.request.get("/api/auth/me")).json()).avatarId,
    ).toBe(uploaded);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `.local/ui-${info.project.name}-avatar-upload-${role}.png`,
      fullPage: true,
    });
    await picker.getByRole("button", { name: "Dùng chữ viết tắt" }).click();
    await picker
      .getByRole("button", { name: "Lưu avatar", exact: true })
      .click();
    await expect(picker.getByRole("status")).toContainText(
      "Đã cập nhật avatar",
    );
    expect(
      (await (await page.request.get("/api/auth/me")).json()).avatarId,
    ).toBeNull();
    expect(errors).toEqual([]);
  });
}
