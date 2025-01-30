import * as React from 'react';
import { Content, EmptyState, EmptyStateBody, EmptyStateVariant, PageSection } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';

const Dashboard: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <EmptyState variant={EmptyStateVariant.full} titleText="Welcome to PatternFly" icon={CubesIcon}>
      <EmptyStateBody>
        <Content>
          <Content>Launch the ChatBot to get started</Content>
        </Content>
      </EmptyStateBody>
    </EmptyState>
  </PageSection>
);

export { Dashboard };
