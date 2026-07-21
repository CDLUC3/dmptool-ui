export const doiToUrl = (doi: string): string => {
  return `https://doi.org/${doi}`;
};

export const rorToUrl = (ror: string): string => {
  return `https://ror.org/${ror}`;
};

export const orcidToUrl = (orcid: string): string => {
  const normalized = extractOrcid(orcid);
  return `https://orcid.org/${normalized ?? orcid}`;
};

const ORCID_ID_PATTERN = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i;

export function extractOrcid(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }

  const match = text.trim().match(ORCID_ID_PATTERN);
  return match ? match[1].toUpperCase() : null;
}

export function extractDoi(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const pattern = /10\.[\d.]+\/[^\s]+/i;
  const match = text.match(pattern);

  if (match) {
    return cleanString(match[0]);
  }

  return null;
}

export function cleanString(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }

  return text.toLowerCase().trim();
}
