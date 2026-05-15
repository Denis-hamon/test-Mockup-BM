import React, { useEffect, useState } from 'react';
import './ProductReasoningAtlas.css';

const layers = [
  ['Context', 'Market, users, metrics, constraints, product stage, and available data.'],
  ['Reasoning Engine', 'The chosen method: gap analysis, JTBD, causality, inversion, red team, and more.'],
  ['Critique', 'Risks, weak assumptions, objections, blind spots, and adversarial review.'],
  ['Output Format', 'Roadmap, PRD, opportunity tree, backlog, RICE score, experiment plan, or strategy memo.'],
];

const howToUseSteps = [
  ['Choose', 'Pick the PM situation closest to your current decision.'],
  ['Inspect', 'Open a technique card to understand when and why to use it.'],
  ['Copy', 'Copy the full prompt with context gate, boost, and output requirements.'],
  ['Paste', 'Add your real product context in your LLM and run the prompt.'],
];

const categories = [
  {
    id: 'ideation',
    title: 'Product Ideation',
    lens: 'Find natural feature opportunities.',
    accent: 'Gap',
    techniques: [
      ['Fill the gap', 'Identify the most obvious missing step in a journey.', 'Find the natural next feature.', 'Here is the current user journey. Identify the obvious gaps between intention, action, and outcome. Propose features that close those gaps.'],
      ['Adjacent possible', 'Explore natural extensions of the product.', 'Product expansion.', 'Starting from this product, list the most credible adjacent extensions, ranked by user proximity and feasibility.'],
      ['Feature from friction', 'Turn irritants into features.', 'Discovery and backlog.', 'Here are user frustrations. Convert them into product opportunities and candidate features.'],
      ['Feature from workaround', 'Identify the hacks users rely on today.', 'PLG and B2B SaaS.', 'What workarounds might users be using today? Convert them into native product features.'],
      ['Feature from repeated question', 'Convert frequent questions into product or UX improvements.', 'Support-driven product.', 'Here are support tickets. Infer the features or improvements that would reduce these requests.'],
      ['Feature inversion', 'Imagine what would make the product unusable, then invert it.', 'Radical innovation.', 'List product decisions that would make this product unusable, then invert them into opportunities.'],
      ['10x simplification', 'Search for a version that is ten times simpler.', 'Activation and onboarding.', 'How can we reduce this 8-step journey to 1 or 2 steps without losing the core value?'],
      ['Invisible feature', 'Solve a problem without adding interface.', 'UX, automation, and AI products.', 'How could we solve this problem without adding a button, screen, or setting?'],
    ],
  },
  {
    id: 'discovery',
    title: 'User Discovery',
    lens: 'Understand demand, struggle, and switching.',
    accent: 'Human',
    techniques: [
      ['JTBD decomposition', 'Break down the functional, emotional, and social job.', 'Discovery and positioning.', 'Analyze this segment with Jobs-to-be-Done: functional job, emotional job, social job, triggers, anxieties, and alternatives.'],
      ['Customer struggle mining', 'Extract moments of user struggle.', 'Qualitative discovery.', 'From these verbatims, extract struggles, contexts, expectations, and demand signals.'],
      ['Switching forces', 'Understand why users move from one solution to another.', 'Migration and acquisition.', 'Analyze the forces pushing users to switch, the forces holding them back, anxieties, and existing habits.'],
      ['Moment of truth mapping', 'Identify decisive moments in the journey.', 'Activation and retention.', 'Map the moments where users unconsciously decide to continue or abandon.'],
      ['Persona stress test', 'Test whether personas are actionable.', 'Segmentation.', 'Evaluate these personas. Which are too generic? Propose a segmentation that better supports product decisions.'],
      ['Synthetic interview simulator', 'Simulate realistic customer interviews.', 'Discovery preparation.', 'Act as 5 different users from this segment and answer these interview questions as they would.'],
      ['Objection mining', 'Identify reasons for non-adoption.', 'Conversion and sales enablement.', 'List the explicit and implicit objections that prevent adoption of this product.'],
      ['Unmet need extraction', 'Extract unmet needs from raw data.', 'Discovery.', 'Transform these verbatims into unmet needs, ranked by intensity and frequency.'],
    ],
  },
  {
    id: 'strategy',
    title: 'Product Strategy',
    lens: 'Decide where to play and how to win.',
    accent: 'Vector',
    techniques: [
      ['First-principles reasoning', 'Start again from the fundamental need.', 'Product vision.', 'Ignore existing solutions. What is the fundamental need, and what solution would we design from zero?'],
      ['Market wedge reasoning', 'Find a narrow but powerful entry point.', 'Launch strategy.', 'Identify the initial wedge: precise segment, acute problem, promise, channel, and expansion path.'],
      ['Beachhead strategy', 'Choose the first dominant segment.', 'GTM and early product.', 'Among these segments, which is the best beachhead market? Evaluate pain, urgency, accessibility, and expansion.'],
      ['Strategic narrative building', 'Build the strategic story of the product.', 'Alignment, pitch, and fundraising.', 'Formulate the strategic narrative: old world, change, tension, new category, and product role.'],
      ['Category design', 'Create or reposition a category.', 'Positioning.', 'Does this product belong to an existing category or should it create one? Propose 3 frames.'],
      ['Moat reasoning', 'Identify compounding defenses.', 'Long-term strategy.', 'What defensible advantages could emerge: data, workflow, network, integrations, brand, or switching costs?'],
      ['Strategic trade-off mapping', 'Clarify what you choose not to do.', 'Roadmap and focus.', 'List the implicit strategic trade-offs. What should we explicitly refuse?'],
      ['North Star decomposition', 'Connect vision, metric, and behavior.', 'Product strategy.', 'Decompose this North Star Metric into input metrics, user behaviors, and product levers.'],
    ],
  },
  {
    id: 'prioritization',
    title: 'Prioritization',
    lens: 'Allocate scarce attention under uncertainty.',
    accent: 'Rank',
    techniques: [
      ['RICE critique', 'Score Reach, Impact, Confidence, and Effort.', 'Backlog.', 'Score these initiatives with RICE, then critique the scores that are too uncertain.'],
      ['ICE fast ranking', 'Fast ranking by Impact, Confidence, and Ease.', 'Early-stage prioritization.', 'Rank these ideas with ICE. Flag high-impact ideas with low confidence.'],
      ['Cost of Delay', 'Prioritize by the cost of waiting.', 'Business roadmap.', 'Estimate the cost of delay for each initiative: lost revenue, churn, strategic risk, and delayed learning.'],
      ['Expected value reasoning', 'Evaluate expected value as impact x probability.', 'Decision under uncertainty.', 'Calculate the expected value of these options and identify which justify a fast test.'],
      ['Opportunity sizing', 'Size an opportunity.', 'Business case.', 'Estimate this opportunity: affected users, frequency, intensity, and business value.'],
      ['Bottleneck prioritization', 'Prioritize the main funnel constraint.', 'Growth and activation.', 'Here is the funnel. Identify the priority bottleneck and initiatives that attack it directly.'],
      ['One metric that matters', 'Force focus on one metric.', 'Sprint or quarter.', 'Which single metric should guide product decisions this quarter? Justify what is excluded.'],
      ['Portfolio balance', 'Balance quick wins, bets, and maintenance.', 'Roadmap.', 'Classify the roadmap into core, growth, innovation, and tech debt. Where is the imbalance?'],
    ],
  },
  {
    id: 'experimentation',
    title: 'Experimentation',
    lens: 'Learn before building.',
    accent: 'Test',
    techniques: [
      ['Assumption mapping', 'Identify critical assumptions.', 'Discovery and MVP.', 'List the assumptions behind this feature. Rank them by risk and uncertainty.'],
      ['Riskiest assumption test', 'Test the most dangerous assumption first.', 'MVP.', 'Which assumption would invalidate the entire initiative? Propose the fastest test.'],
      ['MVP laddering', 'Build a ladder of progressively stronger tests.', 'Validation.', 'Propose 5 MVP levels, from the lightest test to the complete product.'],
      ['Smoke test design', 'Test interest before building.', 'Demand validation.', 'Design a smoke test to measure real demand before development.'],
      ['Concierge MVP', 'Manually simulate product value.', 'B2B, AI, and marketplaces.', 'Design a concierge version of this feature with no initial development.'],
      ['Wizard of Oz', 'Make automation appear real while work is manual.', 'AI products and automation.', 'How could we test this automation with a Wizard of Oz MVP?'],
      ['Experiment pre-mortem', 'Imagine why an experiment will fail.', 'Experimentation.', 'Before launching this test, list possible reasons for failure and how to prevent them.'],
      ['Learning goal framing', 'Optimize for learning, not only winning.', 'Discovery.', 'Reframe this experiment around what we must learn, with decision criteria.'],
    ],
  },
  {
    id: 'metrics',
    title: 'Causal and Metric Analysis',
    lens: 'Explain what actually moves the metric.',
    accent: 'Causal',
    techniques: [
      ['Metric tree decomposition', 'Break a metric into levers.', 'Product analytics.', 'Decompose this metric into a causal tree: inputs, behaviors, segments, and product levers.'],
      ['Causal loop mapping', 'Identify positive and negative feedback loops.', 'Marketplaces, networks, and engagement.', 'Map the causal loops that amplify or slow this product growth.'],
      ['Funnel diagnosis', 'Diagnose where and why users drop.', 'Activation and conversion.', 'Analyze this funnel and propose likely drop-off causes at each step.'],
      ['Cohort reasoning', 'Think in cohorts rather than averages.', 'Retention.', 'Which cohorts should we compare to understand this retention drop?'],
      ['Counterfactual analysis', 'Compare with what would have happened without the change.', 'Impact measurement.', 'What counterfactual should we use to estimate the real impact of this feature?'],
      ['Leading vs lagging indicators', 'Separate early signals from late outcomes.', 'Steering.', 'Identify the leading indicators that predict this North Star Metric.'],
      ['Metric abuse detection', 'Detect metrics that can be gamed.', 'Governance.', 'How could this metric be optimized in a toxic or misleading way?'],
      ['Segmented diagnosis', 'Avoid global conclusions.', 'Analytics.', 'Segment this problem by user type, maturity, channel, usage, and frequency.'],
    ],
  },
  {
    id: 'ux',
    title: 'Product Design and UX',
    lens: 'Reduce effort and increase perceived value.',
    accent: 'Flow',
    techniques: [
      ['User journey compression', 'Reduce journey steps.', 'UX and activation.', 'Compress this journey to the minimum actions required to reach value.'],
      ['Cognitive load audit', 'Identify mental overload.', 'UX.', 'Analyze this experience through cognitive load: decisions, ambiguities, memory, and effort.'],
      ['Progressive disclosure', 'Reveal complexity gradually.', 'SaaS and onboarding.', 'Which information should be visible immediately, hidden, or revealed later?'],
      ['Default design reasoning', 'Optimize default choices.', 'Adoption and activation.', 'Which defaults maximize user success without reducing user control?'],
      ['Empty state reasoning', 'Turn empty states into activation.', 'Onboarding.', 'Rewrite empty states to guide users toward first value.'],
      ['Error recovery design', 'Improve error cases.', 'Critical UX.', 'List possible errors and design the best recovery paths.'],
      ['Time-to-value reduction', 'Reduce time before perceived value.', 'Activation.', 'How can we bring time-to-value below 2 minutes?'],
      ['Habit loop design', 'Create trigger, action, reward, and investment.', 'Engagement.', 'Describe the potential habit loop of this product and its risks.'],
    ],
  },
  {
    id: 'competition',
    title: 'Differentiation and Competition',
    lens: 'Avoid copycat strategy.',
    accent: 'Edge',
    techniques: [
      ['Competitive teardown', 'Decompose competitors.', 'Positioning.', 'Analyze these competitors: promise, target, UX, pricing, moat, and weaknesses.'],
      ['Contrarian positioning', 'Find an angle opposite to the market.', 'Differentiation.', 'Which dominant market beliefs can we credibly challenge?'],
      ['Underserved segment mining', 'Find neglected segments.', 'Expansion.', 'Which segments are poorly served by existing solutions, and why?'],
      ['Over-served segment analysis', 'Identify users who want something simpler.', 'Low-end disruption.', 'Which users pay for too much complexity? What simpler version could win?'],
      ['Feature parity trap detection', 'Avoid copying competitors by default.', 'Roadmap.', 'Which features in this roadmap are only competitive parity?'],
      ['Substitute analysis', 'Identify non-obvious alternatives.', 'Discovery and strategy.', 'Beyond direct competitors, which alternatives do users really use?'],
      ['Positioning matrix', 'Map differentiation axes.', 'Product marketing.', 'Propose 5 relevant positioning matrices for this market.'],
      ['Category entry point analysis', 'Find buying situations.', 'Growth and brand.', 'In which precise moments does the user think about searching for a solution like this?'],
    ],
  },
  {
    id: 'delivery',
    title: 'Roadmap and Delivery',
    lens: 'Turn intent into shippable outcomes.',
    accent: 'Ship',
    techniques: [
      ['Outcome-based roadmap', 'Roadmap by outcomes, not features.', 'Quarterly roadmap.', 'Transform this feature-based roadmap into an outcome-based roadmap.'],
      ['Now / Next / Later reasoning', 'Simple time-based prioritization.', 'Roadmap communication.', 'Classify these initiatives into Now, Next, Later with explicit criteria.'],
      ['Dependency mapping', 'Identify product, tech, data, and legal dependencies.', 'Delivery.', 'Map the critical dependencies of this initiative.'],
      ['Scope slicing', 'Slice an initiative into deliverable increments.', 'Agile delivery.', 'Slice this feature into independent increments, each delivering measurable value.'],
      ['PRD stress test', 'Test PRD clarity.', 'Specification.', 'Review this PRD as an engineering lead, designer, and sales lead. Where are the ambiguities?'],
      ['Acceptance criteria generation', 'Formalize expected behavior.', 'Delivery.', 'Write acceptance criteria for this user story, including edge cases and errors.'],
      ['Edge-case expansion', 'Explore boundary cases.', 'Product quality.', 'List functional, UX, data, security, and permission edge cases.'],
      ['Launch readiness review', 'Check launch preparation.', 'Release management.', 'Create a launch readiness checklist for this feature.'],
    ],
  },
  {
    id: 'monetization',
    title: 'Monetization and Business Model',
    lens: 'Connect value created to value captured.',
    accent: 'Value',
    techniques: [
      ['Willingness-to-pay reasoning', 'Connect perceived value and price.', 'Pricing.', 'Which signals indicate strong willingness to pay for this segment?'],
      ['Value metric discovery', 'Find the pricing unit.', 'SaaS pricing.', 'Which value metric best reflects value created: seats, usage, volume, or outcome?'],
      ['Packaging matrix', 'Structure Free, Pro, and Enterprise plans.', 'Pricing.', 'Propose a 3-tier packaging model with segmentation and expansion logic.'],
      ['Monetization friction audit', 'Detect purchase blockers.', 'Conversion.', 'Analyze the frictions that prevent users from becoming paid customers.'],
      ['Expansion revenue reasoning', 'Identify upsell levers.', 'B2B SaaS.', 'Which usage moments indicate an expansion or upsell opportunity?'],
      ['Free-to-paid bridge', 'Create a natural path to paid.', 'PLG.', 'Design the bridge between free usage and paid conversion without degrading trust.'],
      ['ROI framing', 'Express economic value.', 'B2B.', 'Translate this value proposition into quantifiable ROI for a B2B buyer.'],
      ['Pricing risk simulation', 'Simulate reactions to pricing.', 'Pricing strategy.', 'Simulate how different segments would react to these pricing options.'],
    ],
  },
  {
    id: 'gtm',
    title: 'Go-to-Market and Adoption',
    lens: 'Make the value legible and adopted.',
    accent: 'Adopt',
    techniques: [
      ['Message-market fit', 'Test clarity of the promise.', 'Positioning.', 'Evaluate this value proposition: is it specific, urgent, differentiated, and credible?'],
      ['Landing page reasoning', 'Structure a page around objections.', 'Acquisition.', 'Design a landing page that answers objections in the right order.'],
      ['Sales narrative mapping', 'Align sales pitch and product.', 'B2B.', 'Transform this feature into a sales narrative: pain, impact, proof, demo, and objection.'],
      ['Adoption path design', 'Design the internal adoption path.', 'Enterprise.', 'For a B2B sale, map users, buyers, blockers, and champions.'],
      ['Launch tiering', 'Choose soft launch, beta, or GA.', 'Release.', 'Which launch type fits this feature: closed beta, public beta, or GA?'],
      ['Enablement generation', 'Produce sales and support docs.', 'GTM.', 'Create enablement assets: pitch, FAQ, objections, demo script, and release note.'],
      ['Activation campaign reasoning', 'Trigger usage after launch.', 'Adoption.', 'Propose an activation campaign around this feature for existing users.'],
      ['Retention messaging', 'Use communication to reinforce usage.', 'Lifecycle.', 'Which messages would increase retention without being intrusive?'],
    ],
  },
  {
    id: 'risk',
    title: 'Risk, Critique, and Decision Quality',
    lens: 'Attack weak thinking before reality does.',
    accent: 'Risk',
    techniques: [
      ['Pre-mortem', 'Imagine failure before acting.', 'Roadmap and launch.', 'We launched this initiative and it failed. Give the 10 most likely causes.'],
      ['Red team', 'Attack an idea like an opponent.', 'Product decision.', 'Critique this strategy as a competitor, CFO, skeptical user, and engineer.'],
      ['Second-order effects', 'Look for indirect effects.', 'Pricing, engagement, and marketplaces.', 'What second-order effects could this decision create?'],
      ['Inversion', 'Find how to cause failure.', 'Decision quality.', 'How could we maximize churn with this decision? Then invert the answers.'],
      ['Bias audit', 'Detect cognitive and organizational bias.', 'Governance.', 'Which biases could affect our judgment here: confirmation, survivorship, HIPPO, or sunk cost?'],
      ['Decision memo', 'Formalize a reversible or irreversible decision.', 'Leadership.', 'Write a decision memo: context, options, criteria, recommendation, risks, and decision.'],
      ['Disconfirming evidence search', 'Search for what contradicts the idea.', 'Validation.', 'Which evidence would try to invalidate this hypothesis?'],
      ['Kill criteria definition', 'Define when to stop.', 'Experimentation and roadmap.', 'Define the objective criteria that will make us stop this initiative.'],
    ],
  },
];

const categoryExpansions = {
  ideation: [
    ['Constraint removal', 'Remove one major constraint and explore the product that becomes possible.', 'Breakthrough ideation.', 'If this product no longer had this constraint, what new product opportunities would become possible? Then rank which are still feasible.'],
    ['Analogical transfer', 'Borrow patterns from another industry or product category.', 'Non-obvious feature discovery.', 'Which patterns from unrelated industries could solve this user problem? Translate them into product concepts.'],
    ['Non-consumption mining', 'Look for users who do nothing today because existing solutions are too hard.', 'Market creation.', 'Who is not using any solution today, and what minimum product would make adoption possible for them?'],
  ],
  discovery: [
    ['Trigger event mapping', 'Identify the event that makes the need urgent.', 'Demand discovery.', 'What events trigger this user to actively seek a solution, and what do they try first?'],
    ['Alternative timeline reconstruction', 'Rebuild the sequence of solutions users tried before arriving here.', 'Switching research.', 'Reconstruct the timeline of alternatives this user tried, including what failed at each step.'],
    ['Demand intensity scoring', 'Score demand by urgency, frequency, pain, and current spend.', 'Opportunity qualification.', 'Score these needs by urgency, frequency, pain intensity, current workaround cost, and willingness to switch.'],
  ],
  strategy: [
    ['Playing field definition', 'Define the real arena of competition before choosing strategy.', 'Strategic framing.', 'What game are we actually playing: workflow, system of record, marketplace, infrastructure, or point solution?'],
    ['Strategic option set', 'Generate mutually exclusive strategic paths.', 'Leadership decision.', 'Create 4 mutually exclusive strategic options, with what each requires, refuses, and risks.'],
    ['Expansion path mapping', 'Map how a wedge can expand into adjacent segments or workflows.', 'Long-term roadmap.', 'Starting from this wedge, map credible expansion paths by segment, workflow, data, and channel.'],
  ],
  prioritization: [
    ['Confidence decomposition', 'Separate confidence into evidence, feasibility, and strategic clarity.', 'Score quality improvement.', 'Decompose confidence for each initiative into user evidence, technical feasibility, and strategic alignment.'],
    ['Regret minimization', 'Prioritize by the future regret of not acting.', 'Ambiguous roadmap choices.', 'Which option would we most regret not testing in 6 months, and why?'],
    ['Risk-adjusted roadmap', 'Balance expected upside against delivery and adoption risk.', 'Roadmap governance.', 'Re-rank this roadmap by risk-adjusted value, not raw impact.'],
  ],
  experimentation: [
    ['Fake-door experiment', 'Measure intent with an entry point before building.', 'Demand validation.', 'Design a fake-door test that measures real intent without misleading users or damaging trust.'],
    ['Prototype interview test', 'Use a prototype to reveal comprehension, desire, and objections.', 'Concept validation.', 'Design a prototype interview script to test comprehension, perceived value, and objections.'],
    ['Decision threshold design', 'Define what result will change the decision before launching a test.', 'Experiment governance.', 'Define success, failure, and inconclusive thresholds for this experiment before launch.'],
  ],
  metrics: [
    ['Metric instrumentation audit', 'Check whether the metric can actually be trusted.', 'Analytics quality.', 'Audit whether this metric is instrumented well enough to support a product decision.'],
    ['Proxy metric validation', 'Test whether a proxy metric predicts the real outcome.', 'Early signal design.', 'Which proxy metrics could predict the target outcome, and how would we validate them?'],
    ['Behavioral segmentation', 'Segment by behavior rather than demographics.', 'Product analytics.', 'Segment users by behavior patterns that could explain this metric movement.'],
  ],
  ux: [
    ['Comprehension test', 'Check whether users understand what the product does and what to do next.', 'UX clarity.', 'Audit this screen for comprehension: what will users understand, miss, or misinterpret?'],
    ['Decision architecture audit', 'Evaluate how choices are structured and whether defaults guide success.', 'Complex UX.', 'Analyze the decision architecture: choices, defaults, sequencing, and risk of wrong selections.'],
    ['Trust surface audit', 'Identify where users need reassurance, proof, or control.', 'Conversion and onboarding.', 'Where does this experience require trust, proof, transparency, or control to move forward?'],
  ],
  competition: [
    ['Switching cost teardown', 'Analyze what makes competitors hard to leave.', 'Competitive strategy.', 'Break down competitor switching costs across data, workflow, integrations, habit, and procurement.'],
    ['White-space mapping', 'Find areas competitors systematically ignore.', 'Market positioning.', 'Map the white spaces competitors ignore by segment, use case, price point, and workflow depth.'],
    ['Capability asymmetry', 'Find where our strengths create a different game.', 'Differentiation.', 'Which capabilities do we have that competitors cannot easily copy, and what product strategy do they enable?'],
  ],
  delivery: [
    ['Thin-slice sequencing', 'Order slices so each reduces the biggest uncertainty.', 'Incremental delivery.', 'Sequence this initiative into thin slices that each reduce a major uncertainty or deliver measurable value.'],
    ['Operational readiness audit', 'Check support, monitoring, process, and rollout readiness.', 'Launch operations.', 'Audit operational readiness: support, monitoring, rollback, documentation, enablement, and ownership.'],
    ['Requirements ambiguity scan', 'Find vague requirements before engineering starts.', 'Spec quality.', 'Scan these requirements for ambiguity, hidden dependencies, edge cases, and undefined acceptance criteria.'],
  ],
  monetization: [
    ['Price fence design', 'Create packaging fences that segment customers fairly.', 'Packaging.', 'Design price fences that separate segments by value received without creating resentment.'],
    ['Usage expansion trigger', 'Identify usage signals that indicate readiness to expand.', 'Expansion revenue.', 'Which usage events indicate a customer is ready for upgrade, expansion, or enterprise sales?'],
    ['Budget owner mapping', 'Identify who owns the budget and what value they recognize.', 'B2B pricing.', 'Map user, buyer, budget owner, economic sponsor, and the ROI each one cares about.'],
  ],
  gtm: [
    ['Channel-message fit', 'Match promise, audience, and acquisition channel.', 'GTM planning.', 'Which channels fit this message and audience, and what promise should lead in each channel?'],
    ['Proof asset mapping', 'Identify the evidence needed to make claims credible.', 'PMM enablement.', 'What proof assets are required to make this positioning credible: demo, benchmark, case study, quote, ROI model?'],
    ['Champion enablement path', 'Help an internal champion sell the product inside their organization.', 'Enterprise adoption.', 'Design the internal champion path: narrative, proof, objection handling, and stakeholder-specific materials.'],
  ],
  risk: [
    ['Assumption decay audit', 'Check whether old assumptions are still valid.', 'Strategic governance.', 'Which assumptions behind this product decision may have decayed, and what evidence should refresh them?'],
    ['Reversibility analysis', 'Classify decisions by reversibility and blast radius.', 'Decision quality.', 'Classify these decisions by reversibility, blast radius, and required evidence threshold.'],
    ['Failure mode prioritization', 'Rank failure modes by probability, severity, and detectability.', 'Risk management.', 'List failure modes and rank them by probability, severity, detectability, and prevention action.'],
  ],
};

const expandedCategories = categories.map((category) => ({
  ...category,
  techniques: [...category.techniques, ...(categoryExpansions[category.id] || [])],
}));

const nativeTechniques = [
  ['Multi-agent simulation', 'LLMs can simulate multiple stakeholders.', 'Make a PM, designer, engineer, sales lead, CFO, and expert user debate this roadmap.'],
  ['Adversarial refinement', 'Generate, attack, then improve.', 'Propose 10 ideas, critique them harshly, then rebuild the best 3.'],
  ['Context distillation', 'Turn raw data into useful signals.', 'Here are 100 verbatims. Extract actionable patterns for the roadmap.'],
  ['Option generation under constraints', 'Use constraints to force creativity.', 'Propose 20 solutions with no new interface, no ML, and delivery in under 2 weeks.'],
  ['Synthetic edge-case generation', 'Imagine difficult boundary cases.', 'List unexpected user behaviors that could break this feature.'],
  ['Prompt chaining', 'Sequence specialized reasoning steps.', 'Discovery -> assumptions -> experiments -> roadmap -> PRD.'],
  ['Assumption ledger', 'Maintain a product assumption register.', 'Create a table of assumptions, evidence, confidence level, and next test.'],
  ['Decision sparring partner', 'Use an LLM as a structured opponent.', 'I think we should prioritize X. Find the reasons why this is a bad decision.'],
  ['Narrative compression', 'Turn product complexity into a clear message.', 'Explain this strategy in 1 sentence, 1 paragraph, then 1 executive slide.'],
  ['Model switching', 'Apply several mental models to one problem.', 'Analyze this problem with JTBD, systems thinking, RICE, pre-mortem, and pricing lens.'],
];

const combos = [
  ['Find an obvious next feature', ['Journey mapping', 'Fill the gap', 'Friction mining', 'Opportunity sizing', 'Riskiest assumption test', 'Scope slicing'], 'Identify the clearest gaps, convert them into opportunities, estimate impact, then propose 3 candidate features with MVP, success metric, and main risk.'],
  ['Create a quarterly roadmap', ['North Star decomposition', 'Metric tree', 'Bottleneck analysis', 'Opportunity sizing', 'RICE / Cost of Delay', 'Outcome-based roadmap'], 'Build an outcome-oriented quarterly roadmap from the North Star, current metrics, and team constraints.'],
  ['Challenge a feature idea', ['Assumption mapping', 'Red team', 'Pre-mortem', 'Disconfirming evidence', 'MVP laddering'], 'Identify critical assumptions, failure modes, invalidating evidence, and the fastest test before engineering investment.'],
  ['Find a differentiation strategy', ['Competitive teardown', 'Substitute analysis', 'Contrarian positioning', 'Underserved segment mining', 'Strategic narrative'], 'Find underserved segments and contestable market beliefs, then propose differentiated positionings with narrative.'],
  ['Improve activation and retention', ['Funnel diagnosis', 'Moment of truth mapping', 'Time-to-value reduction', 'Habit loop design', 'Experiment design'], 'Identify drop-off moments, propose product improvements, and design experiments ranked by learning speed.'],
];

const pmSituations = [
  {
    id: 'discover',
    label: 'Discover an opportunity',
    question: 'What should we build next?',
    output: 'Opportunity shortlist with assumptions and fastest validation test.',
    techniques: ['JTBD decomposition', 'Customer struggle mining', 'Fill the gap', 'Opportunity sizing', 'Riskiest assumption test'],
    promptPattern: 'Use evidence-grounded synthesis before ideation: quote -> inferred need -> opportunity -> risk -> test.',
  },
  {
    id: 'prioritize',
    label: 'Prioritize a roadmap',
    question: 'What deserves team capacity now?',
    output: 'Outcome-based roadmap with scoring rationale and confidence flags.',
    techniques: ['North Star decomposition', 'Metric tree decomposition', 'Bottleneck prioritization', 'Cost of Delay', 'Outcome-based roadmap'],
    promptPattern: 'Use rubric calibration: define scoring anchors before ranking and force a challenge pass on weak confidence.',
  },
  {
    id: 'validate',
    label: 'Validate before building',
    question: 'What must be true before engineering invests?',
    output: 'Assumption map, riskiest test, decision threshold, and kill criteria.',
    techniques: ['Assumption mapping', 'Riskiest assumption test', 'Smoke test design', 'MVP laddering', 'Kill criteria definition'],
    promptPattern: 'Use hypothesis-first prompting: falsifiable assumption -> threshold -> minimum test -> decision rule.',
  },
  {
    id: 'differentiate',
    label: 'Differentiate the product',
    question: 'Why should the market choose us?',
    output: 'Contrarian positioning options and strategic narrative.',
    techniques: ['Competitive teardown', 'Substitute analysis', 'Contrarian positioning', 'Underserved segment mining', 'Strategic narrative building'],
    promptPattern: 'Use adversarial positioning: compare direct competitors, substitutes, and non-consumption before writing claims.',
  },
  {
    id: 'improve',
    label: 'Improve a metric',
    question: 'What is really moving the number?',
    output: 'Causal diagnosis, segments, leading indicators, and experiments.',
    techniques: ['Metric tree decomposition', 'Funnel diagnosis', 'Segmented diagnosis', 'Leading vs lagging indicators', 'Experiment pre-mortem'],
    promptPattern: 'Use causal decomposition: drivers, confounders, counterfactuals, segment effects, and leading indicators.',
  },
  {
    id: 'launch',
    label: 'Launch and drive adoption',
    question: 'How do we make the value obvious and used?',
    output: 'Launch mode, message hierarchy, enablement pack, and activation plan.',
    techniques: ['Message-market fit', 'Landing page reasoning', 'Launch tiering', 'Enablement generation', 'Activation campaign reasoning'],
    promptPattern: 'Use objection-first messaging: list adoption objections before writing narrative, landing page, or enablement.',
  },
];

const taxonomy = [
  ['Feature ideas', 'Fill the gap, friction mining, workaround mining, adjacent possible'],
  ['Understand users', 'JTBD, switching forces, struggle mining, synthetic interviews'],
  ['Prioritize', 'RICE, ICE, Cost of Delay, expected value, bottleneck analysis'],
  ['Validate', 'Assumption mapping, riskiest assumption test, smoke test, concierge MVP'],
  ['Improve metrics', 'Metric tree, funnel diagnosis, cohort reasoning, causal loop mapping'],
  ['Build strategy', 'First principles, wedge strategy, category design, moat reasoning'],
  ['Differentiate', 'Competitive teardown, contrarian positioning, underserved segment mining'],
  ['Launch', 'Message-market fit, launch tiering, adoption path, enablement generation'],
  ['Reduce risk', 'Pre-mortem, red team, inversion, kill criteria'],
  ['Specify', 'PRD stress test, edge-case expansion, acceptance criteria, scope slicing'],
];

const mentalFamilies = [
  ['Gap reasoning', 'What is naturally missing?'],
  ['Friction reasoning', 'What blocks, slows, or irritates?'],
  ['Causal reasoning', 'What really influences the metric?'],
  ['Strategic reasoning', 'Where to play, how to win, what to refuse?'],
  ['Experimental reasoning', 'Which assumption should be tested before building?'],
  ['Adversarial reasoning', 'Why could this idea be false?'],
  ['Narrative reasoning', 'How do we make value obvious to the market?'],
];

const topTechniques = [
  ['01', 'Fill the gap', 'Finds natural features'],
  ['02', 'JTBD', 'Clarifies the real need'],
  ['03', 'Friction mining', 'Turns pain into opportunity'],
  ['04', 'Assumption mapping', 'Avoids building on ambiguity'],
  ['05', 'Riskiest assumption test', 'Reduces risk fast'],
  ['06', 'Metric tree', 'Connects product and business impact'],
  ['07', 'Funnel diagnosis', 'Improves activation and conversion'],
  ['08', 'Pre-mortem', 'Anticipates failure'],
  ['09', 'Red team', 'Improves decision quality'],
  ['10', 'Cost of Delay', 'Prioritizes with business logic'],
  ['11', 'Opportunity sizing', 'Avoids tiny optimizations'],
  ['12', 'Scope slicing', 'Ships faster'],
  ['13', 'First principles', 'Creates non-mimetic solutions'],
  ['14', 'Contrarian positioning', 'Creates real differentiation'],
  ['15', 'Wedge strategy', 'Finds the right entry point'],
  ['16', 'Time-to-value reduction', 'Improves activation'],
  ['17', 'Switching forces', 'Explains real adoption'],
  ['18', 'Moat reasoning', 'Thinks long-term advantage'],
  ['19', 'Message-market fit', 'Makes value legible'],
  ['20', 'Kill criteria', 'Prevents unproductive persistence'],
];

const allTechniques = expandedCategories.flatMap((category) =>
  category.techniques.map(([name, principle, use, prompt]) => ({
    categoryId: category.id,
    categoryTitle: category.title,
    name,
    principle,
    use,
    prompt,
  }))
);

function findTechniqueByName(name) {
  return allTechniques.find((technique) => technique.name === name);
}

const promptEngineeringBoosts = {
  ideation: 'Use divergent-convergent prompting: generate many options first, then force ranking with explicit constraints and rejection criteria.',
  discovery: 'Use evidence-grounded synthesis: separate raw user quotes, inferred needs, confidence level, and follow-up questions.',
  strategy: 'Use multi-lens reasoning: analyze the same problem through customer, market, moat, channel, and trade-off lenses before recommending.',
  prioritization: 'Use rubric calibration: define scoring anchors before ranking, then ask the LLM to challenge low-confidence scores.',
  experimentation: 'Use hypothesis-first prompting: state the falsifiable assumption, decision threshold, minimum test, and kill criteria before designing the experiment.',
  metrics: 'Use causal decomposition: ask for drivers, confounders, counterfactuals, and leading indicators instead of metric commentary.',
  ux: 'Use cognitive walkthrough prompting: force the LLM to simulate user intent, attention, decisions, errors, and recovery at each step.',
  competition: 'Use adversarial positioning: compare direct competitors, substitutes, and non-consumption, then force a contrarian angle.',
  delivery: 'Use specification stress testing: ask the LLM to inspect the artifact as engineering, design, support, sales, and security.',
  monetization: 'Use segment simulation: evaluate pricing and packaging separately for buyer, user, admin, and economic sponsor.',
  gtm: 'Use objection-first messaging: list adoption objections before writing the narrative, landing page, or enablement assets.',
  risk: 'Use adversarial pre-mortem prompting: generate failure modes, disconfirming evidence, second-order effects, and stop conditions.',
};

const contextQualityGate = `Before answering, run a context-quality-gate:
1. List the context elements I provided that are sufficient for the objective.
2. List the missing or weak context elements that would materially improve the answer.
3. Separate facts, assumptions, and inferences.
4. If critical context is missing, ask up to 5 targeted clarification questions.
5. If the task can still proceed, state the assumptions you will use and mark confidence as High / Medium / Low.`;

const categoryLineage = {
  ideation: ['Design thinking, creativity research, product discovery', 'Turns raw observations into candidate product moves before prioritization.'],
  discovery: ['Jobs-to-be-Done, customer development, qualitative research', 'Prevents teams from confusing stated preferences with real demand.'],
  strategy: ['Business strategy, category design, positioning, systems thinking', 'Helps decide where to compete, what to refuse, and how advantages compound.'],
  prioritization: ['Lean product management, portfolio management, decision science', 'Makes trade-offs explicit when time, team capacity, and confidence are limited.'],
  experimentation: ['Lean Startup, scientific method, experiment design', 'Reduces waste by testing the riskiest belief before building too much.'],
  metrics: ['Product analytics, causal inference, systems thinking', 'Connects user behavior to measurable outcomes without over-trusting averages.'],
  ux: ['Human-computer interaction, usability heuristics, service design', 'Reduces cognitive effort so users reach value faster and recover from errors.'],
  competition: ['Competitive strategy, positioning, disruption theory', 'Avoids feature-copying by identifying real alternatives, substitutes, and neglected segments.'],
  delivery: ['Agile delivery, requirements engineering, release management', 'Turns product intent into shippable, testable, and aligned execution.'],
  monetization: ['SaaS pricing, value-based pricing, revenue strategy', 'Connects value created to value captured without damaging adoption or trust.'],
  gtm: ['Product marketing, sales enablement, adoption strategy', 'Makes product value legible to buyers, users, champions, and channels.'],
  risk: ['Decision analysis, pre-mortem practice, red-team review', 'Improves decision quality by attacking weak assumptions before reality does.'],
};

const techniqueProfileOverrides = {
  'JTBD decomposition': ['Jobs-to-be-Done theory and switch interview practice', 'Use it when feature requests are noisy and you need to understand the underlying progress users seek.'],
  'RICE critique': ['Intercom-style product prioritization rubric', 'Use it to make prioritization assumptions visible, especially confidence and effort.'],
  'ICE fast ranking': ['Growth experimentation and fast prioritization practice', 'Use it when speed matters more than precision and you need a first cut.'],
  'Cost of Delay': ['Lean, Kanban, and economics of flow', 'Use it when waiting has measurable business, churn, risk, or learning cost.'],
  'First-principles reasoning': ['Physics-inspired reasoning adapted to strategy and product design', 'Use it when market conventions are constraining the solution space.'],
  'Pre-mortem': ['Decision psychology and prospective hindsight', 'Use it before launch or investment to surface preventable failure modes.'],
  'Red team': ['Adversarial review from security, military, and strategy practices', 'Use it when optimism, politics, or sunk cost may be weakening judgment.'],
  'Metric tree decomposition': ['Analytics trees, driver trees, and causal product analysis', 'Use it to connect product work to business outcomes and leading indicators.'],
  'Concierge MVP': ['Lean Startup and service prototyping', 'Use it to validate value manually before automating or scaling.'],
  'Wizard of Oz': ['HCI prototyping and AI/automation validation', 'Use it to test perceived automation value before building the system.'],
};

function getTechniqueProfile(technique) {
  const [origin, benefit] =
    techniqueProfileOverrides[technique.name] || categoryLineage[technique.categoryId] || categoryLineage.strategy;

  return {
    origin,
    benefit,
    inputs: [
      'Clear product objective',
      'Target user or segment',
      'Available evidence or metrics',
      'Constraints and decision deadline',
    ],
    deliverable: `${technique.use} artifact with assumptions, risks, confidence, and next validation step.`,
  };
}

function techniqueKey(technique) {
  return `${technique.categoryId}::${technique.name}`;
}

function normalizeTechnique(category, technique) {
  const [name, principle, use, prompt] = technique;
  return {
    categoryId: category.id,
    categoryTitle: category.title,
    name,
    principle,
    use,
    prompt,
  };
}

export default function ProductReasoningAtlas() {
  const [activeCategory, setActiveCategory] = useState(expandedCategories[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('family');
  const [activeSituationId, setActiveSituationId] = useState(pmSituations[0].id);
  const [activeComboIndex, setActiveComboIndex] = useState(0);
  const [activeNativeIndex, setActiveNativeIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState('ideation::Fill the gap');
  const [copyState, setCopyState] = useState('Copy full prompt');
  const [comboCopyState, setComboCopyState] = useState('Copy full chain prompt');
  const [nativeCopyState, setNativeCopyState] = useState('Copy native prompt');
  const active = expandedCategories.find((category) => category.id === activeCategory) || expandedCategories[0];
  const activeSituation = pmSituations.find((situation) => situation.id === activeSituationId) || pmSituations[0];
  const activeCombo = combos[activeComboIndex] || combos[0];
  const activeNative = nativeTechniques[activeNativeIndex] || nativeTechniques[0];
  const query = searchQuery.trim().toLowerCase();
  const familyTechniques = active.techniques.map((technique) => normalizeTechnique(active, technique));
  const searchableTechniques = searchScope === 'all' ? allTechniques : familyTechniques;
  const visibleTechniques = query
    ? searchableTechniques.filter((technique) =>
        [technique.name, technique.principle, technique.use, technique.prompt, technique.categoryTitle]
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
    : familyTechniques;
  const selectedTechnique =
    visibleTechniques.find((technique) => techniqueKey(technique) === selectedKey) || visibleTechniques[0];
  const selectedProfile = selectedTechnique ? getTechniqueProfile(selectedTechnique) : null;
  const recommendedTechniques = activeSituation.techniques.map(findTechniqueByName).filter(Boolean);

  useEffect(() => {
    document.body.classList.add('no-scanlines', 'atlas-body');
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    document.title = 'LLM Reasoning for Product Management';
    document.documentElement.lang = 'en';
    return () => {
      document.body.classList.remove('no-scanlines', 'atlas-body');
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
    };
  }, []);

  useEffect(() => {
    if (!visibleTechniques.length) return;
    if (!visibleTechniques.some((technique) => techniqueKey(technique) === selectedKey)) {
      setSelectedKey(techniqueKey(visibleTechniques[0]));
    }
  }, [selectedKey, visibleTechniques]);

  async function handleCopyPrompt() {
    if (!selectedTechnique) return;
    const boost = promptEngineeringBoosts[selectedTechnique.categoryId];
    const profile = getTechniqueProfile(selectedTechnique);
    const copyText = `Role:
You are a senior product strategist and product discovery lead. You reason rigorously, separate evidence from assumptions, and optimize for actionable product decisions.

Product objective:
Use the "${selectedTechnique.name}" technique to help with this PM objective: ${selectedTechnique.use}.

Input context to use:
- Product / feature:
- Target users / segment:
- Current journey or workflow:
- Available metrics:
- User evidence / verbatims:
- Business constraints:
- Technical / legal / operational constraints:
- Decision deadline:

Technique to apply:
${selectedTechnique.name}

Technique principle:
${selectedTechnique.principle}

Technique origin / lineage:
${profile.origin}

Why this technique is useful:
${profile.benefit}

Prompt kernel:
${selectedTechnique.prompt}

Context-quality-gate:
${contextQualityGate}

Prompt engineering boost:
${boost}

Reasoning protocol:
1. Restate the objective in product-management language.
2. Identify the decision this analysis should enable.
3. Apply the technique step by step, making intermediate reasoning visible.
4. Distinguish user value, business value, feasibility, and risk.
5. Challenge your own recommendation with a brief red-team pass.

Output requirements:
- Use a structured table where options are compared.
- Separate facts, assumptions, inferences, and recommendations.
- Rank options by impact, confidence, effort, risk, and evidence strength.
- Include the missing context that would change the recommendation.
- End with: recommended next action, fastest validation test, success metric, owner, expected learning, and kill criteria.

Quality bar:
- Do not invent evidence. If evidence is missing, say so.
- Prefer precise trade-offs over generic best practices.
- Make the answer directly usable by a PM in a roadmap, discovery, or decision memo.`;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState('Copied');
      window.setTimeout(() => setCopyState('Copy full prompt'), 1400);
    } catch {
      setCopyState('Copy failed');
      window.setTimeout(() => setCopyState('Copy full prompt'), 1600);
    }
  }

  async function handleCopyComboPrompt() {
    const [goal, steps, prompt] = activeCombo;
    const copyText = `Role:
You are a senior product strategist facilitating a structured product decision. Your job is to run a reasoning chain, not provide a generic answer.

Objective:
${goal}

Input context to use:
- Product / feature:
- Target users / segment:
- Current metrics:
- Funnel / journey:
- User evidence:
- Constraints:
- Team capacity:
- Time horizon:

Reasoning chain to apply:
${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Context-quality-gate:
${contextQualityGate}

Task:
${prompt}

Reasoning protocol:
1. Explain why this chain is appropriate for the objective.
2. Run each reasoning step in order.
3. Preserve intermediate conclusions before moving to the next step.
4. Highlight contradictions, weak evidence, and decision risks.
5. Synthesize the chain into a final product recommendation.

Output requirements:
- Separate facts, assumptions, inferences, and recommendations.
- Rank options by impact, confidence, effort, risk, and learning value.
- End with the decision, fastest validation test, owner, metric, risk, and kill criteria.

Quality bar:
- Do not collapse the chain into one generic answer.
- Do not invent data. Mark unsupported claims as assumptions.
- Prefer decision-ready specificity over framework explanation.`;

    try {
      await navigator.clipboard.writeText(copyText);
      setComboCopyState('Copied');
      window.setTimeout(() => setComboCopyState('Copy full chain prompt'), 1400);
    } catch {
      setComboCopyState('Copy failed');
      window.setTimeout(() => setComboCopyState('Copy full chain prompt'), 1600);
    }
  }

  async function handleCopyNativePrompt() {
    const [name, why, example] = activeNative;
    const copyText = `Role:
You are an expert product strategy sparring partner using an LLM-native reasoning mode. Your output must be useful for a real product decision.

LLM-native technique:
${name}

Why this technique is useful:
${why}

Input context to use:
- Product / feature:
- User segment:
- Market / competitors:
- Constraints:
- Current decision:
- Evidence available:
- Stakeholders involved:

Prompt to run:
${example}

Context-quality-gate:
${contextQualityGate}

Execution protocol:
1. State what the LLM-native mode is simulating or transforming.
2. Run the interaction pattern explicitly.
3. Extract useful signals from speculative or weak signals.
4. Translate the output into product actions.
5. Add a red-team critique of the result.

Output requirements:
- Explain which stakeholder, constraint, or reasoning mode is being simulated.
- Make assumptions explicit.
- Separate useful signals from speculative output.
- End with actions a product manager can actually take, ranked by impact, confidence, effort, and risk.

Quality bar:
- Do not treat simulated users or stakeholders as real evidence.
- Label simulation outputs clearly.
- Convert the result into decision-ready next steps.`;

    try {
      await navigator.clipboard.writeText(copyText);
      setNativeCopyState('Copied');
      window.setTimeout(() => setNativeCopyState('Copy native prompt'), 1400);
    } catch {
      setNativeCopyState('Copy failed');
      window.setTimeout(() => setNativeCopyState('Copy native prompt'), 1600);
    }
  }

  function focusTechnique(technique) {
    setActiveCategory(technique.categoryId);
    setSearchQuery('');
    setSearchScope('family');
    setSelectedKey(techniqueKey(technique));
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectSituation(situation) {
    setActiveSituationId(situation.id);
    const firstTechnique = situation.techniques.map(findTechniqueByName).find(Boolean);
    if (firstTechnique) {
      setActiveCategory(firstTechnique.categoryId);
      setSearchQuery('');
      setSearchScope('family');
      setSelectedKey(techniqueKey(firstTechnique));
    }
  }

  return (
    <main className="atlas-page">
      <section className="atlas-hero">
        <div className="atlas-grid-bg" aria-hidden="true" />
        <nav className="atlas-nav" aria-label="Page sections">
          <span className="atlas-mark">PM/RX</span>
          <a href="#library">Library</a>
          <a href="#chains">Chains</a>
          <a href="#templates">Templates</a>
        </nav>

        <div className="atlas-hero-content">
          <div className="atlas-kicker">Interactive decision system for AI-augmented product management</div>
          <h1>Pick the right LLM reasoning pattern before you prompt.</h1>
          <p>
            Start with the product decision you need to make. The atlas recommends a reasoning chain, checks context
            quality, and gives you a copy-ready prompt with the right prompt-engineering pattern.
          </p>
          <div className="atlas-hero-actions">
            <a href="#library" onClick={(event) => {
              event.preventDefault();
              if (recommendedTechniques[0]) focusTechnique(recommendedTechniques[0]);
            }}>
              Open recommended technique
            </a>
            <a href="#templates">Use master prompt</a>
          </div>
          <div className="atlas-hero-summary" aria-label="Atlas summary">
            <div><strong>12</strong><span>families</span></div>
            <div><strong>{allTechniques.length}</strong><span>techniques</span></div>
            <div><strong>1</strong><span>decision path</span></div>
          </div>
        </div>

        <aside className="hero-workbench" aria-label="Interactive reasoning selector">
          <div className="hero-workbench-head">
            <span>Start here</span>
            <strong>Choose the decision, then open the matching chain.</strong>
          </div>
          <div className="hero-situation-grid">
            {pmSituations.map((situation) => (
              <button
                aria-pressed={situation.id === activeSituationId}
                className={situation.id === activeSituationId ? 'is-active' : ''}
                key={situation.id}
                onClick={() => selectSituation(situation)}
                type="button"
              >
                <strong>{situation.label}</strong>
                <small>{situation.question}</small>
              </button>
            ))}
          </div>
          <div className="hero-recommendation">
            <span>Recommended chain</span>
            <h2>{activeSituation.output}</h2>
            <div className="hero-chain">
              {recommendedTechniques.slice(0, 5).map((technique, index) => (
                <button key={techniqueKey(technique)} onClick={() => focusTechnique(technique)} type="button">
                  <em>{index + 1}</em>
                  <strong>{technique.name}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="hero-quality-gate">
            <span>Built into copied prompts</span>
            <strong>Context-quality-gate</strong>
            <p>Audits missing inputs, assumptions, confidence and clarification questions before producing the answer.</p>
          </div>
        </aside>
      </section>

      <section className="atlas-section atlas-principle">
        <div className="atlas-section-heading">
          <span>General Principle</span>
          <h2>The value comes from choosing the reasoning engine.</h2>
        </div>
        <p>
          A strong PM prompt combines context, a reasoning engine, critique, and a precise output format. The
          highest leverage move is not asking an LLM for ideas. It is forcing it to apply a specific thinking pattern
          to a product problem.
        </p>
      </section>

      <section className="atlas-section" id="library">
        <div className="atlas-section-heading">
          <span>Technique Library</span>
          <h2>Pick a family, then inspect one card.</h2>
        </div>

        <div className="library-help">
          <strong>Use this flow</strong>
          <p>
            1. Choose a family.
            2. Click a technique card.
            3. Copy the prompt and paste your product context into the LLM.
          </p>
        </div>

        <div className="atlas-controls" aria-label="Technique explorer controls">
          <label>
            <span>Search</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Try: pricing, funnel, red team, roadmap, activation..."
            />
          </label>
          <div className="scope-toggle" aria-label="Search scope">
            <span>Scope</span>
            <div>
              <button
                aria-pressed={searchScope === 'family'}
                className={searchScope === 'family' ? 'is-active' : ''}
                onClick={() => setSearchScope('family')}
                type="button"
              >
                Family only
              </button>
              <button
                aria-pressed={searchScope === 'all'}
                className={searchScope === 'all' ? 'is-active' : ''}
                onClick={() => setSearchScope('all')}
                type="button"
              >
                All techniques
              </button>
            </div>
          </div>
          <div className="atlas-control-stat">
            <strong>{visibleTechniques.length}</strong>
            <span>
              {query
                ? searchScope === 'all'
                  ? 'matching techniques in all atlas'
                  : 'matching techniques in this family'
                : `${active.title} techniques`}
            </span>
          </div>
          <button type="button" onClick={() => setSearchQuery('')} disabled={!searchQuery}>
            Reset
          </button>
        </div>

        <div className="atlas-category-layout">
          <div className="atlas-category-rail" aria-label="Technique categories">
            {expandedCategories.map((category, index) => (
              <button
                className={category.id === activeCategory ? 'is-active' : ''}
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchQuery('');
                }}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {category.title}
              </button>
            ))}
          </div>

          <article className="atlas-category-panel">
            <div className="panel-head">
              <div>
                <span className="panel-accent">{query ? 'Search results' : 'Technique cards'}</span>
                <h3>{query ? 'Filtered techniques' : active.title}</h3>
                <p>
                  {query
                    ? `Matching "${searchQuery.trim()}".`
                    : `${active.lens} Click a card to inspect the technique and copy the prompt.`}
                </p>
              </div>
              <strong>{visibleTechniques.length} techniques</strong>
            </div>

            <div className="technique-workbench">
              <div className="technique-card-grid" aria-label="Selectable techniques">
                {visibleTechniques.map((technique) => (
                  <button
                    className={techniqueKey(technique) === selectedKey ? 'is-selected' : ''}
                    key={techniqueKey(technique)}
                    onClick={() => setSelectedKey(techniqueKey(technique))}
                    type="button"
                  >
                    <span>{technique.categoryTitle}</span>
                    <strong>{technique.name}</strong>
                    <small>{technique.use}</small>
                    <em>Inspect prompt</em>
                  </button>
                ))}
                {!visibleTechniques.length && (
                  <div className="empty-result">
                    <strong>No technique found.</strong>
                    <span>Try a broader term such as strategy, risk, funnel, pricing, or roadmap.</span>
                  </div>
                )}
              </div>

              {selectedTechnique && (
                <aside className="prompt-lab" aria-label="Selected technique detail">
                  <span className="lab-kicker">Selected prompt · {selectedTechnique.categoryTitle}</span>
                  <h4>{selectedTechnique.name}</h4>
                  {selectedProfile && (
                    <div className="technique-fiche">
                      <div>
                        <span>Origin</span>
                        <p>{selectedProfile.origin}</p>
                      </div>
                      <div>
                        <span>Why it helps</span>
                        <p>{selectedProfile.benefit}</p>
                      </div>
                      <div>
                        <span>Best inputs</span>
                        <p>{selectedProfile.inputs.join(', ')}</p>
                      </div>
                      <div>
                        <span>Output</span>
                        <p>{selectedProfile.deliverable}</p>
                      </div>
                    </div>
                  )}
                  <dl>
                    <div>
                      <dt>Principle</dt>
                      <dd>{selectedTechnique.principle}</dd>
                    </div>
                    <div>
                      <dt>Best used for</dt>
                      <dd>{selectedTechnique.use}</dd>
                    </div>
                  </dl>
                  <div className="prompt-box">
                    <span>Prompt kernel</span>
                    <p>{selectedTechnique.prompt}</p>
                  </div>
                  <details className="prompt-expand">
                    <summary>See the full prompt instructions</summary>
                    <div className="prompt-boost">
                      <span>Prompt engineering boost</span>
                      <p>{promptEngineeringBoosts[selectedTechnique.categoryId]}</p>
                    </div>
                    <div className="context-gate">
                      <span>Context-quality-gate</span>
                      <p>
                        First audit what context is available, what is missing, which assumptions are required,
                        and whether clarification is needed before producing the final answer.
                      </p>
                    </div>
                    <p className="copy-hint">
                      Copy includes the prompt kernel, context-quality-gate, prompt engineering boost, and output requirements.
                    </p>
                  </details>
                  <button type="button" onClick={handleCopyPrompt}>{copyState}</button>
                </aside>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="atlas-section atlas-native">
        <div className="atlas-section-heading">
          <span>LLM-Native Power Moves</span>
          <h2>Use these when the LLM should simulate, compress, chain, or critique.</h2>
        </div>
        <div className="native-lab">
          <div className="native-grid" aria-label="LLM-native interaction patterns">
            {nativeTechniques.map(([name, why], index) => (
              <button
                aria-pressed={index === activeNativeIndex}
                className={`native-card ${index === activeNativeIndex ? 'is-active' : ''}`}
                key={name}
                onClick={() => setActiveNativeIndex(index)}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{why}</p>
                <em>Open pattern</em>
              </button>
            ))}
          </div>

          <aside className="native-detail" aria-label="Selected LLM-native pattern">
            <span>Selected interaction pattern</span>
            <h3>{activeNative[0]}</h3>
            <p>{activeNative[1]}</p>
            <code>{activeNative[2]}</code>
            <div className="native-motion-note">
              <strong>How to use it</strong>
              <p>Run this when a normal answer would be too linear. It forces the LLM to simulate, attack, compress, chain, or switch reasoning modes.</p>
            </div>
            <button type="button" onClick={handleCopyNativePrompt}>{nativeCopyState}</button>
          </aside>
        </div>
      </section>

      <section className="atlas-section" id="chains">
        <div className="atlas-section-heading">
          <span>High-Yield Combinations</span>
          <h2>Use these recipes when one reasoning mode is not enough.</h2>
        </div>
        <div className="combo-explorer">
          <div className="combo-selector" aria-label="Combination recipes">
            {combos.map(([goal, steps], index) => (
              <button
                aria-pressed={index === activeComboIndex}
                className={index === activeComboIndex ? 'is-active' : ''}
                key={goal}
                onClick={() => setActiveComboIndex(index)}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{goal}</strong>
                <small>{steps.length} reasoning steps</small>
              </button>
            ))}
          </div>

          <article className="combo-detail">
            <div className="combo-detail-head">
              <span>Selected recipe</span>
              <h3>{activeCombo[0]}</h3>
              <p>{activeCombo[2]}</p>
            </div>

            <div className="combo-stepper" aria-label="Reasoning sequence">
              {activeCombo[1].map((step, index) => (
                <div key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>

            <div className="combo-usage">
              <div>
                <span>Use when</span>
                <p>The question has multiple unknowns, a direct answer would hide assumptions, or the output must become a roadmap, experiment, PRD, or decision memo.</p>
              </div>
              <div>
                <span>Expected output</span>
                <p>Visible reasoning steps, explicit assumptions, ranked options, validation test, metric, owner, and risk.</p>
              </div>
            </div>

            <button className="combo-copy" type="button" onClick={handleCopyComboPrompt}>
              {comboCopyState}
            </button>
          </article>
        </div>
      </section>

      <section className="atlas-section atlas-matrices">
        <div className="matrix-card">
          <div className="atlas-section-heading">
            <span>Synthetic Taxonomy</span>
            <h2>Pick techniques by PM objective.</h2>
          </div>
          {taxonomy.map(([objective, methods]) => (
            <div className="matrix-row" key={objective}>
              <strong>{objective}</strong>
              <span>{methods}</span>
            </div>
          ))}
        </div>

        <div className="matrix-card">
          <div className="atlas-section-heading">
            <span>Mental Catalogue</span>
            <h2>Seven reasoning families for augmented PMs.</h2>
          </div>
          {mentalFamilies.map(([family, question]) => (
            <div className="matrix-row compact" key={family}>
              <strong>{family}</strong>
              <span>{question}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="atlas-section atlas-top20">
        <div className="atlas-section-heading">
          <span>Priority Stack</span>
          <h2>The 20 techniques to master first.</h2>
        </div>
        <div className="top-grid">
          {topTechniques.map(([rank, name, reason]) => (
            <article key={rank}>
              <span>{rank}</span>
              <strong>{name}</strong>
              <p>{reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="atlas-section atlas-templates" id="templates">
        <div className="template-card">
          <div>
            <span>Master Prompt Format</span>
            <h2>Reusable operating template</h2>
          </div>
          <pre>{`Context:
[Product, target, market, metrics, constraints, available data]

Objective:
[Discover an opportunity / prioritize / improve a metric / launch / challenge]

Reasoning technique to apply:
[Fill the gap / JTBD / Red team / Metric tree / Pre-mortem / etc.]

Constraints:
[Time, team, tech, business model, segment, quality, regulation]

Expected deliverable:
[Table, roadmap, PRD, experiment plan, decision memo, backlog]

Requirements:
- Make assumptions explicit.
- Separate facts, inferences, and recommendations.
- Rank options by impact, confidence, and effort.
- Give risks and the fastest validation test.`}</pre>
        </div>

        <div className="template-card fill-gap">
          <div>
            <span>Applied Example</span>
            <h2>Fill the Gap method</h2>
          </div>
          <pre>{`You are a senior product strategist.

Here is the current journey:
[paste journey]

Here are the metrics:
[paste funnel, activation, retention]

Here are user verbatims:
[paste feedback]

Apply the Fill the Gap method:
1. Identify breaks between user intention, available action, and expected outcome.
2. Rank gaps by frequency, pain intensity, business impact, and feasibility.
3. Propose 10 candidate features.
4. For each feature, provide problem solved, target user, main assumption, MVP, success metric, and main risk.
5. End with the 3 most obvious features to test now.`}</pre>
        </div>
      </section>
    </main>
  );
}
