import {
  ResearchOutputTableAnswerSchema,
  ResearchOutputTableColumnsEnum,
  type ResearchOutputTableAnswerType,
  type ResearchOutputTableRowAnswerType,
  type AnyResearchOutputTableColumnAnswerType,
} from '@dmptool/types';

export type PlanAnswer = {
  id?: number | string | null;
  json?: string | null;
};

export type ParsedOutput = {
  title?: string;
  description?: string;
  type?: string;
  issued?: string;
  byteSize?: number;
  byteSizeUnit?: string;
  hosts: { url?: string; name?: string }[];
  metadataStandards: { uri?: string; name?: string }[];
  licenses: { uri?: string; name?: string }[];
};

function getColumn<Id extends AnyResearchOutputTableColumnAnswerType['commonStandardId']>(
  columns: AnyResearchOutputTableColumnAnswerType[],
  commonStandardId: Id
): Extract<AnyResearchOutputTableColumnAnswerType, { commonStandardId: Id }> | undefined {
  return columns.find(
    (c): c is Extract<AnyResearchOutputTableColumnAnswerType, { commonStandardId: Id }> =>
      c.commonStandardId === commonStandardId
  );
}

function parseRow(row: ResearchOutputTableRowAnswerType): ParsedOutput {
  const columns = row.columns;
  const titleCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.title);
  const descriptionCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.description);
  const typeCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.type);
  const issuedCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.issued);
  const byteSizeCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.byte_size);
  const hostCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.host);
  const metadataCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.metadata);
  const licenseCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.license_ref);

  return {
    title: titleCol?.answer,
    description: descriptionCol?.answer,
    type: typeCol?.answer,
    issued: issuedCol?.answer,
    byteSize: byteSizeCol?.answer?.value,
    byteSizeUnit: byteSizeCol?.answer?.context,
    hosts: (hostCol?.answer ?? []).map((h) => ({ url: h.repositoryId, name: h.repositoryName })),
    metadataStandards: (metadataCol?.answer ?? []).map((m) => ({
      uri: m.metadataStandardId,
      name: m.metadataStandardName,
    })),
    licenses: (licenseCol?.answer ?? []).map((l) => ({ uri: l.licenseId, name: l.licenseName })),
  };
}

export function parseResearchOutputsFromAnswers(answers?: PlanAnswer[] | null): ParsedOutput[] {
  if (!answers) return [];
  const outputs: ParsedOutput[] = [];

  for (const ans of answers) {
    if (!ans?.json) continue;
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(ans.json);
    } catch {
      continue;
    }
    const result = ResearchOutputTableAnswerSchema.safeParse(rawJson);
    if (!result.success) continue;
    const tableAnswer: ResearchOutputTableAnswerType = result.data;
    for (const row of tableAnswer.answer) {
      outputs.push(parseRow(row));
    }
  }
  return outputs;
}

export function outputTypeLabel(type?: string | null): string {
  if (!type) return '';
  const spaced = type.replace(/[-_]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}