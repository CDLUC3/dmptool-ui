import { redirect } from "@/i18n/routing";
import PlanCustomSectionRedirectPage from "../page";
import PlanCustomSectionQuestionRedirectPage from "../cq/[cqid]/page";
import PlanSectionRedirectPage from "../../../s/[sid]/page";
import PlanQuestionRedirectPage from "../../../s/[sid]/q/[qid]/page";
import PlanCustomQuestionRedirectPage from "../../../s/[sid]/cq/[cqid]/page";

jest.mock("@/i18n/routing", () => ({
  redirect: jest.fn(),
}));

const mockRedirect = redirect as unknown as jest.Mock;
const plan = { locale: "en-US", projectId: "1", dmpid: "2" };

describe("legacy plan section and question routes", () => {
  afterEach(() => {
    mockRedirect.mockReset();
  });

  it("redirects a custom section to its anchor on the plan page", async () => {
    await PlanCustomSectionRedirectPage({ params: Promise.resolve({ ...plan, csid: "7" }) });
    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/projects/1/dmp/2#plan-section-custom-section-7",
      locale: "en-US",
    });
  });

  it("redirects a base section to its anchor on the plan page", async () => {
    await PlanSectionRedirectPage({ params: Promise.resolve({ ...plan, sid: "5" }) });
    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/projects/1/dmp/2#plan-section-base-section-5",
      locale: "en-US",
    });
  });

  it("redirects a base question to its anchor on the plan page", async () => {
    await PlanQuestionRedirectPage({
      params: Promise.resolve({ ...plan, sid: "5", qid: "9" }),
    });
    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/projects/1/dmp/2#plan-question-base-question-9",
      locale: "en-US",
    });
  });

  it("redirects a custom question under a base section", async () => {
    await PlanCustomQuestionRedirectPage({
      params: Promise.resolve({ ...plan, sid: "5", cqid: "11" }),
    });
    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/projects/1/dmp/2#plan-question-custom-question-11",
      locale: "en-US",
    });
  });

  it("redirects a custom question under a custom section, keeping the locale", async () => {
    await PlanCustomSectionQuestionRedirectPage({
      params: Promise.resolve({ ...plan, locale: "pt-BR", csid: "7", cqid: "12" }),
    });
    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/projects/1/dmp/2#plan-question-custom-question-12",
      locale: "pt-BR",
    });
  });
});
