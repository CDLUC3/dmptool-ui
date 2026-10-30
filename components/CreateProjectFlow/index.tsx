'use client';

import React, { createContext, useContext } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { Breadcrumb, Breadcrumbs, Button, Link } from 'react-aria-components';

import {
  ContentContainer,
  LayoutContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';
import { routePath } from '@/utils/routes';

import {
  DEFAULT_FLOW,
  FLOW_SCREENS,
  FlowScreen,
  FlowState,
  RAIL_STAGES,
  RailStage,
} from './steps';
import styles from './CreateProjectFlow.module.scss';

export * from './steps';

export type CreateProjectFlow =
  | { inFlow: true; flow: FlowState }
  | { inFlow: false; flow: null };

export function useCreateProjectFlow(): CreateProjectFlow {
  const searchParams = useSearchParams();
  const intent = searchParams?.get('intent');
  if (intent !== 'plan' && intent !== 'project') return { inFlow: false, flow: null };
  return {
    inFlow: true,
    flow: { intent, fromExisting: searchParams?.get('from') === 'existing' },
  };
}

// For screens that only exist inside the flow, where a missing intent means the plan flow.
export function useFlowState(): FlowState {
  return useCreateProjectFlow().flow ?? DEFAULT_FLOW;
}

type StageState = 'done' | 'current' | 'upcoming' | 'skipped';

function stageState(stage: RailStage, screen: FlowScreen, flow: FlowState): StageState {
  if (flow.fromExisting && (stage === 'addFunder' || stage === 'projectDetails')) return 'skipped';
  if (screen === 'complete') return 'done';

  const stageIndex = RAIL_STAGES.indexOf(stage);
  const currentIndex = RAIL_STAGES.indexOf(FLOW_SCREENS[screen].stage);
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'upcoming';
}

interface CreateProjectFlowLayoutProps {
  screen: FlowScreen;
  flow: FlowState;
  children: React.ReactNode;
}

// undefined means FlowActions is rendered outside this layout (keep children as-is).
// null means this screen has no Back button.
const FlowNavContext = createContext<React.ReactNode | undefined>(undefined);

export function FlowActions({ children }: { children?: React.ReactNode }) {
  const back = useContext(FlowNavContext);
  if (back === undefined) return <>{children}</>;
  if (!back && !children) return null;

  return (
    <div className={styles.flowNav}>
      {back}
      {children ? <div className={styles.flowNavNext}>{children}</div> : null}
    </div>
  );
}

export function FlowBreadcrumbs({ current }: { current: string }) {
  const Global = useTranslations('Global');
  return (
    <Breadcrumbs>
      <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
      <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
      <Breadcrumb>{current}</Breadcrumb>
    </Breadcrumbs>
  );
}

const CreateProjectFlowLayout = ({ screen, flow, children }: CreateProjectFlowLayoutProps) => {
  const t = useTranslations('CreateProjectFlow');
  const router = useRouter();

  const backButton = FLOW_SCREENS[screen].allowBack ? (
    <Button
      type="button"
      className="secondary"
      onPress={() => router.back()}
      data-testid="create-flow-back"
    >
      {t('buttons.back')}
    </Button>
  ) : null;

  return (
    <LayoutWithPanel>
      <ContentContainer className={styles.content}>
        <FlowNavContext.Provider value={backButton}>
          {children}
        </FlowNavContext.Provider>
      </ContentContainer>

      <SidebarPanel className={styles.rail}>
        <section aria-labelledby="setup-progress-heading" className={styles.railPanel}>
          <h2 id="setup-progress-heading" className={styles.railTitle}>{t('rail.title')}</h2>
          <ol className={styles.checklist}>
            {RAIL_STAGES.map((stage, index) => {
              const state = stageState(stage, screen, flow);
              return (
                <li
                  key={stage}
                  className={styles[state]}
                  aria-current={state === 'current' ? 'step' : undefined}
                  data-testid={`create-flow-stage-${stage}`}
                >
                  <span className={styles.mark} aria-hidden="true">
                    {state === 'done' ? '✓' : index + 1}
                  </span>
                  <span className={styles.stageLabel}>
                    {t(`rail.stages.${stage}`)}
                    <span className="hidden-accessibly">{` (${t(`rail.states.${state}`)})`}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </SidebarPanel>
    </LayoutWithPanel>
  );
};

const defaultFallback = (children: React.ReactNode) => (
  <LayoutContainer><ContentContainer>{children}</ContentContainer></LayoutContainer>
);

interface FlowAwareLayoutProps {
  screen: FlowScreen;
  children: React.ReactNode;
  fallback?: (children: React.ReactNode) => React.ReactNode;
}

// For pages that are also used outside the flow: the rail only shows when an intent is in the URL.
export function FlowAwareLayout({ screen, children, fallback = defaultFallback }: FlowAwareLayoutProps) {
  const { inFlow, flow } = useCreateProjectFlow();
  return inFlow
    ? <CreateProjectFlowLayout screen={screen} flow={flow}>{children}</CreateProjectFlowLayout>
    : <>{fallback(children)}</>;
}

export default CreateProjectFlowLayout;
