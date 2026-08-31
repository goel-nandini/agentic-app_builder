// ─── Agentic Pipeline Types (Phase 1) ─────────────────────────────────────────

export interface AppSpecification {
  appName: string;
  appType: string;
  targetUsers: string;
  problemStatement: string;
  coreFeatures: string[];
  secondaryFeatures: string[];
  requiredPages: string[];
  navigationStructure: string;
  importantUserFlows: string[];
  dataEntities: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  responsiveRequirements: string;
  accessibilityRequirements: string;
  designRequirements: string;
  explicitUserPreferences: string[];
  thingsToAvoid: string[];
}

export interface ComponentSpec {
  name: string;
  filePath: string;
  purpose: string;
  props: string[];
  state: string[];
  dependencies: string[];
}

export interface PageSpec {
  name: string;
  path: string;
  purpose: string;
  components: string[];
}

export interface FeatureImplementationSpec {
  feature: string;
  description: string;
  implementationSteps: string[];
}

export interface InteractionSpec {
  userAction: string;
  expectedBehavior: string;
  feedbackMechanism: string;
}

export interface AppPlan {
  pageArchitecture: PageSpec[];
  componentArchitecture: ComponentSpec[];
  featureImplementationPlan: FeatureImplementationSpec[];
  dataFlow: {
    stateManagement: string;
    dataSources: string[];
    flowDescription: string;
  };
  interactionPlan: InteractionSpec[];
  responsiveStrategy: {
    desktop: string;
    tablet: string;
    mobile: string;
    breakpoints: string;
  };
  designDirection: {
    colorPalette: string[];
    typography: string;
    uiTheme: string;
    layoutStyle: string;
    motionAndEffects: string;
  };
}
