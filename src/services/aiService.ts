import { DocumentModel, ComponentNode } from '../types/document';
import { AIMode, AIChangeProposal, AICommand } from '../types/ai';
import { COMPONENT_REGISTRY } from '../editor/registry/componentRegistry';

export class AIService {
  /**
   * Process a prompt against the current document and optional selected node
   */
  async processRequest(
    mode: AIMode,
    prompt: string,
    currentDoc: DocumentModel,
    selectedNodeId?: string | null
  ): Promise<AIChangeProposal> {
    // Artificial slight latency to mirror model inference
    await new Promise((resolve) => setTimeout(resolve, 600));

    const commands: AICommand[] = [];
    let summary = '';
    const clonedDoc: DocumentModel = JSON.parse(JSON.stringify(currentDoc));

    if (mode === 'generate') {
      summary = `Generated new structured experience layout for: "${prompt}"`;
      
      // Intelligent rule-based generation matching user prompt
      const lower = prompt.toLowerCase();
      if (lower.includes('tour') || lower.includes('onboard') || lower.includes('walkthrough')) {
        commands.push({
          type: 'replace_document',
          payload: {
            ...clonedDoc,
            documentType: 'tour',
            title: prompt.slice(0, 35) || 'Generated Onboarding Tour',
            rootNode: {
              id: 'tour_gen_root',
              type: 'Container',
              name: 'Tour Container',
              props: {},
              styles: { width: '100%' },
              children: [
                {
                  id: `step_${Date.now()}_1`,
                  type: 'TourStep',
                  name: 'Introduction Step',
                  target: { selector: '#nav-start', placement: 'bottom', highlight: true },
                  props: {
                    stepNumber: 1,
                    title: 'Welcome to FlowPilot 🚀',
                    description: 'Let us show you around in 3 quick steps.',
                    nextButtonText: 'Next Step →',
                  },
                  styles: { width: '380px', backgroundColor: '#ffffff', borderRadius: '12px', paddingTop: '20px', paddingBottom: '20px', paddingLeft: '24px', paddingRight: '24px' },
                  children: [],
                },
                {
                  id: `step_${Date.now()}_2`,
                  type: 'TourStep',
                  name: 'Feature Spotlight Step',
                  target: { selector: '#main-feature', placement: 'right', highlight: true },
                  props: {
                    stepNumber: 2,
                    title: 'Core Tools & Analytics',
                    description: 'Explore live engagement funnels and customizable UI blocks.',
                    prevButtonText: 'Back',
                    nextButtonText: 'Finish Tour',
                  },
                  styles: { width: '380px', backgroundColor: '#ffffff', borderRadius: '12px', paddingTop: '20px', paddingBottom: '20px', paddingLeft: '24px', paddingRight: '24px' },
                  children: [],
                },
              ],
            },
          },
          explanation: 'Replaced document with a 2-step targeted product tour.',
        });
      } else if (lower.includes('faq') || lower.includes('question') || lower.includes('help')) {
        commands.push({
          type: 'replace_document',
          payload: {
            ...clonedDoc,
            documentType: 'faq',
            title: 'Customer FAQ Section',
            rootNode: {
              id: 'faq_gen_root',
              type: 'Container',
              name: 'FAQ Container',
              props: {},
              styles: { width: '100%', maxWidth: '800px', margin: '0 auto', paddingTop: '32px' },
              children: [
                {
                  id: `faq_${Date.now()}`,
                  type: 'FaqWidget',
                  name: 'AI Generated FAQ',
                  props: {
                    title: 'Frequently Asked Questions',
                    subtitle: 'AI-generated answers to common customer inquiries.',
                    items: [
                      { q: 'How easy is it to publish changes?', a: 'Instant! Click Publish and changes immediately sync to your live site.' },
                      { q: 'Can I test experiences before showing users?', a: 'Yes! Use the Live Preview mode or private staging links.' },
                      { q: 'Does this work on mobile devices?', a: 'Fully responsive with dedicated mobile viewports and touch targets.' },
                    ],
                  },
                  styles: { width: '100%' },
                  children: [],
                },
              ],
            },
          },
          explanation: 'Created a customer FAQ accordion with 3 pre-filled questions.',
        });
      } else if (lower.includes('banner') || lower.includes('announc')) {
        commands.push({
          type: 'replace_document',
          payload: {
            ...clonedDoc,
            documentType: 'banner',
            title: 'Product Announcement Banner',
            rootNode: {
              id: 'banner_gen_root',
              type: 'Container',
              name: 'Banner Container',
              props: {},
              styles: { width: '100%' },
              children: [
                {
                  id: `banner_${Date.now()}`,
                  type: 'BannerWidget',
                  name: 'Sticky Launch Banner',
                  props: {
                    badgeText: 'LAUNCH',
                    message: 'Discover our newest automated features today!',
                    ctaText: 'Explore Demo →',
                    isDismissible: true,
                  },
                  styles: { width: '100%', backgroundColor: '#4f46e5', color: '#ffffff', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '20px', paddingRight: '20px' },
                  children: [],
                },
              ],
            },
          },
          explanation: 'Created high-contrast sticky announcement banner.',
        });
      } else {
        // General Landing page with Hero, Features, and CTA
        commands.push({
          type: 'replace_document',
          payload: {
            ...clonedDoc,
            documentType: 'page',
            title: prompt.slice(0, 30) || 'Custom Experience Page',
            rootNode: {
              id: 'page_gen_root',
              type: 'Container',
              name: 'Page Root',
              props: {},
              styles: { width: '100%', backgroundColor: '#ffffff' },
              children: [
                {
                  id: `hero_${Date.now()}`,
                  type: 'HeroSection',
                  name: 'Generated Hero',
                  props: {
                    badge: '⚡ AI Generated',
                    headline: prompt.length > 10 ? prompt : 'Transform Your Customer Adoption',
                    subheadline: 'Visually assemble interactive walkthroughs, banners, and modals without engineering delays.',
                    primaryCtaText: 'Get Started',
                    secondaryCtaText: 'View Demo',
                  },
                  styles: { width: '100%', paddingTop: '64px', paddingBottom: '64px', backgroundColor: '#faf5ff' },
                  children: [],
                },
                {
                  id: `feat_${Date.now()}`,
                  type: 'FeaturesSection',
                  name: 'Generated Features',
                  props: {
                    title: 'Why Choose FlowPilot',
                    subtitle: 'Designed for high velocity growth teams.',
                  },
                  styles: { width: '100%', paddingTop: '48px', paddingBottom: '48px' },
                  children: [],
                },
              ],
            },
          },
          explanation: 'Assembled a responsive landing section tailored to your prompt.',
        });
      }
    } else if (mode === 'edit') {
      summary = `Applied styling and content improvements based on: "${prompt}"`;
      const targetId = selectedNodeId || clonedDoc.rootNode.id;
      
      const lower = prompt.toLowerCase();
      if (lower.includes('prominent') || lower.includes('stand out') || lower.includes('dark')) {
        commands.push({
          type: 'update_node_styles',
          targetNodeId: targetId,
          payload: {
            backgroundColor: '#1e1b4b',
            color: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          },
          explanation: 'Increased contrast with deep navy background and elevated drop shadow.',
        });
      } else if (lower.includes('padding') || lower.includes('space')) {
        commands.push({
          type: 'update_node_styles',
          targetNodeId: targetId,
          payload: {
            paddingTop: '32px',
            paddingBottom: '32px',
            paddingLeft: '32px',
            paddingRight: '32px',
          },
          explanation: 'Expanded spacing and padding for improved legibility.',
        });
      } else {
        commands.push({
          type: 'update_node_styles',
          targetNodeId: targetId,
          payload: {
            borderRadius: '16px',
            borderColor: '#6366f1',
            borderWidth: '2px',
            borderStyle: 'solid',
          },
          explanation: 'Applied brand purple accent border and rounded corners.',
        });
      }
    } else {
      // ASK mode
      summary = `Analysis: Your experience currently has strong visual balance. For maximum conversion, ensure your primary CTA has high contrast and the step description is under 120 characters.`;
    }

    // Build the proposal snapshot
    let modifiedDoc = JSON.parse(JSON.stringify(clonedDoc));
    for (const cmd of commands) {
      if (cmd.type === 'replace_document') {
        modifiedDoc = cmd.payload;
      } else if (cmd.type === 'update_node_styles' && cmd.targetNodeId) {
        // Apply recursively
        const applyStyle = (node: ComponentNode): ComponentNode => {
          if (node.id === cmd.targetNodeId) {
            return { ...node, styles: { ...node.styles, ...cmd.payload } };
          }
          return { ...node, children: node.children.map(applyStyle) };
        };
        modifiedDoc.rootNode = applyStyle(modifiedDoc.rootNode);
      }
    }

    return {
      id: `prop_${Date.now()}`,
      mode,
      prompt,
      summary,
      commands,
      originalDocumentSnapshot: currentDoc,
      modifiedDocumentSnapshot: modifiedDoc,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }
}

export const aiService = new AIService();
