/**
 * Creative Computer Academy (CCA) - Typing Master Test Passages
 * All passages are rigorously sanitized to standard ASCII printable characters:
 * Straight quotes (' and "), standard hyphens (-), and uniform spacing.
 */

export const TEST_DURATIONS = [
  { id: '1m', label: '1 Minute', seconds: 60, icon: '⚡' },
  { id: '2m', label: '2 Minutes', seconds: 120, icon: '⏱️', recommended: true },
  { id: '3m', label: '3 Minutes', seconds: 180, icon: '⏳' },
  { id: '5m', label: '5 Minutes', seconds: 300, icon: '🎯', certEligible: true },
  { id: '10m', label: '10 Minutes', seconds: 600, icon: '🏆', certEligible: true }
];

export const PASSAGE_CATEGORIES = [
  { id: 'all', label: 'All Passages' },
  { id: 'stories', label: 'Classic Fables & Tales', icon: '📖' },
  { id: 'tech', label: 'Technology & AI', icon: '💻' },
  { id: 'business', label: 'Business & Leadership', icon: '💼' },
  { id: 'science', label: 'Science & Nature', icon: '🔬' },
  { id: 'programming', label: 'Programming & Coding', icon: '⌨️' }
];

export const TYPING_TEST_PASSAGES = [
  // ── CLASSIC FABLES ──────────────────────────────────────────────
  {
    id: 'fable_tortoise',
    title: 'The Tortoise and the Hare',
    category: 'stories',
    difficulty: 'beginner',
    description: 'A classic Aesop fable about persistence, focus, and steady pacing.',
    text: "A Hare was making fun of the Tortoise one day for being so slow. Do you ever get anywhere? he asked with a laugh. Yes, replied the Tortoise, and I get there sooner than you think. Run with me and I will prove it. The Hare was much amused at the idea of running a race with the Tortoise, but for the fun of the thing he agreed. So the Fox, who had consented to act as judge, marked the distance and started the runners off. The Hare was soon far out of sight, and to make the Tortoise feel very deeply how ridiculous it was for him to try a race with a Hare, he lay down beside the course to take a nap until the Tortoise should catch up. The Tortoise meanwhile kept going slowly but steadily, and after a time, passed the place where the Hare was sleeping. The Hare slept on peacefully; and when at last he did wake up, the Tortoise was near the goal. The Hare now ran his swiftest, but he could not overtake the Tortoise in time. Slow and steady wins the race."
  },
  {
    id: 'fable_lion_mouse',
    title: 'The Lion and the Mouse',
    category: 'stories',
    difficulty: 'beginner',
    description: 'Even the smallest creatures can prove to be the greatest helpers.',
    text: "A Lion was awakened from sleep by a Mouse running over his face. Rising up angrily, he caught the tiny creature and was about to kill him, when the Mouse begged for mercy. Spare me, cried the poor Mouse, and I will surely repay your kindness. The Lion laughed aloud at the thought of a Mouse helping him, but let him go. Some days later, the Lion was caught in a hunter's net. The hunters tied him to a tree while they went in search of a wagon. Just then the little Mouse happened to pass by, and seeing the sad plight in which the Lion was, ran up to him and chewed away the ropes that bound the King of the Beasts. Was I not right? said the little Mouse. Little friends may prove to be great friends."
  },
  {
    id: 'fable_ant_grasshopper',
    title: 'The Ant and the Grasshopper',
    category: 'stories',
    difficulty: 'intermediate',
    description: 'A timeless lesson on the value of hard work and preparation for the future.',
    text: "On a warm summer day, a Grasshopper was hopping about, chirping and singing to its heart's content. An Ant passed by, bearing along with great effort an ear of corn he was taking to the nest. Why not come and chat with me, said the Grasshopper, instead of toiling and moiling in that way? I am helping to lay up food for the winter, said the Ant, and recommend you to do the same. Why bother about winter? said the Grasshopper; we have got plenty of food at present. But the Ant went on its way and continued its toil. When the winter came the Grasshopper had no food and found itself dying of hunger, while it saw the ants distributing every day corn and grain from the stores they had collected in the summer. Then the Grasshopper knew: It is best to prepare for the days of necessity."
  },

  // ── TECHNOLOGY & AI ─────────────────────────────────────────────
  {
    id: 'tech_ai_future',
    title: 'The Rise of Artificial Intelligence',
    category: 'tech',
    difficulty: 'intermediate',
    description: 'How modern neural networks and machine learning transform society.',
    text: "Artificial intelligence has rapidly evolved from a theoretical science fiction concept into an essential foundation of modern technological civilization. Every day, machine learning algorithms analyze millions of medical scans to detect subtle diseases, optimize urban traffic grids to minimize carbon emissions, and assist software engineers in writing cleaner code. The core of neural networks mirrors the cognitive synapsis of the human brain, allowing systems to learn from vast data streams through pattern recognition. As artificial intelligence systems become more capable and ubiquitous, ethical stewardship and human alignment will define our shared digital future."
  },
  {
    id: 'tech_cloud_computing',
    title: 'The Architecture of Cloud Computing',
    category: 'tech',
    difficulty: 'intermediate',
    description: 'Understanding distributed data centers, virtualization, and scalability.',
    text: "Cloud computing provides on-demand access to computing resources over the internet on a pay-as-you-go basis. Instead of purchasing, operating, and maintaining physical data servers, organizations can access technology services such as compute power, storage, and databases from major cloud providers. Virtualization technology abstracts hardware components into isolated software containers, enabling instant horizontal scaling across global availability zones. This architectural shift empowers modern startups to deliver low-latency digital experiences to millions of global users simultaneously."
  },
  {
    id: 'tech_cybersecurity',
    title: 'Principles of Modern Cybersecurity',
    category: 'tech',
    difficulty: 'advanced',
    description: 'Defending networks, data integrity, zero-trust architecture, and encryption.',
    text: "In an interconnected digital economy, cybersecurity is no longer a peripheral IT concern but a mission-critical pillar of organizational integrity. Zero-trust security frameworks operate under the fundamental principle of never trust, always verify. Every access request, regardless of origin within the internal network perimeter, must undergo rigorous multi-factor authentication, cryptographic authorization, and contextual risk assessment. As quantum computing advances toward breaking traditional RSA encryption, the implementation of post-quantum cryptography will safeguard confidential communications across the globe."
  },

  // ── BUSINESS & LEADERSHIP ───────────────────────────────────────
  {
    id: 'business_agile',
    title: 'Agile Mindset in Modern Teams',
    category: 'business',
    difficulty: 'intermediate',
    description: 'How cross-functional teams iterate rapidly and deliver value.',
    text: "Agile methodologies have transformed modern product development by prioritizing customer collaboration over rigid contracts and responding to change over following a static plan. Cross-functional teams break complex roadmaps down into focused two-week sprints. Daily stand-ups maintain operational clarity, while iterative retrospectives encourage transparent feedback and continuous self-improvement. By welcoming customer insights early in the development lifecycle, organizations minimize wasted engineering effort and cultivate a high-trust culture of innovation."
  },
  {
    id: 'business_communication',
    title: 'The Art of Executive Communication',
    category: 'business',
    difficulty: 'advanced',
    description: 'Writing concise, persuasive, and empathetic professional prose.',
    text: "Effective business communication relies on conciseness, precision, and active empathy. When drafting an executive memo or client proposal, articulate the primary objective within the opening paragraph. Support your thesis with measurable data points, clearly structured bullet lists, and explicit action items with defined deadlines. Avoiding corporate jargon and ambiguous passive voice ensures your strategic intent is understood with clarity across diverse multicultural stakeholders."
  },

  // ── SCIENCE & NATURE ────────────────────────────────────────────
  {
    id: 'science_solar_system',
    title: 'Wonders of the Solar System',
    category: 'science',
    difficulty: 'beginner',
    description: 'Exploring the planets, asteroid belts, and cosmic phenomena.',
    text: "Our solar system consists of our central star, the Sun, and everything bound to it by gravity. The inner rocky planets, Mercury, Venus, Earth, and Mars, orbit closest to the Sun, followed by the vast asteroid belt. Beyond lies the gas giants Jupiter and Saturn, with their spectacular ring systems and dozens of icy moons. Further outward, Uranus and Neptune orbit in freezing planetary darkness. Exploring these distant celestial bodies unlocks deep secrets about how planetary atmospheres form and how life arose on our home planet."
  },
  {
    id: 'science_muscle_memory',
    title: 'The Neuroscience of Touch Typing',
    category: 'science',
    difficulty: 'intermediate',
    description: 'How the human motor cortex and cerebellum build automatic muscle memory.',
    text: "When you practice touch typing, your brain undergoes an incredible biological process known as procedural memory formation. Initially, your conscious prefrontal cortex directs every keystroke, checking key positions and making slow, deliberate finger movements. With deliberate, repeated practice, the cerebellum and basal ganglia take over the neural automation. Motor pathways become deeply ingrained through myelination of nerve fibers, allowing your ten fingers to fly across the mechanical keyboard at lightning speeds without conscious thought."
  },

  // ── PROGRAMMING & CODING ────────────────────────────────────────
  {
    id: 'code_clean_principles',
    title: 'Clean Code and Architecture',
    category: 'programming',
    difficulty: 'intermediate',
    description: 'Writing maintainable, elegant, and readable software.',
    text: "Programs must be written for people to read, and only incidentally for machines to execute. Writing clean code means naming variables and functions with explicit intent, keeping functions small and single-purposed, and avoiding duplicated business logic. When you structure your code with modular boundaries and comprehensive automated tests, you create software that can gracefully adapt to evolving business requirements without brittle regressions."
  },
  {
    id: 'code_javascript_ecosystem',
    title: 'The Universal Power of JavaScript',
    category: 'programming',
    difficulty: 'advanced',
    description: 'From browser scripts to full-stack cloud runtimes.',
    text: "JavaScript began as a lightweight scripting language created in ten days to animate web pages inside Netscape Navigator. Today, powered by Google V8 and runtime engines like Node.js and Bun, it dominates full-stack application development. Developers can build reactive user interfaces with React, perform high-concurrency API operations on serverless infrastructure, train lightweight machine learning models in WebGL, and even deploy native mobile applications using a unified and expressive language."
  }
];

// Helper to compute word count & metadata
TYPING_TEST_PASSAGES.forEach(p => {
  p.wordCount = p.text.trim().split(/\s+/).length;
  p.charCount = p.text.length;
});
