export type ResourceSection = { title: string; paragraphs: string[]; items?: string[] };
export type ResourceContent = {
  slug: string; title: string; description: string; audience: string; intent: string;
  kind: "guide" | "template"; sections: ResourceSection[]; related: string[];
  template?: { title: string; fields: string[] }[];
  bridge?: { title: string; copy: string };
  sources?: { label: string; href: string }[];
};

export const RESOURCE_REVIEW_DATE = "2026-09-20";
export const resources: ResourceContent[] = [
  {
    "slug": "annual-appraisal-template",
    "title": "Annual Appraisal Template",
    "description": "A free annual appraisal template for UK managers and employees, with objectives, self-reflection, manager comments and next steps. Copy it, print it or save it as a PDF.",
    "audience": "Managers and employees preparing an annual review in a UK SME",
    "intent": "A usable annual review form, rather than software selection",
    "kind": "template",
    "sections": [
      {
        "title": "How to use the form",
        "paragraphs": [
          "Give the employee time to complete their reflection before the meeting. The manager prepares their observations separately, using the same review period and agreed objectives. Discuss differences rather than treating one version as the correct answer.",
          "Use evidence from across the year. The form is a starting structure: remove questions that do not fit the role and add only those that affect the discussion. If you use ratings, explain the scale before anyone answers."
        ]
      },
      {
        "title": "Keep the form proportionate for a small team",
        "paragraphs": [
          "A useful annual appraisal does not need a long corporate form. For many UK SMEs, four or five focused sections are enough: objectives, employee reflection, manager observations, development actions and a clear sign-off.",
          "If you are the owner or sole HR person running reviews for twenty to fifty people, prefer a form managers can finish without rewriting last year’s answers. Short prompts that ask for evidence beat long competency grids that nobody completes carefully."
        ]
      },
      {
        "title": "Completed example: a customer support role",
        "paragraphs": [
          "Fictional employee: Alex, Customer Support Adviser. Review period: April 2025 to March 2026. Objective: resolve routine enquiries within two working days while maintaining accurate records.",
          "Employee reflection: “I met the response target in nine of twelve months. During the autumn launch I missed the target when complex tickets increased. I created a triage checklist with the team, which reduced repeated handovers.”",
          "Manager observation: “Alex’s records are clear and colleagues can pick up the next step. In October, three complex cases waited too long for escalation. We will agree an escalation trigger and review it after six weeks.”",
          "Agreed next step: Alex will pilot the checklist on complex enquiries by 30 April. The manager will provide one hour of coaching each fortnight. Progress will be checked on 15 June."
        ]
      },
      {
        "title": "Completed example: an operations coordinator in a growing firm",
        "paragraphs": [
          "Fictional employee: Jordan, Operations Coordinator in a 35-person professional services firm. Review period: January to December 2025. Objective: keep client onboarding packs complete within five working days of signed engagement.",
          "Employee reflection: “Eleven of twelve months met the five-day target. In August, three packs slipped when two starters joined the same week. I built a shared checklist so any coordinator can finish a pack, and the average delay fell the following month.”",
          "Manager observation: “Jordan’s packs are clear and clients ask fewer follow-up questions. The August delay was real. Next period we will keep a simple capacity note when more than one starter joins in the same fortnight, and Jordan will own updating that note.”",
          "Agreed next step: Jordan will add the capacity note to the onboarding checklist by 28 February. The manager will review onboarding delays with Jordan each month for the first quarter."
        ]
      },
      {
        "title": "Before you finish",
        "paragraphs": [
          "Record what both people agreed, what remains unresolved and who owns each next step. Keep the finished review in your organisation’s agreed location and share it only with people who need it.",
          "Arrange a shorter progress check before the next annual review. A useful appraisal creates a working plan, rather than a document that is reopened a year later.",
          "If you are running many reviews at once, a blank form alone will not show who has finished. Use the annual appraisal guide to plan the cycle, or run the same structure as a campaign in annual appraisal software so employee and manager answers stay on one record."
        ]
      }
    ],
    "related": [
      "appraisal-questions",
      "annual-appraisal-guide",
      "self-appraisal-template",
      "annual-appraisal-software"
    ],
    "template": [
      {
        "title": "Employee and review details",
        "fields": [
          "Employee name:",
          "Role and department:",
          "Manager:",
          "Review period:",
          "Meeting date:"
        ]
      },
      {
        "title": "Objectives and evidence",
        "fields": [
          "Objective agreed at the start of the period:",
          "Expected result and measure:",
          "Actual result, with examples:",
          "What changed or prevented progress?"
        ]
      },
      {
        "title": "Employee reflection",
        "fields": [
          "What went well, and what evidence supports it?",
          "What was difficult, and what did you learn?",
          "Which strengths helped the team?",
          "What support would help you do the role well?"
        ]
      },
      {
        "title": "Manager observations",
        "fields": [
          "What did the employee deliver?",
          "Where did performance meet or exceed the agreed standard?",
          "What needs to improve? Include a specific example.",
          "What support will the manager provide?"
        ]
      },
      {
        "title": "Development and next steps",
        "fields": [
          "Development priority:",
          "Action and owner:",
          "Support or resources required:",
          "Target date:",
          "Next progress meeting:",
          "Employee comments or points of disagreement:",
          "Manager comments:",
          "Date acknowledged by employee and manager:"
        ]
      }
    ],
    "bridge": {
      "title": "Want to run this as a structured annual cycle instead?",
      "copy": "Use the same questions in annual appraisal software: create a campaign, collect employee and manager responses on one record, and see who is still outstanding without chasing by spreadsheet."
    }
  },
  {
    "slug": "self-appraisal-template",
    "title": "Self Appraisal Template",
    "description": "A free employee self-assessment form to prepare for your review. Copy the prompts, print the form or save it as a PDF.",
    "audience": "Employees preparing their own review",
    "intent": "Blank self-reflection prompts, distinct from completed answer examples",
    "kind": "template",
    "sections": [
      {
        "title": "Prepare your evidence",
        "paragraphs": [
          "Look back over the whole review period: objectives, project notes, customer feedback and work you delivered. Choose a few examples that show your contribution, rather than listing everything you did.",
          "Separate results from effort. “I attended weekly project meetings” describes an activity. “I resolved the handover issue so the project met its deadline” explains a contribution. Only use figures you can support."
        ]
      },
      {
        "title": "Worked example: improving a team handover",
        "paragraphs": [
          "Fictional example: “My objective was to make the weekly stock handover more reliable. I introduced a checklist and tested it with both shifts. Missed entries fell from six in the first month to two in the last month. The improvement was shared work: the evening team helped simplify the checklist.”",
          "“I still need to flag unusual stock movements sooner. Next period I would like to agree an exception threshold with my manager and review the log every Friday for six weeks.”",
          "This answer names the objective, the employee’s action, a result and an improvement. It acknowledges the team’s contribution without hiding the employee’s part."
        ]
      },
      {
        "title": "When you are unsure what to write",
        "paragraphs": [
          "If an objective changed, explain when it changed and what was agreed instead. If a result was missed, describe the gap, the factors involved and your next action. Avoid blaming another person or claiming success without evidence.",
          "Write down questions for your manager. Self-assessment should help the conversation: it is not a test of who can sound most confident."
        ]
      }
    ],
    "related": [
      "appraisal-answers",
      "appraisal-objectives",
      "employee-appraisal-software"
    ],
    "template": [
      {
        "title": "Review details",
        "fields": [
          "Employee name and role:",
          "Manager:",
          "Review period:",
          "Review meeting date:"
        ]
      },
      {
        "title": "Achievements",
        "fields": [
          "Agreed objective:",
          "What I delivered:",
          "Evidence or example:",
          "My contribution and others who helped:"
        ]
      },
      {
        "title": "Strengths and learning",
        "fields": [
          "A strength I used well:",
          "A situation that shows it:",
          "Something I found difficult:",
          "What I learned or would change:"
        ]
      },
      {
        "title": "Support and development",
        "fields": [
          "Support I need from my manager:",
          "Skill or experience I want to develop:",
          "A practical development action:",
          "Resources and time required:"
        ]
      },
      {
        "title": "Next period",
        "fields": [
          "Proposed objective and success measure:",
          "Target date:",
          "Questions I want to discuss:",
          "Agreed actions after the meeting:"
        ]
      }
    ],
    "bridge": {
      "title": "Give employees a clear starting point",
      "copy": "Appraisal Software lets you prepare reusable questions and collect employee self-assessments alongside manager responses before the review conversation."
    }
  },
  {
    "slug": "probation-review-template",
    "title": "Probation Review Template",
    "description": "A free probation review form for UK managers and employees, with evidence prompts, support actions and a follow-up checklist.",
    "audience": "Managers reviewing a new starter",
    "intent": "A probation-specific form focused on expectations, support and evidence",
    "kind": "template",
    "sections": [
      {
        "title": "Prepare for the probation meeting",
        "paragraphs": [
          "Check the expectations agreed when the person joined and collect examples from the role. Ask the employee how induction, training and manager support have worked. Do not introduce a concern for the first time in the final meeting if it could have been discussed earlier.",
          "This form helps structure a conversation. It does not decide employment outcomes or replace your organisation’s policy, contract or appropriate advice. Follow your established process for any formal decision."
        ]
      },
      {
        "title": "Completed example: an operations assistant",
        "paragraphs": [
          "Fictional example: “Jordan completes the daily reconciliation accurately and has handled the standard supplier queries independently for three weeks. The remaining development need is escalating discrepancies on the day they are found.”",
          "Support action: the manager will demonstrate two exception cases on Tuesday. Jordan will use the escalation checklist for the next four weeks. They will review examples together each Friday.",
          "Record the evidence and the action separately from the organisation’s formal outcome. A general label such as “needs confidence” is less useful than the behaviour that needs support."
        ]
      },
      {
        "title": "Follow-up checklist",
        "paragraphs": [
          "Share the written summary with the employee. Confirm who will provide support, when progress will be reviewed and how the formal outcome will be communicated under your organisation’s process."
        ],
        "items": [
          "Check role expectations were clear and realistic.",
          "Include employee feedback about induction and support.",
          "Write specific examples rather than personality judgements.",
          "Record actions, owners and review dates.",
          "Follow the relevant internal process for the outcome."
        ]
      }
    ],
    "related": [
      "self-appraisal-template",
      "appraisal-comments",
      "employee-appraisal-software"
    ],
    "template": [
      {
        "title": "Review details",
        "fields": [
          "Employee name and role:",
          "Manager:",
          "Start date:",
          "Review date and period covered:"
        ]
      },
      {
        "title": "Role expectations",
        "fields": [
          "Expectation or task:",
          "Standard agreed:",
          "Evidence observed:",
          "Employee perspective:",
          "Training or support provided:"
        ]
      },
      {
        "title": "Progress and support",
        "fields": [
          "What is going well?",
          "What needs further practice or clarification?",
          "What has helped or hindered induction?",
          "What additional support is needed?"
        ]
      },
      {
        "title": "Actions and record",
        "fields": [
          "Agreed action:",
          "Owner and support:",
          "Target date:",
          "Next review date:",
          "Outcome recorded under the organisation’s process:",
          "Employee comments:",
          "Manager comments and date:"
        ]
      }
    ],
    "bridge": {
      "title": "Keep review prompts consistent",
      "copy": "Use reusable forms in Appraisal Software to collect manager and employee observations. Your organisation remains responsible for the probation decision and process."
    },
    "sources": [
      {
        "label": "Acas: probation review meetings",
        "href": "https://www.acas.org.uk/probation-periods/reviews"
      }
    ]
  },
  {
    "slug": "personal-development-plan-template",
    "title": "Personal Development Plan Template",
    "description": "A free personal development plan with goals, practical actions, support and progress measures. Copy it, print it or save it as a PDF.",
    "audience": "Employees and managers agreeing development after a review",
    "intent": "A development action plan, distinct from performance objectives",
    "kind": "template",
    "sections": [
      {
        "title": "Choose one or two development priorities",
        "paragraphs": [
          "Start with the skill or experience that would make the biggest difference to the person’s work. Explain why it matters and what improvement would look like in a real situation. A long training wish list is difficult to follow through.",
          "Learning can include coaching, observing a colleague, supervised practice or taking responsibility for a small piece of work. A course can help, but completing a course is not the same as using the skill."
        ]
      },
      {
        "title": "Completed example: leading a project update",
        "paragraphs": [
          "Fictional goal: “By July, I will lead the fortnightly project update so that attendees understand risks, decisions and next steps.”",
          "Actions: observe two experienced colleagues; prepare an agenda with my manager; lead three updates; ask attendees whether the next steps were clear. Support: thirty minutes of preparation time with the manager before each update.",
          "Evidence: each meeting ends with named owners and dates; outstanding decisions are recorded. Review: discuss feedback after the third meeting and agree what to practise next."
        ]
      },
      {
        "title": "Review the plan",
        "paragraphs": [
          "Book the first check-in when you agree the plan. Ask what the employee has tried, what changed in their work and what support is missing. Adjust the plan if priorities or available time change.",
          "Keep performance objectives and development goals connected but distinct. One describes the result the role needs; the other describes a capability the person wants to build."
        ]
      }
    ],
    "related": [
      "appraisal-objectives",
      "annual-appraisal-template",
      "annual-appraisal-guide"
    ],
    "template": [
      {
        "title": "Plan details",
        "fields": [
          "Employee and role:",
          "Manager or supporting colleague:",
          "Plan period:",
          "Date agreed:"
        ]
      },
      {
        "title": "Development goal",
        "fields": [
          "Skill or experience to develop:",
          "Why it matters in this role:",
          "What improved practice will look like:"
        ]
      },
      {
        "title": "Actions and support",
        "fields": [
          "Learning or practice action:",
          "Employee’s responsibility:",
          "Manager’s support:",
          "Time, resources or budget needed:",
          "Target date:"
        ]
      },
      {
        "title": "Progress review",
        "fields": [
          "Evidence of using the skill:",
          "Feedback to collect:",
          "Check-in date:",
          "Progress and obstacles:",
          "Changes agreed:",
          "Next action and owner:"
        ]
      }
    ],
    "bridge": {
      "title": "Connect the plan to the appraisal conversation",
      "copy": "Include development prompts in your Appraisal Software form so the employee and manager can prepare their priorities. Agree the final actions together in the meeting."
    }
  },
  {
    "slug": "360-feedback-template",
    "title": "360 Feedback Template",
    "description": "A free 360 feedback form with questions, an example rating scale and prompts for managers, peers and direct reports. Copy it, print it or save it as a PDF.",
    "audience": "Managers and facilitators preparing multi-rater feedback",
    "intent": "A usable form, distinct from the larger question bank",
    "kind": "template",
    "sections": [
      {
        "title": "Choose reviewers and explain the process",
        "paragraphs": [
          "Choose people who have enough direct experience of the subject’s work to answer the questions. Use questions that each relationship can observe: a direct report can comment on clarity of direction, while a peer can comment on handovers.",
          "Before collecting responses, explain the purpose, who will see them, whether names will be shown and how comments will be used. Do not promise anonymity unless your actual collection and reporting process can support it."
        ]
      },
      {
        "title": "Example rating scale",
        "paragraphs": [
          "Use the same scale for every reviewer. This example is a starting point, not a validated assessment instrument."
        ],
        "items": [
          "1 — Rarely demonstrates the behaviour in situations I observe.",
          "2 — Demonstrates it sometimes, with noticeable gaps.",
          "3 — Usually demonstrates it in relevant situations.",
          "4 — Consistently demonstrates it, including difficult situations.",
          "5 — Consistently demonstrates it and helps others do the same.",
          "Not observed — I do not have enough experience to rate this."
        ]
      },
      {
        "title": "Completed example: peer feedback",
        "paragraphs": [
          "Fictional response: communication — 4. “In the last two project handovers, Morgan explained dependencies and confirmed the owner of each action. When the delivery date changed, the update arrived before our planning meeting.”",
          "Development comment: “On urgent requests, I sometimes receive the task without the reason for the deadline. Adding that context would help me prioritise.”",
          "The example describes observable behaviour and its effect. It avoids guessing motives or judging the person’s character."
        ]
      },
      {
        "title": "Summarise and discuss",
        "paragraphs": [
          "Keep “not observed” separate from a low score. Look for repeated themes and relevant examples rather than treating an average as a final judgement. Small reviewer groups and recognisable incidents can reveal identities even when names are omitted.",
          "Discuss one strength to keep and one or two changes to try. Agree a follow-up date so the exercise leads to development rather than simply producing a report."
        ]
      }
    ],
    "related": [
      "360-feedback-questions",
      "360-feedback-examples",
      "360-feedback-software"
    ],
    "template": [
      {
        "title": "Feedback details",
        "fields": [
          "Person receiving feedback:",
          "Review period:",
          "Reviewer relationship:",
          "Purpose and who will see responses:",
          "How reviewer names and comments will be handled:"
        ]
      },
      {
        "title": "Observable behaviours",
        "fields": [
          "Communication — explains priorities and listens to questions. Rating or not observed:",
          "Teamwork — shares information and follows through on commitments. Rating or not observed:",
          "Decision-making — explains decisions and considers relevant information. Rating or not observed:",
          "Example supporting a rating:"
        ]
      },
      {
        "title": "Relationship-specific prompt",
        "fields": [
          "Manager: how reliably does this person deliver agreed work?",
          "Peer: how effectively does this person coordinate shared work?",
          "Direct report: how clearly does this person explain expectations and provide support?",
          "Self: where does my own view differ from feedback I have received?"
        ]
      },
      {
        "title": "Strengths and development",
        "fields": [
          "What should this person continue doing? Include an example.",
          "What could they do differently? Describe the effect.",
          "One practical suggestion for the next period:",
          "Anything you could not observe or assess:"
        ]
      }
    ]
  },
  {
    "slug": "annual-appraisal-guide",
    "title": "Annual Appraisal Guide",
    "description": "How to prepare, run and follow up an annual employee appraisal, with a practical checklist for UK managers and small teams.",
    "audience": "Managers organising annual reviews",
    "intent": "Process guidance rather than a blank form or software pitch",
    "kind": "guide",
    "sections": [
      {
        "title": "What an annual appraisal is for",
        "paragraphs": [
          "An annual appraisal is a planned discussion about work over a defined period: what was delivered, what was difficult and what should happen next. The employee brings their experience; the manager brings observations and the expectations of the role.",
          "Use it alongside regular conversations. Waiting a year to discuss a problem makes examples harder to recall and leaves less time to provide support."
        ]
      },
      {
        "title": "Two weeks before: agree the preparation",
        "paragraphs": [
          "Confirm the review period and the purpose of the meeting. Send the form and ask both people to prepare examples. Allow enough time for the employee to ask questions about the process.",
          "Check the objectives agreed at the last review and any changes during the year. Gather evidence from across the period, including less recent work. Avoid letting the latest project dominate the whole review."
        ],
        "items": [
          "Share the questions and any rating definitions.",
          "Ask the employee to complete a self-assessment.",
          "Prepare manager observations separately.",
          "Choose a private setting with time for discussion."
        ]
      },
      {
        "title": "During the meeting: compare perspectives",
        "paragraphs": [
          "Start with the employee’s reflection. Ask what they are proud of, what they found difficult and what support they needed. Then share your observations using specific examples and their effect.",
          "If your views differ, explore the evidence and context. Record an unresolved difference honestly rather than forcing a shared rating. Separate a lack of skill from unclear expectations or insufficient resources.",
          "Spend time on the next period. Agree a small number of objectives and development actions, with owners, measures and dates."
        ]
      },
      {
        "title": "After the meeting: turn discussion into actions",
        "paragraphs": [
          "Write a short summary while the conversation is fresh. Share it with the employee and confirm any amendments. Store it according to your organisation’s agreed approach.",
          "Book an earlier check-in to review actions. At that meeting, ask what progress has been made and what needs to change; do not simply check whether the form was completed."
        ]
      },
      {
        "title": "Common mistakes to avoid",
        "paragraphs": [
          "Long question lists produce repetitive answers. Choose prompts that inform a decision or useful discussion. Vague labels such as “more proactive” need a concrete example of what someone should do.",
          "Keep developmental conversation distinct from any formal capability or disciplinary process. This guide is a practical meeting structure, not employment-law advice. Acas provides additional guidance and appraisal form templates."
        ]
      }
    ],
    "related": [
      "annual-appraisal-template",
      "appraisal-objectives",
      "annual-appraisal-software"
    ],
    "bridge": {
      "title": "Make preparation easier to coordinate",
      "copy": "Set up an annual appraisal campaign in Appraisal Software, collect employee and manager responses, and track completion before the meetings."
    },
    "sources": [
      {
        "label": "Acas: reviews and appraisals",
        "href": "https://www.acas.org.uk/performance-management"
      },
      {
        "label": "Acas: appraisal form templates",
        "href": "https://www.acas.org.uk/appraisal-templates"
      }
    ]
  },
  {
    "slug": "appraisal-answers",
    "title": "Self Appraisal Answers and Examples",
    "description": "Employee self-appraisal answer examples for achievements, challenges, development and manager support, with advice on making each answer your own.",
    "audience": "Employees writing self-assessment answers",
    "intent": "First-person employee examples; manager comments live separately",
    "kind": "guide",
    "sections": [
      {
        "title": "Build an answer from evidence",
        "paragraphs": [
          "A useful answer names the situation or objective, explains your contribution and describes the result. Finish with what you learned or will do next. Keep it honest: a modest result with clear evidence is stronger than a broad claim you cannot support.",
          "The examples below are fictional. Adapt the structure to your work; do not copy their results or present invented figures as your own."
        ]
      },
      {
        "title": "What went well?",
        "paragraphs": [
          "Example: “I helped our team reduce repeated invoice queries by rewriting the supplier checklist. I tested it with two colleagues and added the questions they found unclear. We received fewer queries about missing references in the following month, although I would need a longer period to measure the effect.”",
          "Why it works: it explains the action, recognises shared work and avoids claiming that a short observation proves a lasting improvement."
        ]
      },
      {
        "title": "Which objective did you meet?",
        "paragraphs": [
          "Example: “My objective was to complete the new-starter guidance by the end of June. I delivered the first version on 24 June and incorporated feedback from the next two starters. The deadline was met, but the guidance still needs a section for remote access.”",
          "Adapt it: name the agreed deadline or standard, the actual result and any remaining work. “I worked hard” does not tell the reviewer whether the objective was achieved."
        ]
      },
      {
        "title": "What could have gone better?",
        "paragraphs": [
          "Example: “I did not flag the delivery risk early enough on the spring project. I tried to resolve it myself, which left the manager less time to adjust the plan. Next time I will raise a risk when a dependency misses its first agreed date.”",
          "Why it works: it acknowledges responsibility and proposes an observable change. Explain relevant constraints without using them to erase your own part."
        ]
      },
      {
        "title": "What support do you need?",
        "paragraphs": [
          "Example: “I can handle routine customer questions independently. For complex contract changes, I need a clear escalation route and a weekly slot to review examples with the team lead. That would help me make more consistent decisions.”",
          "Be specific about the support, the situation where it is needed and the benefit. Your manager can respond more usefully to a concrete request than to “more training”."
        ]
      },
      {
        "title": "What do you want to develop?",
        "paragraphs": [
          "Example: “I want to become more effective at presenting project risks. Over the next three months I would like to lead two updates, ask attendees what was clear and discuss the feedback with my manager.”",
          "Before submitting, check that each answer relates to this review period. Remove repeated examples, unsupported numbers and statements that describe another person’s motives."
        ]
      }
    ],
    "related": [
      "self-appraisal-template",
      "appraisal-objectives",
      "employee-appraisal-software"
    ],
    "bridge": {
      "title": "Give the reflection a clear structure",
      "copy": "Appraisal Software gives employees structured prompts before the review, with manager responses collected alongside the self-assessment."
    }
  },
  {
    "slug": "appraisal-comments",
    "title": "Manager Appraisal Comments and Examples",
    "description": "Manager-written appraisal comment examples for performance, strengths and development, with practical wording grounded in observable work.",
    "audience": "Managers writing review observations",
    "intent": "Manager perspective and fair evidence; employee answers live separately",
    "kind": "guide",
    "sections": [
      {
        "title": "Write about the work you observed",
        "paragraphs": [
          "Name the expected standard, the behaviour or result you observed and its effect. Then explain what should continue or change. Avoid turning one incident into a judgement about the employee’s character.",
          "These fictional examples illustrate structure. Use your own evidence from across the review period and give the employee an opportunity to explain their perspective."
        ]
      },
      {
        "title": "Recognising reliable delivery",
        "paragraphs": [
          "Example: “During the quarterly reporting cycle, Sam submitted each draft by the agreed date and resolved the checks before publication. This gave the team time to review the figures without delaying the release. Continue using the preparation checklist next quarter.”",
          "This is more useful than “Sam is excellent”: it identifies a repeatable practice and explains why it matters."
        ]
      },
      {
        "title": "Recognising teamwork",
        "paragraphs": [
          "Example: “Priya helped the new team members understand the stock process by demonstrating the first reconciliation and reviewing their questions. Both could complete routine checks independently by the second week. Keep sharing that approach when the next starter joins.”",
          "Credit the contribution without assuming the employee must always absorb additional work. Discuss the time and support needed if coaching becomes a regular responsibility."
        ]
      },
      {
        "title": "Describing a development need",
        "paragraphs": [
          "Example: “In two project handovers, the next owner was not confirmed, so the tasks were picked up late. For the next month, record an owner and due date for each handover and confirm them with the receiving colleague. I will review the first two handovers with you.”",
          "The comment describes the gap and manager support. Replace “poor communicator” with the specific communication behaviour that needs to change."
        ]
      },
      {
        "title": "When an objective was partly met",
        "paragraphs": [
          "Example: “The team delivered the first release on time, but the documentation objective was only partly completed. The scope expanded in May and we did not reset the deadline. We will agree a smaller documentation milestone and protected time to finish it.”",
          "Include changes in expectations or resources. Do not assess someone against a target that changed without acknowledging that change."
        ]
      },
      {
        "title": "Check the comment before sharing",
        "paragraphs": [
          "Ask whether the evidence supports the wording, whether the standard was clear and whether you would use the same language for another employee in the same situation. Avoid “always” and “never” unless the evidence genuinely supports them.",
          "Keep formal employment decisions within your organisation’s established processes. These examples help write a review; they do not replace those processes."
        ]
      }
    ],
    "related": [
      "appraisal-answers",
      "probation-review-template",
      "employee-appraisal-software"
    ],
    "bridge": {
      "title": "Prepare both sides of the review",
      "copy": "Collect manager observations and employee self-assessments in Appraisal Software, then use the differences as prompts for the conversation."
    }
  },
  {
    "slug": "appraisal-objectives",
    "title": "Appraisal Objectives and Examples",
    "description": "Practical appraisal objective examples with success measures, deadlines and support, for managers and employees planning the next review period.",
    "audience": "Managers and employees agreeing next-period results",
    "intent": "Measurable work outcomes, distinct from development actions",
    "kind": "guide",
    "sections": [
      {
        "title": "Turn an intention into an objective",
        "paragraphs": [
          "An objective describes a result the role needs, not just an activity. Agree what will change, how you will know it happened, when it is due and what support is available. Check that the person has enough influence over the result.",
          "“Improve communication” is too broad. “Send the weekly delivery update by Thursday afternoon, with risks, decisions and named action owners, for the next eight weeks” gives both people something to review."
        ]
      },
      {
        "title": "Customer service example",
        "paragraphs": [
          "Objective: resolve routine enquiries within the team’s agreed response window over the next quarter, while keeping complete case notes.",
          "Measure: review a sample of closed cases each fortnight against the response window and notes checklist. Support: the manager will clarify which cases must be escalated.",
          "Why it works: it balances speed with quality and acknowledges that complex enquiries may need another person’s decision."
        ]
      },
      {
        "title": "Operations example",
        "paragraphs": [
          "Objective: complete the weekly stock reconciliation by midday Friday for the next twelve weeks and raise discrepancies on the day they are found.",
          "Measure: the dated reconciliation log and discrepancy records. Support: access to the source reports and cover when the employee is absent.",
          "Avoid making someone responsible for resolving every discrepancy if supplier or system changes are outside their control."
        ]
      },
      {
        "title": "Project delivery example",
        "paragraphs": [
          "Objective: deliver the agreed first draft of the onboarding guide by 30 June, test it with two new starters and incorporate feedback by 15 July.",
          "Measure: dated drafts and feedback notes. Support: one review session with the team lead each fortnight.",
          "A review date matters when the scope changes. Agree how to reset the objective if the project’s inputs or priorities move."
        ]
      },
      {
        "title": "Manager example",
        "paragraphs": [
          "Objective: hold a monthly development check-in with each direct report for the next quarter and record one agreed action after each conversation.",
          "Measure: completed check-ins and actions reviewed at the following meeting. Support: protected time in the team schedule.",
          "Completing meetings alone is not proof that support improved. Ask employees whether the actions helped and adjust the approach."
        ]
      },
      {
        "title": "Review objectives fairly",
        "paragraphs": [
          "Use a small number of priorities that reflect the role. Too many objectives obscure the most important work. Explain the measure before the review period starts.",
          "At the check-in, compare the result with the agreed expectation and discuss changed circumstances. If a target became unrealistic, record the change and the revised agreement rather than quietly rewriting history."
        ]
      }
    ],
    "related": [
      "personal-development-plan-template",
      "annual-appraisal-template",
      "annual-appraisal-guide"
    ],
    "bridge": {
      "title": "Include objectives in the review form",
      "copy": "Use reusable prompts in Appraisal Software to collect progress and evidence from employees and managers before you agree the next period’s priorities."
    },
    "sources": [
      {
        "label": "Acas: setting fair, measurable objectives",
        "href": "https://www.acas.org.uk/performance-management"
      }
    ]
  },
  {
    "slug": "360-degree-feedback",
    "title": "What Is 360 Degree Feedback?",
    "description": "A practical guide to 360 degree feedback: who takes part, how to choose questions, how to handle responses and how to turn themes into development actions.",
    "audience": "Managers and facilitators evaluating multi-rater feedback",
    "intent": "Explanation and process, distinct from software selection and forms",
    "kind": "guide",
    "sections": [
      {
        "title": "What 360 degree feedback means",
        "paragraphs": [
          "360 degree feedback collects observations about a person’s work from several perspectives, commonly their manager, peers, direct reports and the person themselves. Different reviewers see different parts of the role.",
          "It can highlight strengths and development needs that one manager would miss. It is not a complete picture of a person, and an average score is not an objective verdict."
        ]
      },
      {
        "title": "How it differs from an annual appraisal",
        "paragraphs": [
          "An annual appraisal usually compares the employee’s work with agreed role expectations and objectives. A 360 exercise adds views from people who work with them, often focused on observable behaviours.",
          "The two can inform the same development conversation, but explain their purposes clearly. Reviewers should know whether their responses are for development or will inform other decisions."
        ]
      },
      {
        "title": "Choose reviewers who can observe the work",
        "paragraphs": [
          "Select people with recent, relevant experience rather than simply collecting the largest possible group. A peer may see coordination and reliability; a direct report may see clarity and support.",
          "Let reviewers select “not observed”. Forcing a score from someone without direct experience adds uncertainty, not insight."
        ]
      },
      {
        "title": "Make privacy expectations explicit",
        "paragraphs": [
          "Explain who will see responses, how names will be handled and what will appear in a summary. Removing names does not guarantee anonymity: a unique situation or very small group can identify a reviewer.",
          "Do not make promises your actual process cannot keep. Decide how comments will be reviewed and shared before invitations are sent, rather than after sensitive responses arrive."
        ]
      },
      {
        "title": "Interpret themes with care",
        "paragraphs": [
          "Compare perspectives and examples. A difference between self and others can start a conversation, but it does not by itself show who is right. Reviewer groups may have different opportunities to observe the behaviour.",
          "Avoid presenting fictional scales as validated psychometric assessments. The resources here provide practical prompts, not a diagnostic instrument."
        ]
      },
      {
        "title": "Close the loop",
        "paragraphs": [
          "Discuss the summary with the person receiving feedback. Agree one strength to continue and one or two changes to try, with support and a review date.",
          "The exercise is useful when the person can understand and act on the feedback. A long report without a conversation or follow-up leaves the hard part unfinished."
        ]
      }
    ],
    "related": [
      "360-feedback-template",
      "360-feedback-examples",
      "360-feedback-software"
    ],
    "sources": [
      {
        "label": "Center for Creative Leadership: implementing a 360 feedback initiative",
        "href": "https://www.ccl.org/articles/leading-effectively-articles/how-to-implement-360-feedback-initiative/"
      }
    ]
  },
  {
    "slug": "360-feedback-questions",
    "title": "360 Feedback Questions",
    "description": "Example 360 feedback questions by competency and reviewer relationship, with guidance on choosing observable behaviours and avoiding leading questions.",
    "audience": "Facilitators choosing questions",
    "intent": "A larger question bank, rather than a ready-to-use form",
    "kind": "guide",
    "sections": [
      {
        "title": "Choose questions reviewers can answer",
        "paragraphs": [
          "Select a small set that relates to the purpose of the exercise. Each question should describe one observable behaviour. Combine a rating, if useful, with a request for an example.",
          "Use “not observed” where reviewers lack relevant experience. Avoid asking reviewers to guess someone’s intentions or agree with a flattering statement."
        ]
      },
      {
        "title": "Communication",
        "paragraphs": [
          "Use these prompts when reviewers regularly exchange information with the subject."
        ],
        "items": [
          "How clearly does this person explain priorities and next steps?",
          "How reliably do they share updates before others need to act?",
          "How do they check that others have understood?",
          "Give an example of a conversation that helped or hindered shared work."
        ]
      },
      {
        "title": "Teamwork and follow-through",
        "paragraphs": [
          "Focus on commitments and coordination rather than popularity."
        ],
        "items": [
          "How reliably does this person follow through on agreed actions?",
          "How do they handle a dependency that puts someone else’s work at risk?",
          "How effectively do they share information during handovers?",
          "What should they continue doing to make shared work easier?"
        ]
      },
      {
        "title": "Leadership and support",
        "paragraphs": [
          "These are most useful for reviewers who experience the person’s leadership directly."
        ],
        "items": [
          "How clearly does this person explain what good work looks like?",
          "How available are they when a decision or support is needed?",
          "How do they respond when someone raises a concern?",
          "Give an example of feedback that helped you improve your work."
        ]
      },
      {
        "title": "Decision-making",
        "paragraphs": [
          "Ask about decisions reviewers have actually seen."
        ],
        "items": [
          "How clearly does this person explain the reason for a decision?",
          "How do they seek relevant information before deciding?",
          "How do they respond when new information changes the situation?",
          "What one change would make their decisions easier to act on?"
        ]
      },
      {
        "title": "Adapt by relationship",
        "paragraphs": [
          "Manager: ask about agreed results, judgement and escalation. Peer: ask about coordination, information sharing and reliability. Direct report: ask about expectations, support and feedback. Self: ask for reflection on the same behaviours.",
          "Keep common behavioural questions consistent if you want to compare perspectives. Add relationship-specific prompts only where they answer a different useful question."
        ]
      },
      {
        "title": "Questions to avoid",
        "paragraphs": [
          "“Is this person an inspiring leader?” is vague and encourages a general impression. “How clearly does this person explain the team’s next priorities?” describes something a reviewer can observe.",
          "“Are they reliable and supportive?” combines two behaviours. Split it if both matter. Avoid demanding a positive or negative anecdote from someone who has not observed one."
        ]
      }
    ],
    "related": [
      "360-feedback-template",
      "360-degree-feedback",
      "360-feedback-software"
    ]
  },
  {
    "slug": "360-feedback-examples",
    "title": "360 Feedback Examples",
    "description": "Fictional 360 feedback comments and a sample summary report, showing how to describe behaviours, compare perspectives and agree development actions.",
    "audience": "Reviewers writing comments and facilitators summarising themes",
    "intent": "Completed comments and report interpretation, distinct from blank questions",
    "kind": "guide",
    "sections": [
      {
        "title": "A useful comment names behaviour and effect",
        "paragraphs": [
          "Describe what you saw, the situation and the effect on the work. Then suggest what should continue or change. Do not diagnose personality or assume a motive.",
          "All names, comments and scores on this page are fictional illustrations. The sample is not an assessment result or a product report."
        ]
      },
      {
        "title": "Peer example: a strength",
        "paragraphs": [
          "“During the last two launch handovers, Casey listed dependencies and confirmed who owned each action. That helped our team plan without repeated clarification. Please keep using that structure.”",
          "The reviewer describes a recent situation and a practice that can be repeated. It is more actionable than “Casey is a great team player”."
        ]
      },
      {
        "title": "Direct report example: a development area",
        "paragraphs": [
          "“When priorities changed in April, I understood the new deadline but not which existing tasks could wait. A short explanation of the trade-off would help me plan. The weekly check-in would be a useful place to confirm it.”",
          "This raises a gap without guessing why the manager acted that way. It includes a practical request rather than just expressing frustration."
        ]
      },
      {
        "title": "Manager example: recognising progress",
        "paragraphs": [
          "“Taylor now raises project risks before they affect the delivery date. In the last project, that gave us time to move the testing slot. The next step is to explain the proposed options alongside the risk.”",
          "Recognition and development can sit together. Keep the next step specific so it does not cancel out the positive observation."
        ]
      },
      {
        "title": "Fictional summary report",
        "paragraphs": [
          "Illustrative communication ratings on a five-point scale: self 3.0; manager 4.0; peers 3.5. These numbers are invented to show interpretation, not a meaningful benchmark.",
          "Theme: reviewers value clear handovers, while some want earlier explanation when priorities change. The self-rating is lower than other perspectives, which is a prompt to discuss what the subject was considering.",
          "Do not conclude that the subject is underconfident from the gap alone. Check the examples, review period and differences in what each group observed. Keep “not observed” responses out of rating calculations."
        ]
      },
      {
        "title": "Turn the summary into an action",
        "paragraphs": [
          "Agreed action: for the next six weeks, Casey will include the reason for a priority change and the tasks affected in the weekly update. Manager support: review the first two updates together. Follow-up: ask the team whether priorities are clearer.",
          "Share only what your explained process allows. Small groups and distinctive incidents can reveal identities even in a summary without names."
        ]
      }
    ],
    "related": [
      "360-feedback-questions",
      "360-feedback-template",
      "360-degree-feedback"
    ],
    "sources": [
      {
        "label": "Center for Creative Leadership: understanding 360 results",
        "href": "https://www.ccl.org/articles/leading-effectively-articles/360-assessment-results-meaning/"
      }
    ]
  }
];

export function resourceBySlug(slug: string): ResourceContent {
  const resource = resources.find((entry) => entry.slug === slug);
  if (!resource) throw new Error(`Unknown resource: ${slug}`);
  return resource;
}