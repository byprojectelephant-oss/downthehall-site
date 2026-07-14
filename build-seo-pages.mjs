import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";

const root = process.cwd();
const siteUrl = "https://downthehallresources.com";
const today = "2026-06-20";
const sourcePath = path.join(root, "index.html");
const outputDir = path.join(root, "resources");
const shareImageDir = path.join(root, "share-images");

const escapeHtml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeXml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const stripHtml = (value = "") =>
  value.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&").replaceAll("&mdash;", "-").trim();

const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

const imageAltText = (resource) =>
  `${resource.title} printable worksheet preview for ${subtopicFor(resource).toLowerCase()} practice`;

const imageUrl = (resource) => (resource.thumb ? `${siteUrl}/${resource.thumb}` : undefined);

const topicShareImagePath = (topic) => path.join(shareImageDir, `${topic.slug}-pin.png`);
const topicShareImageUrl = (topic) => `${siteUrl}/share-images/${topic.slug}-pin.png`;

const categories = {
  "life-skills": {
    name: "Life Skills",
    slug: "life-skills-worksheets",
    title: "Free Life Skills Worksheets for Teens and Adults",
    description:
      "Free printable life skills worksheets covering home safety, personal care, healthy eating, food labels, and everyday independence.",
    intro:
      "Build practical independence with printable activities designed for direct instruction, small groups, and supported practice. These resources use clear language and concrete situations that work well in special education, day programs, group homes, and community settings.",
  },
  reading: {
    name: "Reading & Language",
    slug: "reading-language-worksheets",
    title: "Free Reading and Language Worksheets",
    description:
      "Free printable tracing, vocabulary, word search, and language worksheets for learners who benefit from accessible practice.",
    intro:
      "Support functional literacy, handwriting, vocabulary, and word recognition with accessible printable activities. The collection includes beginner tracing practice and health-themed language activities for individual or group instruction.",
  },
  math: {
    name: "Math & Numbers",
    slug: "math-number-worksheets",
    title: "Free Printable Math and Number Worksheets",
    description:
      "Free counting, money, addition, and subtraction worksheets with accessible levels and printable answer-key options.",
    intro:
      "Practice useful number skills through counting, money recognition, addition, and subtraction. Multiple levels make it easier to choose a starting point and build confidence without changing the overall activity format.",
  },
  "social-emotional": {
    name: "Social & Emotional",
    slug: "social-emotional-worksheets",
    title: "Free Social and Emotional Skills Worksheets",
    description:
      "Free printable worksheets for emotions, calming strategies, friendship, self-advocacy, social situations, and emotional safety.",
    intro:
      "Use concrete scenarios and guided choices to teach emotional awareness, communication, self-advocacy, friendship, and coping skills. These printables can support discussion, role-play, and individualized learning goals.",
  },
  coloring: {
    name: "Creative Arts",
    slug: "coloring-pages",
    title: "Free Printable Coloring Pages",
    description:
      "Free printable animal and community-safety coloring pages for relaxing, accessible creative activities.",
    intro:
      "Offer a low-pressure creative activity that supports choice-making, fine-motor practice, attention, and conversation. These free coloring pages are ready to print for classrooms, programs, and home use.",
  },
};

const topicPages = [
  {
    slug: "life-skills-worksheets-for-adults-with-developmental-disabilities",
    title: "Free Life Skills Worksheets for Adults with Developmental Disabilities",
    pinTitle: "Life Skills Worksheets for Adults",
    description:
      "Free printable life skills worksheets for adults with developmental disabilities, including personal care, home safety, money skills, healthy eating, and functional reading.",
    eyebrow: "Most requested collection",
    intro:
      "These printable life skills worksheets are designed for adults and transition-age learners who benefit from clear directions, visual supports, practical examples, and flexible staff support. They work well in day programs, group homes, community centers, special education transition programs, and home routines.",
    audience:
      "Use these activities for one-to-one support, small groups, skill review, morning meetings, independent practice, or take-home reinforcement.",
    keywords: ["life skills", "developmental disabilities", "adult day program", "group home", "independence"],
    matches: (resource) =>
      resource.filter === "life-skills" ||
      resource.filter === "math" ||
      subtopicFor(resource) === "Functional Reading" ||
      subtopicFor(resource) === "Social and Emotional Learning",
  },
  {
    slug: "money-skills-worksheets",
    title: "Free Money Skills Worksheets",
    description:
      "Free printable money skills worksheets for counting coins, counting bills, budgeting, coupons, comparing prices, and making change.",
    eyebrow: "Functional math",
    intro:
      "Money skills are easier to practice when the activity feels connected to real shopping, budgeting, and community routines. These worksheets help learners practice counting coins and bills, reading prices, comparing costs, using coupons, and building confidence with everyday money decisions.",
    audience:
      "Best for supported math practice, community-based instruction preparation, vocational programs, and daily living skills groups.",
    keywords: ["money", "coins", "bills", "budget", "prices", "coupon", "change"],
    matches: (resource) =>
      /money|coin|bill|budget|coupon|price|change|\$/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "personal-hygiene-worksheets",
    title: "Free Personal Hygiene and Self-Care Worksheets",
    description:
      "Free printable personal hygiene and self-care worksheets covering handwashing, brushing teeth, bathing, clothing choices, and doctor or dentist visits.",
    eyebrow: "Personal care routines",
    intro:
      "Personal hygiene worksheets can help turn daily care routines into smaller, teachable steps. These resources use plain language, familiar routines, and visual structure so staff and caregivers can review what to do, when to do it, and why it matters.",
    audience:
      "Use these pages during routine teaching, pre-teaching before a task, health lessons, or individualized support planning.",
    keywords: ["personal care", "hygiene", "handwashing", "teeth", "showering", "doctor", "dentist", "clothing"],
    matches: (resource) =>
      subtopicFor(resource) === "Personal Care" ||
      /hygiene|handwashing|teeth|tooth|shower|bathing|clothing|doctor|dentist|personal care/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "home-safety-worksheets",
    title: "Free Home Safety Worksheets",
    description:
      "Free printable home safety worksheets covering emergencies, fire hazards, answering the door, phone scams, severe weather, and being home alone.",
    eyebrow: "Safety and independence",
    intro:
      "Home safety skills need repetition, conversation, and practice with real situations. These worksheets help learners talk through emergencies, safer choices, warning signs, household hazards, and who to contact when something does not feel safe.",
    audience:
      "Good for group lessons, safety reviews, transition planning, residential support, and family practice.",
    keywords: ["home safety", "emergency", "fire", "door", "phone scam", "weather", "home alone"],
    matches: (resource) =>
      subtopicFor(resource) === "Home Safety" ||
      /safety|emergency|fire|door|scam|weather|home alone|hazard/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "social-skills-worksheets",
    title: "Free Social Skills and Emotional Skills Worksheets",
    description:
      "Free printable social skills worksheets for emotions, friendship, self-advocacy, calming strategies, social situations, texting, email, and boundaries.",
    eyebrow: "Social and emotional learning",
    intro:
      "Social and emotional skills are often best taught through concrete examples, short scenarios, and guided discussion. These worksheets give staff and caregivers a starting point for practicing feelings, communication, boundaries, friendship, self-advocacy, and safe choices.",
    audience:
      "Use them for small groups, role-play, counseling support, daily check-ins, or direct instruction.",
    keywords: ["social", "emotional", "feelings", "friendship", "self-advocacy", "boundaries", "calming"],
    matches: (resource) =>
      resource.filter === "social-emotional" ||
      /emotion|calming|friend|social|advocacy|text|email|safety|boundary/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "community-safety-worksheets",
    title: "Free Community Safety Worksheets",
    description:
      "Free printable community safety worksheets for signs, crosswalks, emergency choices, sharing information safely, errands, and travel routines.",
    eyebrow: "Community access",
    intro:
      "Community safety worksheets help learners practice choices they may need outside the home, including reading signs, crossing streets, planning errands, knowing when something is an emergency, and deciding what information is safe to share.",
    audience:
      "Use these resources before community outings, travel training, safety lessons, transition classes, or supported independent living practice.",
    keywords: ["community safety", "crosswalk", "signs", "emergency", "errands", "travel", "safe information"],
    matches: (resource) =>
      /community|crosswalk|signal|sign|emergency|errand|boarding|bus|safe information|share online|travel|class/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "cooking-and-meal-prep-worksheets",
    title: "Free Cooking and Meal Prep Worksheets",
    description:
      "Free printable cooking and meal prep worksheets for simple meal steps, grocery planning, food choices, food groups, menus, and kitchen routines.",
    eyebrow: "Meals and daily routines",
    intro:
      "Cooking and meal prep skills become easier when learners can break routines into clear steps. These worksheets support grocery planning, simple meal sequencing, food choices, food groups, menus, and practical kitchen conversations.",
    audience:
      "Use them for cooking groups, life skills classes, supported living routines, grocery planning, or meal preparation practice.",
    keywords: ["cooking", "meal prep", "grocery", "food", "menu", "healthy choices", "food groups"],
    matches: (resource) =>
      /cooking|meal|grocery|food|menu|healthy|nutrition|snack|recipe/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "job-and-vocational-skills-worksheets",
    title: "Free Job and Vocational Skills Worksheets",
    description:
      "Free printable job and vocational skills worksheets for workplace directions, job postings, schedules, pay stubs, communication, and self-advocacy.",
    eyebrow: "Work readiness",
    intro:
      "Job and vocational skills worksheets can help learners practice workplace routines before they need them in real settings. These resources cover reading job postings, following directions, understanding schedules, reading pay stubs, communication, and asking for support.",
    audience:
      "Use them in transition programs, vocational groups, supported employment preparation, workplace readiness lessons, or one-to-one coaching.",
    keywords: ["job skills", "vocational", "workplace", "job posting", "pay stub", "schedule", "communication"],
    matches: (resource) =>
      /job|vocational|work|workplace|pay stub|shift|schedule|directions|communication|self-advocacy/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "functional-reading-worksheets",
    title: "Free Functional Reading Worksheets",
    description:
      "Free printable functional reading worksheets for menus, schedules, appointment cards, signs, food labels, prescriptions, pay stubs, and everyday documents.",
    eyebrow: "Everyday reading practice",
    intro:
      "Functional reading worksheets help learners practice the kinds of text they actually see in daily life. These resources focus on menus, schedules, signs, forms, labels, appointment cards, and short practical passages.",
    audience:
      "Use these worksheets for transition programs, adult day services, community access preparation, and reading comprehension practice.",
    keywords: ["functional reading", "menu", "schedule", "signs", "labels", "appointment", "prescription", "pay stub"],
    matches: (resource) =>
      subtopicFor(resource) === "Functional Reading" ||
      subtopicFor(resource) === "Reading Food Labels" ||
      /read|reading|menu|schedule|sign|label|appointment|prescription|boarding|pay stub|sentence/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
  {
    slug: "healthy-eating-worksheets",
    title: "Free Healthy Eating and Wellness Worksheets",
    description:
      "Free printable healthy eating and wellness worksheets covering food groups, healthy choices, nutrition facts, food labels, wellness vocabulary, and meal planning.",
    eyebrow: "Health and wellness",
    intro:
      "Healthy eating and wellness lessons work best when learners can connect the activity to foods, routines, and choices they already know. These worksheets support conversations about food groups, nutrition labels, meal choices, wellness words, and everyday health habits.",
    audience:
      "Use them for health lessons, cooking groups, grocery planning, wellness activities, or supported independent living practice.",
    keywords: ["healthy eating", "wellness", "food groups", "nutrition", "food labels", "meal", "health"],
    matches: (resource) =>
      subtopicFor(resource) === "Healthy Eating" ||
      subtopicFor(resource) === "Reading Food Labels" ||
      subtopicFor(resource) === "Health and Wellness Vocabulary" ||
      /healthy|food|nutrition|wellness|meal|label|doctor|dentist/i.test(
        `${resource.title} ${resource.href} ${resource.tags.join(" ")}`,
      ),
  },
];

const subtopicFor = (resource) => {
  if (resource.href.includes("/home-safety/")) return "Home Safety";
  if (resource.href.includes("/personal-care/")) return "Personal Care";
  if (resource.href.includes("/community/")) return "Community and Independence";
  if (resource.href.includes("/money-skills/")) return "Money and Budget Skills";
  if (resource.href.includes("/functional-reading/")) return "Functional Reading";
  if (resource.href.includes("/reading-food-labels/")) return "Reading Food Labels";
  if (resource.href.includes("/healthy-eating/")) return "Healthy Eating";
  if (resource.href.includes("/tracing-practice/")) return "Tracing Practice";
  if (resource.href.includes("/health-wellness-word-puzzles/")) return "Health and Wellness Vocabulary";
  if (resource.filters?.includes("math") || resource.filter === "math") return "Functional Math";
  if (resource.filters?.includes("social-emotional") || resource.filter === "social-emotional") return "Social and Emotional Learning";
  if (resource.filters?.includes("coloring") || resource.filter === "coloring") return "Creative Arts";
  return "Life Skills";
};

const topicGuidanceFor = (topic) => {
  const guidance = {
    "life-skills-worksheets-for-adults-with-developmental-disabilities": {
      goals: [
        "Build practical independence through familiar routines such as personal care, safety, money, food, and community access.",
        "Give staff and caregivers a printable starting point for direct teaching, review, and conversation.",
        "Support learners who need clear wording, repeated practice, and flexible prompting.",
      ],
      lesson:
        "Choose one routine that matters this week, such as reading a schedule, identifying a safer choice, or practicing a money skill. Begin with a short discussion, complete the first item together, and then let the learner try the next item with the least support that still keeps the activity successful.",
      adapt:
        "For learners who need more help, reduce the number of questions, read choices aloud, or use real objects from the routine. For learners ready for more challenge, ask them to explain their answer, role-play the situation, or apply the skill during a real community or home routine.",
    },
    "money-skills-worksheets": {
      goals: [
        "Practice counting coins, bills, prices, coupons, and change in realistic shopping situations.",
        "Connect functional math to snacks, groceries, pay stubs, and small purchases learners may actually make.",
        "Build confidence before community-based instruction or supported shopping trips.",
      ],
      lesson:
        "Use real or play money beside the worksheet when possible. Model how to count slowly, mark completed amounts, and check the total. After the worksheet, ask a practical question such as which item costs less, how much money is needed, or whether the learner has enough to buy something.",
      adapt:
        "For extra support, limit the coin or bill types and let the learner use a counting mat. For more challenge, add a second-step question such as comparing two prices, choosing the better buy, or finding change from a rounded dollar amount.",
    },
    "personal-hygiene-worksheets": {
      goals: [
        "Break personal care routines into smaller steps that can be taught and practiced respectfully.",
        "Support conversations about health, hygiene, clothing, appointments, and daily readiness.",
        "Help learners understand both what to do and why the routine matters.",
      ],
      lesson:
        "Start with the learner's real routine and keep the tone practical, not corrective. Review the worksheet, connect each step to a familiar time of day, and practice with real supplies when appropriate. A visual checklist can help carry the skill beyond the printed page.",
      adapt:
        "For learners who need more structure, focus on one routine at a time and use first-then language. For learners ready for independence, ask them to build their own checklist or identify what supplies they need before beginning.",
    },
    "home-safety-worksheets": {
      goals: [
        "Practice recognizing emergencies, hazards, scams, weather risks, and unsafe home situations.",
        "Teach clear action steps such as stop, move away, call for help, or tell a trusted person.",
        "Create repeated opportunities to discuss safety without waiting for a real emergency.",
      ],
      lesson:
        "Read each situation slowly and ask what the learner notices before choosing an answer. When possible, connect the worksheet to the learner's actual home environment, phone routines, door rules, emergency contacts, or weather plan.",
      adapt:
        "For more support, offer two choices and rehearse the safest response aloud. For more challenge, ask the learner to explain what could happen next or identify who they would contact in that situation.",
    },
    "social-skills-worksheets": {
      goals: [
        "Use concrete examples to practice emotions, friendship, communication, boundaries, and self-advocacy.",
        "Give learners language for asking for help, making choices, and responding respectfully.",
        "Support role-play and discussion without putting anyone on the spot.",
      ],
      lesson:
        "Read the scenario, pause to name what the person might feel, and compare more than one possible response. Role-play can be useful after the worksheet, especially when the learner can practice both words and body language in a low-pressure way.",
      adapt:
        "For more support, provide sentence starters or emotion choices. For more challenge, ask the learner to describe how another person might feel or create a second ending to the situation.",
    },
    "community-safety-worksheets": {
      goals: [
        "Prepare learners for signs, crossings, errands, transportation, and safe information sharing outside the home.",
        "Connect worksheet practice to community outings and travel training.",
        "Build decision-making skills for situations that can change quickly.",
      ],
      lesson:
        "Preview the skill before a community outing, complete the worksheet together, and then look for the same idea in the real setting. For example, practice a signs worksheet before walking through a public building or review a bus schedule before planning a simple trip.",
      adapt:
        "For more support, use photos of familiar places and reduce choices. For more challenge, ask the learner to plan a short errand, identify possible problems, and name what they would do if plans changed.",
    },
    "cooking-and-meal-prep-worksheets": {
      goals: [
        "Practice food choices, grocery planning, simple meal steps, menus, and kitchen routines.",
        "Support cooking groups and daily living lessons with printable structure.",
        "Help learners connect food vocabulary to real meals and choices.",
      ],
      lesson:
        "Pair the worksheet with real packages, menus, utensils, or ingredients when available. Talk through one example first, then let the learner complete the next step. If cooking is part of the lesson, keep the worksheet nearby as a planning or review tool.",
      adapt:
        "For more support, use picture choices and fewer steps. For more challenge, ask the learner to plan a snack, compare two food options, or explain what should happen first, next, and last.",
    },
    "job-and-vocational-skills-worksheets": {
      goals: [
        "Practice workplace directions, schedules, job postings, pay stubs, communication, and asking for support.",
        "Build work-readiness skills before job coaching, volunteering, or supported employment.",
        "Use realistic documents and scenarios that learners may see in work settings.",
      ],
      lesson:
        "Introduce the workplace situation first, then look at the worksheet as a real document or scenario. Model how to find the most important information, such as time, task, location, supervisor, or next step. Finish by discussing how the skill could be used at a job site.",
      adapt:
        "For more support, highlight key words or read the document aloud. For more challenge, ask the learner to explain the next action, ask a workplace question, or compare two possible responses.",
    },
    "functional-reading-worksheets": {
      goals: [
        "Practice reading everyday documents such as menus, schedules, labels, forms, signs, and appointment cards.",
        "Move reading practice beyond isolated words into useful daily-life comprehension.",
        "Help learners answer practical questions from real-looking text.",
      ],
      lesson:
        "Before answering questions, scan the document together and name what kind of text it is. Point out headings, times, prices, dates, labels, or icons. Then answer one question together and encourage the learner to point to where the answer was found.",
      adapt:
        "For more support, cover extra information and focus on one section. For more challenge, ask the learner to create their own question from the document or explain how they found the answer.",
    },
    "healthy-eating-worksheets": {
      goals: [
        "Support conversations about food groups, nutrition labels, healthy choices, wellness words, and meal routines.",
        "Make health lessons practical by connecting them to familiar foods and daily decisions.",
        "Give learners a concrete way to compare options without judgment or shame.",
      ],
      lesson:
        "Use familiar foods whenever possible. Read the worksheet prompt, connect it to a meal or snack the learner knows, and talk about what makes a choice useful for the situation. Keep the focus on information and decision-making, not on perfect eating.",
      adapt:
        "For more support, sort foods into simple groups or use picture examples. For more challenge, compare nutrition labels, plan a balanced plate, or explain why one option may fit a goal better than another.",
    },
  };

  return (
    guidance[topic.slug] || {
      goals: [
        "Practice a functional skill with clear directions and flexible support.",
        "Connect the printed activity to real routines, objects, and conversations.",
        "Give learners repeated chances to build confidence.",
      ],
      lesson:
        "Start with one example, model your thinking aloud, and let the learner try the next item with the least support needed.",
      adapt:
        "Reduce the number of items for more support, or ask the learner to explain and apply the skill for more challenge.",
    }
  );
};

const levelFor = (resource) => {
  const levelMatch = resource.title.match(/Level\s+(\d)/i);
  if (levelMatch) return `Level ${levelMatch[1]}`;
  if (resource.tags.some((tag) => /beginner/i.test(tag))) return "Beginner";
  if (resource.tags.some((tag) => /intermediate/i.test(tag))) return "Intermediate";
  if (resource.tags.some((tag) => /advanced/i.test(tag))) return "Advanced";
  return "Flexible level";
};

const contentFor = (resource) => {
  const subtopic = subtopicFor(resource);
  const title = resource.title.replaceAll("—", "-");
  const lower = title.toLowerCase();
  let skill = "practice an everyday skill through clear, structured prompts";
  let action = "review the directions together, model one example, and let the learner complete the remaining items";
  let outcome = "explain the skill and apply it with greater confidence";

  if (subtopic === "Home Safety") {
    skill = "recognize safer choices and respond to common situations at home";
    action = "discuss each situation, invite the learner to choose a response, and rehearse the safest action";
    outcome = "identify a safe response and know when to ask a trusted person for help";
  } else if (subtopic === "Personal Care") {
    skill = "learn a practical self-care routine using concrete, easy-to-follow steps";
    action = "preview the sequence, connect each step to the learner's own routine, and practice with real supplies when appropriate";
    outcome = "complete or describe more of the routine independently";
  } else if (subtopic === "Reading Food Labels") {
    skill = "find and interpret useful information on a nutrition label";
    action = "look at one label together, locate the key numbers, and compare answers using real food packages when available";
    outcome = "use label information to answer practical questions and compare foods";
  } else if (subtopic === "Healthy Eating") {
    skill = "sort, compare, and discuss foods using practical nutrition concepts";
    action = "name the foods together, think aloud through one example, and connect the activity to familiar meals";
    outcome = "make and explain a balanced food choice";
  } else if (subtopic === "Tracing Practice") {
    skill = "build letter or number formation, pencil control, and visual tracking";
    action = "demonstrate the starting point and direction, encourage a comfortable grip, and use short practice sessions";
    outcome = "form the featured letters or numbers with improved control";
  } else if (subtopic === "Health and Wellness Vocabulary") {
    skill = "strengthen health vocabulary, spelling, and word recognition";
    action = "read the word bank aloud, define unfamiliar terms, and complete a few clues together before independent work";
    outcome = "recognize and use common health and wellness words";
  } else if (resource.filters?.includes("math") || resource.filter === "math") {
    skill = lower.includes("money")
      ? "count coins and bills in practical money situations"
      : lower.includes("count")
        ? "practice one-to-one counting and connect quantities to written numbers"
        : "build accuracy and confidence with basic number operations";
    action = "solve one example aloud, allow scratch work or manipulatives, and focus on accuracy before speed";
    outcome = lower.includes("money")
      ? "find totals and use money skills in everyday settings"
      : "solve the featured number problems with a strategy that makes sense";
  } else if (resource.filters?.includes("social-emotional") || resource.filter === "social-emotional") {
    skill = "identify feelings, communication choices, and helpful responses in everyday social situations";
    action = "read each prompt aloud, ask what the learner notices, and role-play more than one possible response";
    outcome = "name a feeling or need and choose a respectful, safe response";
  } else if (resource.filters?.includes("coloring") || resource.filter === "coloring") {
    skill = "practice fine-motor control, sustained attention, and creative choice-making";
    action = "offer a small selection of materials, invite conversation about the picture, and let the learner choose colors freely";
    outcome = "complete a relaxing creative activity while practicing hand control and attention";
  }

  return { subtopic, skill, action, outcome };
};

const parseResources = (html) => {
  const anchorPattern = /<a\s+([^>]*class="[^"]*resource-card[^"]*"[^>]*)>([\s\S]*?)<\/a>/g;
  const resources = [];
  let match;

  while ((match = anchorPattern.exec(html))) {
    const [full, attrs, body] = match;
    const visibleHref = attrs.match(/href="([^"]+)"/)?.[1];
    const title = body.match(/class="res-title">([^<]+)/)?.[1];
    if (!visibleHref || !title) continue;

    let href = attrs.match(/data-pdf="([^"]+)"/)?.[1];
    if (!href && visibleHref.endsWith(".pdf")) href = visibleHref;
    if (!href && visibleHref.startsWith("resources/")) {
      const landingPath = path.join(root, visibleHref);
      if (fs.existsSync(landingPath)) {
        const landingHtml = fs.readFileSync(landingPath, "utf8");
        href = landingHtml.match(/class="button primary" href="\.\.\/([^"]+\.pdf)"/)?.[1];
      }
    }
    if (!href) continue;

    const filters = (attrs.match(/data-filter="([^"]+)"/)?.[1] || "life-skills")
      .split(/\s+/)
      .filter(Boolean);
    const filter = filters[0] || "life-skills";
    const thumb = body.match(/<img src="([^"]+)"/)?.[1];
    let variant = attrs.match(/data-worksheet-only="([^"]+)"/)?.[1];
    if (!variant && visibleHref.startsWith("resources/")) {
      const landingPath = path.join(root, visibleHref);
      if (fs.existsSync(landingPath)) {
        const landingHtml = fs.readFileSync(landingPath, "utf8");
        variant = landingHtml.match(/class="button secondary" href="\.\.\/([^"]+\.pdf)"/)?.[1];
      }
    }
    const tags = [...body.matchAll(/<span class="tag">([^<]+)<\/span>/g)].map((item) =>
      stripHtml(item[1]),
    );

    resources.push({
      full,
      attrs,
      body,
      href,
      title: stripHtml(title),
      filter,
      filters,
      thumb,
      variant,
      tags,
    });
  }

  return [...new Map(resources.map((resource) => [resource.href, resource])).values()];
};

const styles = `
:root{--walnut:#3d2e1e;--terracotta:#c4773a;--linen:#f5f0e8;--sage:#5c8c6a;--white:#fff;--muted:#74675b;--border:#e2d9cd}
*{box-sizing:border-box}body{margin:0;background:var(--linen);color:var(--walnut);font-family:Arial,sans-serif;line-height:1.65}
a{color:inherit}.site-header{background:var(--walnut);color:var(--linen)}.nav{max-width:1120px;margin:auto;padding:16px 24px;display:flex;justify-content:space-between;gap:24px;align-items:center}
.brand{display:flex;align-items:center;text-decoration:none}.brand img{width:190px;height:46px;object-fit:contain;background:#fff;border-radius:6px;padding:3px 7px}.nav-links{display:flex;gap:18px;flex-wrap:wrap;align-items:center}.nav-links a{color:var(--linen);font-size:14px;text-decoration:none}
.nav-links .math-tool{background:linear-gradient(135deg,var(--sage),#78a986);color:#fff;padding:7px 15px;border-radius:999px;font-weight:700;box-shadow:0 6px 16px rgba(92,140,106,.32);border:1px solid rgba(255,255,255,.16)}
.nav-links .worksheet-tool{background:rgba(196,119,58,.18);border:1px solid rgba(196,119,58,.65);padding:6px 13px;border-radius:6px;font-weight:600}
.wrap{max-width:1060px;margin:auto;padding:34px 24px 70px}.crumbs{font-size:14px;color:var(--muted);margin-bottom:24px}.crumbs a{color:var(--terracotta)}
.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,390px);gap:48px;align-items:start}.eyebrow{text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:700;color:var(--terracotta)}
h1,h2{font-family:Georgia,serif;line-height:1.2}h1{font-size:clamp(34px,5vw,54px);margin:12px 0 18px}h2{font-size:26px;margin:40px 0 12px}
.lead{font-size:19px;color:#56483d}.tags{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0}.tag{background:#fff;border:1px solid var(--border);padding:5px 10px;border-radius:20px;font-size:13px}
.preview{background:#fff;padding:14px;border-radius:14px;box-shadow:0 10px 30px rgba(61,46,30,.12)}.preview img{width:100%;display:block;border-radius:8px}.preview-note{font-size:13px;color:var(--muted);margin:10px 4px 0}
.button-row{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.button{display:inline-block;padding:12px 19px;border-radius:7px;text-decoration:none;font-weight:700}.primary{background:var(--terracotta);color:#fff}.secondary{background:var(--sage);color:#fff}
.content{max-width:760px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:34px 0}.info{background:#fff;border:1px solid var(--border);border-radius:10px;padding:18px}.info strong{display:block;margin-bottom:4px}
li{margin:8px 0}.related-grid,.category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;text-decoration:none}.card img{width:100%;aspect-ratio:4/5;object-fit:contain;object-position:center top;background:#f8f3eb}.card-body{padding:15px}.card small{color:var(--terracotta);font-weight:700}.card h3{font:700 18px/1.3 Georgia,serif;margin:5px 0}
.category-hero{max-width:760px;margin-bottom:36px}.category-hero p{font-size:18px}.site-footer{background:var(--walnut);color:var(--linen)}.site-footer-inner{max-width:1120px;margin:auto;padding:36px 32px 20px;display:grid;grid-template-columns:minmax(220px,1.35fr) 1fr 1fr;gap:32px}.site-footer-logo{display:inline-flex}.site-footer-logo img{width:190px;height:46px;object-fit:contain;background:#fff;border-radius:6px;padding:3px 7px}.site-footer-tagline{max-width:310px;margin-top:12px;color:rgba(245,240,232,.68);font-size:13px;line-height:1.6}.site-footer h2{margin:0 0 11px;color:var(--linen);font:700 12px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.site-footer-links{display:grid;gap:8px}.site-footer-links a{color:rgba(245,240,232,.72);text-decoration:none;font-size:13px}.site-footer-links a:hover{color:var(--linen)}.site-footer-bottom{max-width:1120px;margin:auto;padding:16px 32px 22px;border-top:1px solid rgba(245,240,232,.12);color:rgba(245,240,232,.48);font-size:12px}
@media(max-width:760px){.hero-grid{grid-template-columns:1fr}.info-grid,.related-grid,.category-grid{grid-template-columns:1fr 1fr}.nav{align-items:flex-start;flex-direction:column}.hero-grid{gap:28px}.site-footer-inner{grid-template-columns:1fr;padding:32px 20px 20px;gap:24px}.site-footer-bottom{padding:16px 20px 20px}}
@media(max-width:480px){.info-grid,.related-grid,.category-grid{grid-template-columns:1fr}.wrap{padding-left:18px;padding-right:18px}}
`;

const headScripts = `<!-- Google Consent Mode defaults — must be set before gtag.js loads -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
  });
</script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-89LMQSQYGT"></script>
<script>
  gtag('js', new Date());
  gtag('config', 'G-89LMQSQYGT');
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6956947027653253"
     crossorigin="anonymous"></script>`;

const cookieBanner = `<!-- COOKIE CONSENT BANNER -->
<div id="cookie-consent-banner" style="display:none;position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#3d2e1e;color:#f5f0e8;padding:1rem 1.5rem;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem;font-family:Arial,sans-serif;box-shadow:0 -2px 16px rgba(0,0,0,0.18);">
  <p style="margin:0;flex:1;min-width:240px;max-width:640px;font-size:0.85rem;line-height:1.6;color:rgba(245,240,232,0.85);">
    We use cookies for basic analytics and to show ads that help keep this site free. You can accept or decline — see our <a href="../legal.html#privacy" style="color:#c4773a;">Privacy Policy</a> for details.
  </p>
  <div style="display:flex;gap:0.6rem;flex-shrink:0;">
    <button id="cookie-decline-btn" style="background:transparent;border:1px solid rgba(245,240,232,0.35);color:#f5f0e8;padding:9px 18px;border-radius:6px;cursor:pointer;font-size:0.82rem;font-family:inherit;">Decline</button>
    <button id="cookie-accept-btn" style="background:#c4773a;border:none;color:#fff;padding:9px 20px;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:500;font-family:inherit;">Accept</button>
  </div>
</div>
<script>
(function() {
  var KEY = 'dthr_cookie_consent';
  var saved = localStorage.getItem(KEY);
  var banner = document.getElementById('cookie-consent-banner');

  function applyConsent(granted) {
    gtag('consent', 'update', {
      'ad_storage': granted ? 'granted' : 'denied',
      'ad_user_data': granted ? 'granted' : 'denied',
      'ad_personalization': granted ? 'granted' : 'denied',
      'analytics_storage': granted ? 'granted' : 'denied'
    });
  }

  if (saved === 'granted' || saved === 'denied') {
    applyConsent(saved === 'granted');
  } else if (banner) {
    banner.style.display = 'flex';
  }

  var acceptBtn = document.getElementById('cookie-accept-btn');
  var declineBtn = document.getElementById('cookie-decline-btn');
  if (acceptBtn) acceptBtn.addEventListener('click', function() {
    localStorage.setItem(KEY, 'granted');
    applyConsent(true);
    banner.style.display = 'none';
  });
  if (declineBtn) declineBtn.addEventListener('click', function() {
    localStorage.setItem(KEY, 'denied');
    applyConsent(false);
    banner.style.display = 'none';
  });
})();
</script>`;

const adSlot = `<div class="ad-slot" style="margin:34px 0;text-align:center;">
  <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);opacity:0.6;margin-bottom:6px;">Advertisement</div>
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-6956947027653253" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;

const header = `
<header class="site-header">
  <nav class="nav" aria-label="Main navigation">
    <a class="brand" href="../index.html"><img src="../logo-header.png" alt="Down the Hall Resources"></a>
    <div class="nav-links">
      <a href="../index.html">Home</a>
      <a href="life-skills-worksheets.html">Life Skills</a>
      <a href="math-number-worksheets.html">Math</a>
      <a href="reading-language-worksheets.html">Reading</a>
      <a href="../about.html">About</a>
      <a href="../contact.html">Contact</a>
      <a class="math-tool" href="../math-generator.html">Custom Math</a>
      <a class="worksheet-tool" href="../generator.html">Build a Worksheet</a>
    </div>
  </nav>
</header>`;

const footer = `<footer class="site-footer">
  <div class="site-footer-inner">
    <div>
      <a class="site-footer-logo" href="../index.html"><img src="../logo-header.png" alt="Down the Hall Resources"></a>
      <p class="site-footer-tagline">Free, practical worksheets supporting learning, everyday skills, and greater independence.</p>
    </div>
    <div>
      <h2>Explore</h2>
      <div class="site-footer-links">
        <a href="life-skills-worksheets.html">Life Skills Worksheets</a>
        <a href="math-number-worksheets.html">Math &amp; Number Worksheets</a>
        <a href="reading-language-worksheets.html">Reading &amp; Language</a>
        <a href="social-emotional-worksheets.html">Social &amp; Emotional Skills</a>
        <a href="coloring-pages.html">Coloring Pages</a>
      </div>
    </div>
    <div>
      <h2>Tools &amp; Information</h2>
      <div class="site-footer-links">
        <a href="../generator.html">Worksheet Generator</a>
        <a href="../math-generator.html">Math Worksheet Generator</a>
        <a href="../about.html">About Down the Hall</a>
        <a href="../editorial-policy.html">How We Create Worksheets</a>
        <a href="mailto:hello@downthehallresources.com">Contact Us</a>
        <a href="../legal.html">Terms &amp; Privacy</a>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">&copy; 2026 Down the Hall Resources. Free to print and use according to our terms.</div>
</footer>`;

const resourceCard = (resource) => `
<a class="card" href="${resource.slug}.html">
  ${resource.thumb ? `<img src="../${escapeHtml(resource.thumb)}" alt="${escapeHtml(imageAltText(resource))}" loading="lazy">` : ""}
  <div class="card-body">
    <small>${escapeHtml(subtopicFor(resource))}</small>
    <h3>${escapeHtml(resource.title)}</h3>
    <span>View worksheet details</span>
  </div>
</a>`;

const wrapCanvasText = (ctx, text, maxWidth) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const roundRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

const drawImageCover = (ctx, img, x, y, width, height) => {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) / 2;
  const sy = Math.max(0, (img.height - sh) * 0.1);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
};

const generateTopicShareImages = async (resources) => {
  fs.mkdirSync(shareImageDir, { recursive: true });
  const logo = await loadImage(path.join(root, "logo-header.png")).catch(() => null);

  for (const topic of topicPages) {
    const matches = resources.filter((resource) => topic.matches(resource) && resource.thumb).slice(0, 3);
    const canvas = createCanvas(1000, 1500);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, 1000, 1500);
    ctx.fillStyle = "#3d2e1e";
    ctx.fillRect(0, 0, 1000, 340);
    ctx.fillStyle = "#c4773a";
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(850, 120, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (logo) {
      roundRect(ctx, 70, 58, 250, 64, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.drawImage(logo, 82, 67, 226, 46);
    }

    ctx.fillStyle = "#c4773a";
    ctx.font = "700 25px Arial";
    ctx.letterSpacing = "2px";
    ctx.fillText("FREE PRINTABLE WORKSHEETS", 70, 190);

    ctx.fillStyle = "#f5f0e8";
    ctx.font = "700 64px Georgia";
    const title = (topic.pinTitle || topic.title).replace(/^Free /, "");
    const titleLines = wrapCanvasText(ctx, title, 860).slice(0, 3);
    let y = 250;
    for (const line of titleLines) {
      ctx.fillText(line, 70, y);
      y += 68;
    }

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 70, 465, 860, 760, 28);
    ctx.fill();
    ctx.strokeStyle = "#e2d9cd";
    ctx.lineWidth = 3;
    ctx.stroke();

    const slots = [
      { x: 115, y: 515, w: 240, h: 310, rotate: -0.035 },
      { x: 380, y: 560, w: 240, h: 310, rotate: 0.025 },
      { x: 645, y: 515, w: 240, h: 310, rotate: 0.035 },
    ];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const resource = matches[i];
      ctx.save();
      ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
      ctx.rotate(slot.rotate);
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, -slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
      ctx.fill();
      ctx.shadowColor = "rgba(61,46,30,.18)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#e2d9cd";
      ctx.lineWidth = 2;
      ctx.stroke();
      if (resource) {
        const img = await loadImage(path.join(root, resource.thumb)).catch(() => null);
        if (img) drawImageCover(ctx, img, -slot.w / 2 + 12, -slot.h / 2 + 12, slot.w - 24, slot.h - 24);
      }
      ctx.restore();
    }

    ctx.fillStyle = "#3d2e1e";
    ctx.font = "700 38px Arial";
    const benefitLines = wrapCanvasText(ctx, topic.description.replace(/^Free printable /, "Printable "), 780).slice(0, 4);
    y = 960;
    for (const line of benefitLines) {
      ctx.fillText(line, 110, y);
      y += 48;
    }

    ctx.fillStyle = "#5c8c6a";
    roundRect(ctx, 110, 1130, 780, 72, 36);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Download free at downthehallresources.com", 500, 1176);
    ctx.textAlign = "left";

    ctx.fillStyle = "#3d2e1e";
    ctx.font = "700 32px Arial";
    ctx.fillText("No account required", 110, 1310);
    ctx.fillStyle = "#6f6257";
    ctx.font = "400 28px Arial";
    ctx.fillText("Print-ready resources for practical learning.", 110, 1360);

    fs.writeFileSync(topicShareImagePath(topic), canvas.toBuffer("image/png"));
  }
};

const resourcePage = (resource, allResources) => {
  const category = categories[resource.filter];
  const details = contentFor(resource);
  const canonical = `${siteUrl}/resources/${resource.slug}.html`;
  const primaryImage = imageUrl(resource);
  const description = `Free printable ${resource.title} worksheet for ${details.subtopic.toLowerCase()} practice. Designed for supported learning at home, school, or community programs.`;
  const related = allResources
    .filter((item) => item.href !== resource.href && item.filters?.includes(resource.filter))
    .sort((a, b) => {
      const aSame = subtopicFor(a) === details.subtopic ? 0 : 1;
      const bSame = subtopicFor(b) === details.subtopic ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 3);
  const tags = [details.subtopic, levelFor(resource), ...resource.tags]
    .filter(
      (tag, index, items) =>
        items.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index,
    )
    .slice(0, 5);

  const primaryImageObject = primaryImage
    ? {
        "@type": "ImageObject",
        "@id": `${canonical}#primaryimage`,
        url: primaryImage,
        contentUrl: primaryImage,
        caption: imageAltText(resource),
        representativeOfPage: true,
      }
    : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: `${resource.title} Worksheet`,
        description,
        inLanguage: "en-US",
        primaryImageOfPage: primaryImageObject ? { "@id": primaryImageObject["@id"] } : undefined,
        mainEntity: { "@id": `${canonical}#learning-resource` },
      },
      ...(primaryImageObject ? [primaryImageObject] : []),
      {
        "@type": "LearningResource",
        "@id": `${canonical}#learning-resource`,
        name: resource.title,
        description,
        url: canonical,
        image: primaryImageObject ? { "@id": primaryImageObject["@id"] } : undefined,
        learningResourceType: "Worksheet",
        educationalUse: "Practice",
        isAccessibleForFree: true,
        inLanguage: "en-US",
        provider: {
          "@type": "Organization",
          name: "Down the Hall Resources",
          url: `${siteUrl}/`,
        },
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "Learner",
        },
        about: details.subtopic,
        teaches: details.skill,
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
      },
    ].map((item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined))),
  };

  for (const item of schema["@graph"]) {
    if (item["@type"] === "LearningResource") {
      item.provider = Object.fromEntries(
        Object.entries(item.provider).filter(([, value]) => value !== undefined),
      );
    }
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${headScripts}
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(resource.title)} Worksheet | Down the Hall Resources</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/png" href="../logo-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Down the Hall Resources">
<meta property="og:title" content="${escapeHtml(resource.title)} Free Printable Worksheet">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
${primaryImage ? `<meta property="og:image" content="${escapeHtml(primaryImage)}">` : ""}
${primaryImage ? `<meta property="og:image:alt" content="${escapeHtml(imageAltText(resource))}">` : ""}
<meta name="twitter:card" content="summary_large_image">
${primaryImage ? `<meta name="twitter:image" content="${escapeHtml(primaryImage)}">` : ""}
${primaryImage ? `<meta name="twitter:image:alt" content="${escapeHtml(imageAltText(resource))}">` : ""}
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>${styles}</style>
</head>
<body>
${cookieBanner}
${header}
<main class="wrap">
  <div class="crumbs"><a href="../index.html">Home</a> / <a href="${category.slug}.html">${escapeHtml(category.name)}</a> / ${escapeHtml(resource.title)}</div>
  <div class="hero-grid">
    <article>
      <div class="eyebrow">Free printable ${escapeHtml(details.subtopic)} worksheet</div>
      <h1>${escapeHtml(resource.title)}</h1>
      <p class="lead">This accessible activity gives learners a clear way to ${escapeHtml(details.skill)}.</p>
      <div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="button-row">
        <a class="button primary" href="../${escapeHtml(resource.href)}" download>Download free PDF</a>
        ${resource.variant ? `<a class="button secondary" href="../${escapeHtml(resource.variant)}" download>Worksheet only</a>` : ""}
      </div>
      <p>No account is required. Print the PDF on standard letter-size paper and use it for individual instruction, small groups, classroom practice, or home learning.</p>
    </article>
    ${resource.thumb ? `<aside class="preview"><img src="../${escapeHtml(resource.thumb)}" alt="${escapeHtml(imageAltText(resource))}"><p class="preview-note">Preview of the printable resource. Download the PDF for the full-size version${resource.variant ? " or choose the worksheet-only edition" : ""}.</p></aside>` : ""}
  </div>

  <div class="content">
    <div class="info-grid">
      <div class="info"><strong>Topic</strong>${escapeHtml(details.subtopic)}</div>
      <div class="info"><strong>Difficulty</strong>${escapeHtml(levelFor(resource))}</div>
      <div class="info"><strong>Format</strong>Printable PDF</div>
    </div>

    <h2>What this worksheet teaches</h2>
    <p>${escapeHtml(resource.title)} gives learners a focused way to ${escapeHtml(details.skill)}. The activity is designed to make the topic easier to discuss, demonstrate, and revisit without requiring special materials.</p>
    <ul>
      <li>Build familiarity with ${escapeHtml(details.subtopic.toLowerCase())} vocabulary and choices.</li>
      <li>Practice completing a structured activity with the right level of support.</li>
      <li>Help the learner ${escapeHtml(details.outcome)}.</li>
    </ul>

    ${adSlot}

    <h2>How to use it</h2>
    <ol>
      <li>Choose the full PDF${resource.variant ? " with its answer key or the worksheet-only version" : ""}, then print one copy per learner.</li>
      <li>${escapeHtml(details.action[0].toUpperCase() + details.action.slice(1))}.</li>
      <li>Review the completed page together and connect the answers to a real routine, object, or situation whenever possible.</li>
    </ol>

    <h2>Who it is for</h2>
    <p>This resource can be adapted for teens and adults with intellectual or developmental disabilities, special education students, transition programs, adult day services, group homes, community centers, and families practicing functional skills. Support can include reading prompts aloud, offering choices, using visual examples, or completing fewer items at one time.</p>
  </div>

  <h2>Related free worksheets</h2>
  <div class="related-grid">${related.map(resourceCard).join("")}</div>
</main>
${footer}
</body>
</html>`;
};

const categoryPage = (key, resources) => {
  const category = categories[key];
  const canonical = `${siteUrl}/resources/${category.slug}.html`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.title,
    description: category.description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Down the Hall Resources", url: `${siteUrl}/` },
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${headScripts}
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(category.title)} | Down the Hall Resources</title>
<meta name="description" content="${escapeHtml(category.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/png" href="../logo-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Down the Hall Resources">
<meta property="og:title" content="${escapeHtml(category.title)}">
<meta property="og:description" content="${escapeHtml(category.description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>${styles}</style>
</head>
<body>
${cookieBanner}
${header}
<main class="wrap">
  <div class="crumbs"><a href="../index.html">Home</a> / ${escapeHtml(category.name)}</div>
  <section class="category-hero">
    <div class="eyebrow">Free printable resource collection</div>
    <h1>${escapeHtml(category.title)}</h1>
    <p>${escapeHtml(category.intro)}</p>
    <p>Every resource is free to download, requires no account, and includes a printable activity designed for flexible support.</p>
  </section>
  <div class="category-grid">${resources.map(resourceCard).join("")}</div>
</main>
${footer}
</body>
</html>`;
};

const topicPage = (topic, resources) => {
  const canonical = `${siteUrl}/resources/${topic.slug}.html`;
  const shareImage = topicShareImageUrl(topic);
  const guidance = topicGuidanceFor(topic);
  const selected = resources
    .filter(topic.matches)
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aScore = topic.keywords.some((word) => aTitle.includes(word)) ? 0 : 1;
      const bScore = topic.keywords.some((word) => bTitle.includes(word)) ? 0 : 1;
      return aScore - bScore || a.title.localeCompare(b.title);
    });
  const shown = selected.slice(0, 24);
  const primaryCategories = [
    ...new Set(
      shown
        .flatMap((resource) => resource.filters || [resource.filter])
        .filter((filter) => categories[filter])
        .map((filter) => categories[filter]),
    ),
  ].slice(0, 4);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: topic.title,
    description: topic.description,
    url: canonical,
    image: shareImage,
    isPartOf: { "@type": "WebSite", name: "Down the Hall Resources", url: `${siteUrl}/` },
    about: topic.keywords,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${headScripts}
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(topic.title)} | Down the Hall Resources</title>
<meta name="description" content="${escapeHtml(topic.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/png" href="../logo-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Down the Hall Resources">
<meta property="og:title" content="${escapeHtml(topic.title)}">
<meta property="og:description" content="${escapeHtml(topic.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${escapeHtml(shareImage)}">
<meta property="og:image:alt" content="${escapeHtml(`${topic.title} preview image`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${escapeHtml(shareImage)}">
<meta name="twitter:image:alt" content="${escapeHtml(`${topic.title} preview image`)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>${styles}</style>
</head>
<body>
${cookieBanner}
${header}
<main class="wrap">
  <div class="crumbs"><a href="../index.html">Home</a> / Topic Collection</div>
  <section class="category-hero">
    <div class="eyebrow">${escapeHtml(topic.eyebrow)}</div>
    <h1>${escapeHtml(topic.title)}</h1>
    <p>${escapeHtml(topic.intro)}</p>
    <p>${escapeHtml(topic.audience)}</p>
  </section>

  <div class="content">
    <h2>How to use these worksheets</h2>
    <p>Start with one worksheet that matches the learner's current routine or goal. Read the directions together, model one example, and allow supports such as verbal choices, pointing, writing assistance, real objects, or fewer questions at one time.</p>
    <ul>
      <li>Use the same worksheet more than once if repetition helps the skill stick.</li>
      <li>Connect the printed activity to real routines, places, objects, or conversations whenever possible.</li>
      <li>Adjust the support level instead of assuming the worksheet is too easy or too hard.</li>
    </ul>

    <h2>Teaching goals for this topic</h2>
    <p>These worksheets are meant to support practical instruction, not replace the judgment of the teacher, direct support professional, therapist, caregiver, or program staff member who knows the learner. The goal is to make the skill easier to introduce, repeat, and apply.</p>
    <ul>
      ${guidance.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("\n      ")}
    </ul>

    <h2>Simple lesson plan idea</h2>
    <p>${escapeHtml(guidance.lesson)}</p>

    <h2>Ways to adapt the activity</h2>
    <p>${escapeHtml(guidance.adapt)}</p>
  </div>

  ${adSlot}

  <h2>Free printable worksheets in this topic</h2>
  <div class="category-grid">${shown.map(resourceCard).join("")}</div>

  <div class="content">
    <h2>Related collections</h2>
    <p>If you are building a broader lesson plan, these collections pair well with this topic.</p>
  </div>
  <div class="related-grid">
    ${primaryCategories
      .map(
        (category) => `<a class="card" href="${category.slug}.html">
      <div class="card-body">
        <small>Worksheet collection</small>
        <h3>${escapeHtml(category.title)}</h3>
        <span>Browse ${escapeHtml(category.name.toLowerCase())}</span>
      </div>
    </a>`,
      )
      .join("")}
  </div>
</main>
${footer}
</body>
</html>`;
};

let indexHtml = fs.readFileSync(sourcePath, "utf8");
const resources = parseResources(indexHtml).map((resource) => ({
  ...resource,
  slug: slugify(path.basename(resource.href, ".pdf")),
}));

fs.mkdirSync(outputDir, { recursive: true });
await generateTopicShareImages(resources);

for (const resource of resources) {
  fs.writeFileSync(
    path.join(outputDir, `${resource.slug}.html`),
    resourcePage(resource, resources),
    "utf8",
  );
}

for (const key of Object.keys(categories)) {
  const categoryResources = resources.filter((resource) => resource.filters?.includes(key));
  fs.writeFileSync(
    path.join(outputDir, `${categories[key].slug}.html`),
    categoryPage(key, categoryResources),
    "utf8",
  );
}

for (const topic of topicPages) {
  fs.writeFileSync(
    path.join(outputDir, `${topic.slug}.html`),
    topicPage(topic, resources),
    "utf8",
  );
}

for (const resource of resources) {
  const escapedHref = resource.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const currentLanding = `resources/${resource.slug}.html`;
  const linkTarget = indexHtml.includes(`href="${resource.href}"`) ? escapedHref : currentLanding;
  const anchorPattern = new RegExp(
    `(<a\\s+[^>]*?)href="${linkTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"([^>]*class="[^"]*resource-card[^"]*"[^>]*>)`,
    "g",
  );
  indexHtml = indexHtml.replace(anchorPattern, (full, before, after) => {
    const cleaned = `${before}href="${currentLanding}" data-pdf="${resource.href}"${after}`
      .replace(/\sdownload(?=[\s>])/g, "")
      .replace(/\sdata-pdf="[^"]+"/g, "")
      .replace(/\sdata-worksheet-only="[^"]+"/g, "");
    return cleaned.replace(`href="${currentLanding}"`, `href="${currentLanding}" data-pdf="${resource.href}"`);
  });
}

const categoryLinks = `
    <!-- CATEGORY LINKS START -->
    <div class="section-header" style="margin-top:0.5rem;">
      <div class="section-label">Explore worksheet collections</div>
    </div>
    <div class="cat-grid" style="margin-bottom:2rem;">
      ${Object.values(categories)
        .map(
          (category) => `<a class="cat-card" href="resources/${category.slug}.html" style="text-decoration:none;color:inherit;">
        <div class="cat-name">${escapeHtml(category.name)}</div>
        <div class="cat-count">Browse free worksheets</div>
      </a>`,
        )
        .join("\n")}
    </div>
    <!-- CATEGORY LINKS END -->
`;

if (indexHtml.includes("<!-- CATEGORY LINKS START -->")) {
  indexHtml = indexHtml.replace(
    /    <!-- CATEGORY LINKS START -->[\s\S]*?    <!-- CATEGORY LINKS END -->/,
    categoryLinks.trimEnd(),
  );
} else if (!indexHtml.includes("Explore worksheet collections")) {
  indexHtml = indexHtml.replace(
    '<div class="main" id="resources-main">',
    `<div class="main" id="resources-main">\n${categoryLinks}`,
  );
}

const topicLinks = `
    <!-- TOPIC LINKS START -->
    <div class="section-header" style="margin-top:0.5rem;">
      <div class="section-label">Popular worksheet topics</div>
    </div>
    <div class="cat-grid" style="margin-bottom:2rem;">
      ${topicPages
        .map(
          (topic) => `<a class="cat-card" href="resources/${topic.slug}.html" style="text-decoration:none;color:inherit;">
        <div class="cat-name">${escapeHtml(topic.title.replace(/^Free /, ""))}</div>
        <div class="cat-count">Topic landing page</div>
      </a>`,
        )
        .join("\n")}
    </div>
    <!-- TOPIC LINKS END -->
`;

if (indexHtml.includes("<!-- TOPIC LINKS START -->")) {
  indexHtml = indexHtml.replace(
    /    <!-- TOPIC LINKS START -->[\s\S]*?    <!-- TOPIC LINKS END -->/,
    topicLinks.trimEnd(),
  );
} else if (indexHtml.includes("Popular worksheet topics")) {
  indexHtml = indexHtml.replace(
    /    <div class="section-header" style="margin-top:0\.5rem;">\s*<div class="section-label">Popular worksheet topics<\/div>\s*<\/div>\s*<div class="cat-grid" style="margin-bottom:2rem;">[\s\S]*?    <\/div>/,
    topicLinks.trimEnd(),
  );
} else {
  indexHtml = indexHtml.replace(categoryLinks, `${categoryLinks}\n${topicLinks}`);
}

fs.writeFileSync(sourcePath, indexHtml, "utf8");

const staticUrls = [
  "/",
  "/generator.html",
  "/math-generator.html",
  "/about.html",
  "/contact.html",
  "/editorial-policy.html",
  "/legal.html",
];
const generatedUrls = [
  ...Object.values(categories).map((category) => `/resources/${category.slug}.html`),
  ...topicPages.map((topic) => `/resources/${topic.slug}.html`),
  ...resources.map((resource) => `/resources/${resource.slug}.html`),
];
const imageByPageUrl = new Map(
  [
    ...resources
    .filter((resource) => resource.thumb)
    .map((resource) => [`/resources/${resource.slug}.html`, imageUrl(resource)]),
    ...topicPages.map((topic) => [`/resources/${topic.slug}.html`, topicShareImageUrl(topic)]),
  ],
);
const sitemapEntries = [...staticUrls, ...generatedUrls]
  .map((url) => {
    const image = imageByPageUrl.get(url);
    return `  <url>
    <loc>${escapeXml(`${siteUrl}${url}`)}</loc>
    <lastmod>${today}</lastmod>${image ? `
    <image:image>
      <image:loc>${escapeXml(image)}</image:loc>
    </image:image>` : ""}
  </url>`;
  })
  .join("\n\n");

fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries}\n</urlset>\n`,
  "utf8",
);

console.log(
  `Generated ${resources.length} worksheet pages, ${Object.keys(categories).length} category pages, and ${topicPages.length} topic pages.`,
);
