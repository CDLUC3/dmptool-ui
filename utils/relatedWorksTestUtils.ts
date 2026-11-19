import { screen } from "@testing-library/react";

const translators = new Map<string, unknown>();

// Returns "Namespace.key" so sections that share a key (e.g. "title") get different names, as with real messages.
export const namespacedTranslations = (namespace?: string) => {
  const ns = namespace ?? "";
  if (!translators.has(ns)) {
    const translate = (key: string) => `${ns}.${key}`;
    translate.rich = (key: string) => `${ns}.${key}`;
    translators.set(ns, translate);
  }
  return translators.get(ns);
};

export const getCardHeading = (title: string) =>
  screen.getByRole("heading", { level: 3, name: (name) => name.startsWith(title) });
