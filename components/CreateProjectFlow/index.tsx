'use client';

import React, { createContext, useContext } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { Button } from 'react-aria-components';

import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';

import {
  DEFAULT_FLOW,
  FLOW_SCREENS,
  FlowScreen,
  FlowState,
  RAIL_STAGES,
  RailStage,
  flowQuery,
} from './steps';
import styles from './CreateProjectFlow.module.scss';

export * from './steps';

export function useCreateProjectFlow() {
  const searchParams = useSearchParams();
  const intent = searchParams?.get('intent');
  const inFlow = intent === 'plan' || intent === 'project';
  const flow: FlowState = {
    intent: intent === 'project' ? 'project' : DEFAULT_FLOW.intent,
    fromExisting: searchParams?.get('from') === 'existing',
  };
  return { inFlow, flow, query: flowQuery(flow) };
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
      <ContentContainer>
        <FlowNavContext.Provider value={backButton}>
          {children}
        </FlowNavContext.Provider>
      </ContentContainer>

      <SidebarPanel className={styles.rail}>
        <nav aria-labelledby="setup-progress-heading" className={styles.railPanel}>
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
        </nav>
      </SidebarPanel>
    </LayoutWithPanel>
  );
};

export default CreateProjectFlowLayout;
