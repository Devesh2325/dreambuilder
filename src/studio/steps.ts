import { DocContent } from '../core/schema';
import { getAncestors } from '../core/tree';
import { expandContent, RenderNode, VariableValues } from '../core/variables';

const STEP_LABELS: Record<string, string> = { TourStep: 'Step', DemoScreen: 'Screen', Slide: 'Slide', FormStep: 'Step' };

export interface StepItem {
  key: string;
  sourceId: string;
  label: string;
  /** Comes from a list variable, so it's added and removed by editing that list. */
  isRepeated: boolean;
}

export interface StepSet {
  parentKey: string;
  stepType: string;
  label: string;
  steps: StepItem[];
}

/** The steps, screens or slides in a document, so the canvas can show one at a time. */
export function findSteps(content: DocContent, variables: VariableValues, ignore: string[] = []): StepSet | null {
  const search = (node: RenderNode): StepSet | null => {
    const stepType = node.children.find((child) => STEP_LABELS[child.type] && !ignore.includes(child.type))?.type;
    if (stepType) {
      const steps = node.children.filter((child) => child.type === stepType);
      return {
        parentKey: node.key,
        stepType,
        label: STEP_LABELS[stepType],
        steps: steps.map((step, index) => ({
          key: step.key,
          sourceId: step.sourceId,
          label: `${STEP_LABELS[stepType]} ${index + 1}`,
          isRepeated: Boolean(content.nodes[step.sourceId]?.repeat),
        })),
      };
    }
    for (const child of node.children) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  };
  const tree = expandContent(content, variables);
  return tree ? search(tree) : null;
}

/** The step a block lives in, so selecting it from Layers shows the right step. */
export function stepOfNode(content: DocContent, set: StepSet, nodeId: string): StepItem | undefined {
  const path = new Set([...getAncestors(content, nodeId), nodeId]);
  return set.steps.find((step) => path.has(step.sourceId));
}
