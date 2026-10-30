// FlowPilot Document Model & Node Schema
// Strictly typed, versioned, and extensible for all 15 experience types.

export type ExperienceType = 
  | 'tour'
  | 'demo'
  | 'page'
  | 'banner'
  | 'menu'
  | 'faq'
  | 'popup'
  | 'checklist'
  | 'survey'
  | 'form'
  | 'pricing'
  | 'testimonials';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface StyleProperties {
  // Typography
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | string;

  // Visual Effects & Glassmorphism
  backdropFilter?: string;
  filter?: string;

  // Background & Borders
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: string;
  boxShadow?: string;

  // Layout & Spacing
  display?: 'block' | 'flex' | 'grid' | 'inline-block' | 'inline-flex' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  gridTemplateColumns?: string;
  background?: string;

  margin?: string;
  borderBottomWidth?: string;

  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Sizing & Positioning
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  zIndex?: number;

  // Visual Effects
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  transform?: string;
  transition?: string;
  cursor?: string;
}

export type ResponsiveStyleOverrides = Partial<Record<DeviceMode, Partial<StyleProperties>>>;

export interface ComponentNode {
  id: string;
  type: string;
  name: string;
  locked?: boolean;
  hidden?: boolean;
  props: Record<string, any>;
  styles: StyleProperties;
  responsive?: ResponsiveStyleOverrides;
  children: ComponentNode[];
  target?: TargetSelectorConfig;
  interaction?: NodeInteraction;
}

export interface TargetSelectorConfig {
  selector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
  highlight?: boolean;
  spotlightPadding?: number;
  allowInteractionWithTarget?: boolean;
  fallbackBehavior?: 'show-modal' | 'skip-step' | 'abort' | 'center';
}

export interface NodeInteraction {
  onClick?: 'none' | 'next-step' | 'prev-step' | 'close' | 'navigate' | 'submit-form' | 'custom-event';
  url?: string;
  openInNewTab?: boolean;
  eventName?: string;
}

export interface TriggerConditions {
  urlRules: {
    type: 'exact' | 'contains' | 'starts_with' | 'regex';
    value: string;
  }[];
  delaySeconds: number;
  scrollPercentage?: number;
  exitIntent?: boolean;
  frequency: 'always' | 'once_per_session' | 'once_per_visitor' | 'until_completed';
  devices?: DeviceMode[];
}

export interface ExperienceSettings {
  showBackdrop?: boolean;
  backdropColor?: string;
  backdropOpacity?: number;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
  brandingEnabled?: boolean;
  accentColor?: string;
  theme?: 'light' | 'dark' | 'custom';
}

export interface DocumentModel {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  documentType: ExperienceType;
  schemaVersion: number;
  rootNode: ComponentNode;
  themeVariables: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontFamily: string;
  };
  responsiveSettings: {
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
  experienceSettings: ExperienceSettings;
  triggerConditions: TriggerConditions;
  isPublished: boolean;
  publishedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}
