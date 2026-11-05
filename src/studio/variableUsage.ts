import { DocContent, DocNode } from '../core/schema';
import { tokensIn } from '../core/variables';

/** Every variable one block uses: in its words, its styles, its show rule or its repeat. */
export const variablesOfNode = (node: DocNode): Set<string> => {
  const used = tokensIn([node.props, node.styles, node.responsive]);
  if (node.showIf) used.add(node.showIf.replace(/^!/, ''));
  if (node.repeat) used.add(node.repeat.list);
  return used;
};

export const nodesUsingVariable = (content: DocContent, key: string): string[] =>
  Object.values(content.nodes).filter((node) => variablesOfNode(node).has(key)).map((node) => node.id);

/** Whether a variable's name or current value contains the search words. */
export const variableMatches = (label: string, value: unknown, term: string): boolean => {
  if (!term) return true;
  const needle = term.toLowerCase();
  if (label.toLowerCase().includes(needle)) return true;
  if (value === null || value === undefined) return false;
  return (typeof value === 'string' ? value : JSON.stringify(value)).toLowerCase().includes(needle);
};
