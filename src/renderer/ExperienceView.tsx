import React from 'react';
import { DocContent, Theme } from '../core/schema';
import { expandContent, RenderNode, VariableValues } from '../core/variables';
import { BLOCK_RENDERERS } from './blocks';
import { BASE_CSS, fontsUrl, generateNodeCss, nodeClass, nodeFonts, themeCssVariables } from './css';
import { RenderContext } from './types';

export const RenderedNode: React.FC<{ node: RenderNode; ctx: RenderContext }> = ({ node: fullNode, ctx }) => {
  const step = ctx.visibleStep;
  const node = step && fullNode.key === step.parentKey
    ? { ...fullNode, children: fullNode.children.filter((child) => child.type !== step.stepType || child.key === step.key) }
    : fullNode;
  const Block = BLOCK_RENDERERS[node.type];
  const attrs = {
    className: nodeClass(node.key),
    'data-fp-node': node.sourceId,
    'data-fp-key': node.key,
  };

  if (!Block) {
    // Published content must keep working if a block type is later removed.
    return ctx.mode === 'edit' ? <div {...attrs}>Unknown block: {node.type}</div> : null;
  }
  return (
    <Block node={node} attrs={attrs} ctx={ctx}>
      {node.children.map((child) => (
        <RenderedNode key={child.key} node={child} ctx={ctx} />
      ))}
    </Block>
  );
};

export const StyleTag: React.FC<{ theme: Theme; trees: (RenderNode | null)[] }> = ({ theme, trees }) => {
  const blockFonts = fontsUrl(trees.flatMap(nodeFonts));
  return (
    <>
      {blockFonts && <link rel="stylesheet" href={blockFonts} />}
      <style
        // Node values are filtered by safeCssValue. A </style> can't get through, since < is rejected.
        dangerouslySetInnerHTML={{
          __html: `.fp-root{${themeCssVariables(theme)}}${BASE_CSS}${trees.map(generateNodeCss).join('')}`,
        }}
      />
    </>
  );
};

export interface ExperienceViewProps {
  /** Rendered in order: for websites that is header, page, footer. */
  documents: DocContent[];
  theme: Theme;
  variables: VariableValues;
  ctx: RenderContext;
}

/** The one renderer used by the editor, previews, public sites and the embed. */
export const ExperienceView: React.FC<ExperienceViewProps> = ({ documents, theme, variables, ctx }) => {
  const trees = documents.map((content) => expandContent(content, variables));
  return (
    <div className="fp-root">
      <StyleTag theme={theme} trees={trees} />
      {trees.map((tree) => tree && <RenderedNode key={tree.key} node={tree} ctx={ctx} />)}
    </div>
  );
};
