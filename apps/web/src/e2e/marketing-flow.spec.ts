import { expect, test } from "@playwright/test";

test("anonymous user can move from homepage to contact page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Contact" }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: "Book a consultation to scope your next delivery phase" })).toBeVisible();
});
