import { expect, type Locator, type Page } from '@playwright/test';

// Waits until React has hydrated an element. Clicks on a page that has just loaded are ignored until then,
// and in dev mode that can take a while. React stores its props on each element it manages, as a property
// named "__reactProps$<id>", so the element is ready for clicks once that's there
export async function whenHydrated(target: Locator) {
  await expect.poll(
    () => target.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps'))),
    { message: 'waiting for React to hydrate the element', timeout: 20_000 }
  ).toBe(true);
}

// Clicks an element once React has hydrated it
export async function clickWhenHydrated(target: Locator) {
  await whenHydrated(target);
  await target.click();
}

// Clicks a button or link that goes to another page, and waits for that page's URL.
// In dev mode a click can be ignored, so it clicks again, but only while the element it clicked is still on the
// page, enabled, and the URL hasn't changed. So a retry never lands on the next page's button of the same name,
// and never clicks again while a save is in progress (the app disables its buttons then)
export async function clickAndWaitFor(page: Page, target: Locator, url: RegExp) {
  await whenHydrated(target);
  const startUrl = page.url();
  const element = await target.elementHandle();
  if (!element) throw new Error(`${target} isn't on the page`);
  // If the page reloads during this click, the retry below clicks again
  await element.click({ timeout: 5000 }).catch(() => {});

  // Pages can take a while to build the first time they're visited in dev mode, especially with several tests running
  await expect(async () => {
    if (url.test(page.url())) return;
    const canClickAgain = page.url() === startUrl && await element.evaluate((el) =>
      el.isConnected && !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true'
    ).catch(() => false);
    if (canClickAgain) {
      await element.click({ timeout: 2000 }).catch(() => {});
    }
    await expect(page).toHaveURL(url, { timeout: 5000 });
  }).toPass({ timeout: 45_000 });
  await element.dispose();
}

// Fills a field once React has hydrated it, and checks the value stuck. Text typed into a controlled field before
// hydration can be wiped when React takes over the page
export async function fillWhenHydrated(target: Locator, value: string) {
  await whenHydrated(target);
  await target.fill(value);
  await expect(target).toHaveValue(value);
}
