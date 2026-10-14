/*
 * Conversation: Lucas Mair on Frameshifts, episode 15. Plain data; the page
 * (app/writings/frameshifts-episode-15/page.tsx) renders it.
 *
 * Written 4 October 2026 at the founder's request: the episode embedded, a
 * summary for customers and investors, less about Lucas and more about the
 * company; the host's Substack write-up was the draft. Built from the episode's
 * auto-generated captions (output/provigen-frameshifts-post-2026-10-04/source),
 * three drafts, two reader judges and three verifier passes (quotes and times,
 * public rules, facts and sources).
 *
 * Evidence discipline:
 * - Quotes are YouTube auto-captions, lightly cleaned; […] marks a cut. Each
 *   time was checked against the caption file to within a few seconds.
 * - Every sentence that reports Lucas carries "he says" or a quote and a time;
 *   our reading is marked as ours. ProviGen is not named in the episode.
 * - The host's news hook (an AI-company standard for operating lab
 *   instruments) and the trade-press figures in his write-up are not used:
 *   Lucas does not discuss them, and rule 8 (minimal name-dropping).
 * - Capability wording follows content/home/build.ts: design, records and
 *   human review running; protocols for supported workflows and instruments;
 *   scheduling and execution in development. No own lab, no partner data;
 *   the founder's pipeline sentence appears once.
 * - The long-term "cells that repair" ambition and the archived essay's
 *   positioning lines are left out: that essay was taken off the site on
 *   4 Oct 2026.
 * - Not quoted: the verification remark at 1:12:39. It follows, in the same
 *   breath, a line that places us among training-data suppliers for AI
 *   models, which the public pages leave out.
 *
 * Headlines carry one <em> word. Body strings may use <em>, <strong>,
 * <a href> and t() times.
 */

import type { ArticleReference } from '@/components/ArticleShell';

export type EpisodeBlock =
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string; start: string; speaker: string }
  | { type: 'list'; items: string[] };

export type EpisodeSection = { id: string; title: string; blocks: EpisodeBlock[] };

const VIDEO = 'mA7yUeHq6xc';

const seconds = (stamp: string) =>
  stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);

/**
 * A time in running text. Without script it opens YouTube at that second;
 * with it, EpisodeVideo plays the embedded episode from there.
 */
const t = (stamp: string) =>
  `<a class="ep-t" href="https://www.youtube.com/watch?v=${VIDEO}&amp;t=${seconds(stamp)}s" data-episode-t="${seconds(stamp)}" aria-label="Play from ${stamp}">${stamp}</a>`;

export const episode = {
  slug: 'frameshifts-episode-15',
  title: 'Biology is a steering <em>problem</em>.',
  dek: 'Our co-founder and CTO Lucas Mair on the Frameshifts podcast. Our reading: biology is a steering problem, the experiment is the bottleneck, and that is where lab-in-the-loop AI comes in.',
  date: '2026-08-31', // the episode's release, 31 Aug 2026
  category: 'Conversation' as const,
  readingMinutes: 6,
  disclaimer:
    'Quotes come from YouTube’s auto-generated captions, lightly edited for readability; […] marks words left out, and every time on this page plays the episode from there. The views in the quotes are Lucas’s own. ProviGen is not named in the conversation: the reading of it, and everything said here about what we build, is ours. Where the conversation turns to fully automated labs, that is Lucas’s picture of where the field could go, not a description of what we build.',
  video: {
    id: VIDEO,
    title: 'Lucas Mair on AI, Robotics, and the Future of Fully Automated Biology | Frameshifts Episode #15',
    published: '2026-08-31T00:57:50Z',
    length: '1:27:06',
    isoDuration: 'PT1H27M6S',
    poster: '/assets/writings/frameshifts-episode-15/poster-1280.webp',
    label: 'Frameshifts · Episode 15',
    note: 'Frameshifts with Benjamin Arya, 31 August 2026. Plays from YouTube: pressing Play loads YouTube’s player.',
  },
  sections: [
    {
      id: 'in-short',
      title: 'In <em>short</em>.',
      blocks: [
        {
          type: 'list',
          items: [
            'Biology is a control problem, Lucas argues: out of all possible arrangements, find those that support what we want, and steer the system toward them.',
            'What holds biology back, in his account, is not theory but running the experiments. Automation took hold where one workflow repeats, much less where the workflow keeps changing.',
            'The instruments exist, he says, and language models can already draft protocols, though they still get some wrong. What he saw as missing: turning a protocol into code for the devices a given lab has.',
            'That is where we work. ProviGen builds lab-in-the-loop AI that chooses each next experiment, plans it for the supported instruments a lab already has, and learns from every result. Today with partner labs, on their instruments; their scientists decide what runs.',
          ],
        },
      ],
    },
    {
      id: 'steer',
      title: 'From predicting to <em>steering</em>.',
      blocks: [
        {
          type: 'p',
          text: `Lucas opens with the frame that computer science, medicine and robotics gave him: the core question is how to move a system from one state to another, which is what all of engineering is about&nbsp;${t('1:29')}.`,
        },
        {
          type: 'quote',
          speaker: 'Lucas Mair',
          start: '2:21',
          text: 'If you look at biology as a discipline, it’s all about finding, out of all possible arrangements, those arrangements that support what we want […] and then steer the system in the direction that is desirable versus undesirable.',
        },
        {
          type: 'p',
          text: 'We think this is the right starting point. Most AI for biology learns to predict how a living system behaves. A lab has to answer the inverse question: which interventions, in what order, move a living system from where it is to where it needs to be. Predictions narrow the options. In biology, the experiment settles which one works, and choosing that experiment well is how a system is steered. That is why we put the lab in the loop.',
        },
      ],
    },
    {
      id: 'bottleneck',
      title: 'The experiment is the <em>bottleneck</em>.',
      blocks: [
        {
          type: 'p',
          text: `Scientific theories, Lucas says, are not what holds biology back; conducting the experiments is&nbsp;${t('14:23')}. People trained for years to think about the science, he says, spend most of their research time carrying it out by hand&nbsp;${t('16:06')}.`,
        },
        {
          type: 'p',
          text: `He puts much of this down to how academic research is funded and rewarded&nbsp;${t('18:18')}. A lab that does buy a liquid-handling robot meets the next problem:`,
        },
        {
          type: 'quote',
          speaker: 'Lucas Mair',
          start: '20:16',
          text: 'Even if you would get such a device, you don’t have the allocated funds to pay a programmer or a computer scientist to program that robot. So that would fall to the scientists, who, because of the incentive structure in academia, are actually pressured to publish as soon as possible.',
        },
        {
          type: 'p',
          text: `The pressure comes from outside, he stresses, even though automating “will definitely pay off” in the long term&nbsp;${t('21:34')}.`,
        },
        {
          type: 'p',
          text: `Where automation has been used most, he says, the workflow stays the same. Some pharma companies and contract research organisations program a screening workflow once and run it across very large screens&nbsp;${t('23:39')}. Research is different:`,
        },
        {
          type: 'quote',
          speaker: 'Lucas Mair',
          start: '25:08',
          text: 'For this kind of labour, that has always-changing workflows, laboratory automation didn’t lend itself at all. It was simply not feasible, from a time-investment perspective, to really build systems that support that strongly.',
        },
        {
          type: 'p',
          text: `His remedy: cut the friction of understanding the devices and programming them for each protocol “to as close as possible to zero”&nbsp;${t('25:35')}, bring as many uses as possible onto the same instruments&nbsp;${t('26:46')}, and solve access and trust&nbsp;${t('27:06')}.`,
        },
        {
          type: 'p',
          text: 'In our reading, biofoundries, CDMOs and many CRO teams work between the two: they run automation every day, and each new project, cell line or process still changes the protocol.',
        },
        {
          type: 'p',
          text: 'This is the gap we see. A development campaign changes its protocol every round, because each result changes what is worth testing next. It needs a way to choose the next experiment and turn it into a protocol the lab’s instruments can run.',
        },
      ],
    },
    {
      id: 'now',
      title: 'Why <em>now</em>.',
      blocks: [
        { type: 'p', text: 'As we read the conversation, three things have come together.' },
        {
          type: 'list',
          items: [
            `<strong>The instruments exist.</strong> Walking through one workflow step by step, Lucas says that everything inside an automation setup is “very much automatable”; the least automatable step is unboxing reagents and loading the devices&nbsp;${t('49:53')}. Some steps still need custom set-ups, and whether a step is worth automating depends on its capital cost&nbsp;${t('57:50')}. The basic operations, he says, are much the same from bacteria to mammalian cells&nbsp;${t('41:37')}.`,
            `<strong>Models can draft protocols.</strong> Language models can already design an experiment step by step at the protocol level, he says&nbsp;${t('1:00:56')}, though they still sometimes hallucinate or miss the specific use case&nbsp;${t('1:02:00')}.`,
            `<strong>Programming is getting easier to learn.</strong> In software, he notes, people have begun to program in natural language and let translation layers handle the levels below&nbsp;${t('1:06:02')}. AI assistants have made programming somewhat easier to learn, he says, but programming, testing and iterating on a robot still take a lot of time&nbsp;${t('20:39')}.`,
          ],
        },
        { type: 'p', text: 'What was still missing when the episode was recorded, in his words:' },
        {
          type: 'quote',
          speaker: 'Lucas Mair',
          start: '1:02:11',
          text: 'What is missing much more is not this protocol level but actually the coding level below it: how do you translate this natural-language protocol into code for your laboratory robotics? For that you need to understand which devices you have. You need to know how to access the devices, which programming language. Is there even any programming language? That’s very much still missing, I would say.',
        },
        {
          type: 'p',
          text: 'This is where we work: turning a drafted protocol into one that runs on the supported instruments a lab actually has.',
        },
      ],
    },
    {
      id: 'build',
      title: 'What we <em>build</em>.',
      blocks: [
        {
          type: 'p',
          text: 'ProviGen builds lab-in-the-loop AI for experimental biology. A lab brings a process and a target. Our system chooses each next experiment for what it will teach, turns it into a protocol for the lab’s supported instruments and workflows, and learns from every result. Each round updates its model of that process, and the next experiment goes where the model is least sure or the gain is largest. Every result is recorded with the conditions, protocol version and instrument data that produced it, failures and deviations included.',
        },
        {
          type: 'p',
          text: 'Today we do this with partner labs, on their instruments. Scientists set the target, approve each batch and can override any decision. Automated scheduling and execution are in development, and autonomy grows only where it has been shown to work. Partner to every lab, competitor to none.',
        },
        {
          type: 'p',
          text: 'Instruments and models are both improving. What we build joins them to one lab’s process: choosing the next experiment, turning it into a protocol for the supported instruments that lab has, and recording how each result was produced. Why we think it compounds:',
        },
        {
          type: 'list',
          items: [
            '<strong>Better models make it better, not obsolete.</strong> A stronger model proposes better experiments; they still have to be run in a lab and recorded.',
            '<strong>With each experiment run on ProviGen globally, we improve our pipeline.</strong>',
            '<strong>Trust compounds.</strong> A system that has earned a lab’s trust is given its hardest problems.',
          ],
        },
      ],
    },
    {
      id: 'access',
      title: 'Where it <em>leads</em>.',
      blocks: [
        {
          type: 'p',
          text: `Lucas also talks about access. Five years ago, he says, few biologists could code; today almost every biologist dabbles in Python to some degree&nbsp;${t('1:03:48')}. He expects the same for experiments: less effort handling liquids, more on deciding what is worth testing&nbsp;${t('1:04:18')}. That is his view of where the field could go.`,
        },
        {
          type: 'p',
          text: 'If he is right, many more people will run experiments, and choosing them well will matter more, not less. That is the company we are building: the system a lab trusts to choose its next experiment.',
        },
      ],
    },
  ] as EpisodeSection[],
  guide: {
    id: 'episode-guide',
    title: 'The episode, chapter by <em>chapter</em>.',
    intro: '',
  },
  chapters: [
    { start: '1:17', title: 'Biology as a steering problem' },
    { start: '5:31', title: 'From medicine and robotics to lab automation' },
    { start: '14:23', title: 'The bottleneck is running experiments' },
    { start: '18:18', title: 'Why labs stay manual: funding and incentives' },
    { start: '22:54', title: 'Automation built for one repeated workflow' },
    { start: '25:22', title: 'Friction, utilisation, access and trust' },
    { start: '34:39', title: 'Walk-away time and what can be automated, step by step' },
    { start: '57:58', title: 'From predicting proteins to programming experiments' },
    { start: '1:06:56', title: 'How language models learn biology' },
    { start: '1:22:43', title: 'Why this problem: choice and access' },
  ],
  listen: [
    { label: 'Substack', href: 'https://frameshifts.bio/p/lucas-mair-closed-loop-biology-lab' },
    {
      label: 'Apple Podcasts',
      href: 'https://podcasts.apple.com/us/podcast/lucas-mair-on-ai-robotics-and-the-future-of/id1829721662?i=1000786990666',
    },
    { label: 'Spotify', href: 'https://open.spotify.com/episode/0w7bnuelCpyelnth9f84v7' },
  ],
  references: [
    {
      label: 'Frameshifts with Benjamin Arya · Lucas Mair on AI, Robotics, and the Future of Fully Automated Biology (Episode 15) · YouTube · 31 August 2026',
      href: 'https://www.youtube.com/watch?v=mA7yUeHq6xc',
      note: 'The episode (1 h 27 min) and the source of every quote and time on this page.',
    },
    {
      label: 'Benjamin Arya · Lucas Mair on AI, Robotics, and the Future of Fully Automated Biology · Frameshifts (Substack) · 31 August 2026',
      href: 'https://frameshifts.bio/p/lucas-mair-closed-loop-biology-lab',
      note: 'The host’s own write-up of the episode, with his framing. The news it opens with and the press figures it cites do not come up in the conversation.',
    },
    {
      label: 'Frameshifts with Benjamin Arya · Episode 15 · Apple Podcasts · 31 August 2026',
      href: 'https://podcasts.apple.com/us/podcast/lucas-mair-on-ai-robotics-and-the-future-of/id1829721662?i=1000786990666',
      note: 'Audio of the same episode.',
    },
    {
      label: 'Frameshifts with Benjamin Arya · Episode 15 · Spotify · 31 August 2026',
      href: 'https://open.spotify.com/episode/0w7bnuelCpyelnth9f84v7',
      note: 'Audio of the same episode.',
    },
  ] as ArticleReference[],
};
