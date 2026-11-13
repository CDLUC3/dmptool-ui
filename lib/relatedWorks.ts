import { Author } from "@/generated/graphql";


export const formatAuthorNameAbrev = (author: Author): string | null => {
  const parts = [];

  if (author.firstInitial && author.surname) {
    // Combine initials
    const initials = [];
    if (author.firstInitial) {
      initials.push(author.firstInitial);
    }
    if (author.middleInitials) {
      initials.push(author.middleInitials);
    }
    parts.push(initials.join("")); // Join initials
    parts.push(author.surname); // Add surname
  } else if (author.full) {
    // Fallback to full name
    parts.push(author.full);
  }

  return parts.length > 0 ? parts.join(" ").trim() : null;
};

export const formatAuthorNameFirstLast = (author: Author): string | null => {
  const parts = [];

  if (author.givenName && author.surname) {
    parts.push(author.givenName);
    parts.push(author.surname);
  } else if (author.full) {
    // Fallback to full name
    parts.push(author.full);
  }

  return parts.length > 0 ? parts.join(" ").trim() : null;
};

export const formatAuthorNames = (authors: Author[], maxAuthorChars: number): string => {
  const names = authors.map(formatAuthorNameAbrev).filter((n): n is string => !!n);

  // Choose what names to display based on the total character length
  const authorNames = [];
  let totalChars = 0;
  for (const name of names) {
    authorNames.push(name);
    totalChars += name.length;
    if (totalChars >= maxAuthorChars) break;
  }
  if (names.length > authorNames.length) {
    authorNames.push("et al");
  }

  return authorNames.join(", ");
};

export const formatSubtitle = (
  authors: Author[],
  publicationVenue: string | null | undefined,
  publicationDate: string | null | undefined,
  maxAuthorChars: number,
): { authorNames: string; containerTitle: string; publicationYear: string } => {
  const authorNames = formatAuthorNames(authors, maxAuthorChars);

  // Build container title
  let containerTitle = "";
  if (publicationVenue) {
    containerTitle = ` ${publicationVenue}${publicationDate ? ", " : "."}`;
  }

  // Build publication year
  const publicationYear = publicationDate ? `${new Date(publicationDate).getFullYear()}.` : "";

  return { authorNames: authorNames + ". ", containerTitle, publicationYear };
};
