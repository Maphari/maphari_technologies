import { expect, test } from "@playwright/test";

test.describe("web auth routing", () => {
  test("redirects anonymous protected access to login with next path", async ({ page }) => {
    await page.goto("/portal?tab=files");
    await expect(page).toHaveURL(/\/login\?next=%2Fportal%3Ftab%3Dfiles/);
  });

  test("redirects CLIENT role away from /login to /portal", async ({ context, page }) => {
    await context.addCookies([
      {
        name: "maphari.auth.role",
        value: "CLIENT",
        domain: "127.0.0.1",
        path: "/"
      }
    ]);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/portal$/);
  });

  test("redirects ADMIN role away from /login to /admin", async ({ context, page }) => {
    await context.addCookies([
      {
        name: "maphari.auth.role",
        value: "ADMIN",
        domain: "127.0.0.1",
        path: "/"
      }
    ]);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/admin$/);
  });
});
