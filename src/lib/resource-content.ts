/** In-product graphics rendered from real Appraisal Software components. */
export type AppGraphic =
  | "self-appraisal-form"
  | "self-vs-manager"
  | "campaign-progress"
  | "probation-form"
  | "objectives-form"
  | "feedback-360-summary";
export type ResourceFigure =
  | { type: "app"; graphic: AppGraphic; caption: string }
  /** Shown as a briefed placeholder until public/resources/photos/{id}.jpg exists. */
  | { type: "photo"; id: string; brief: string; alt: string; caption?: string };
export type ResourceExample = { label: string; quote: string; note?: string };
export type ResourceSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
  /** Stable anchor, for sections other pages link to. */
  id?: string;
  examples?: ResourceExample[];
  table?: { caption: string; headers: string[]; rows: string[][] };
  callout?: { title: string; copy: string };
  figure?: ResourceFigure;
};
export type ResourceContent = {
  slug: string; title: string; description: string; audience: string; intent: string;
  kind: "guide" | "template"; sections: ResourceSection[]; related: string[];
  template?: { title: string; fields: string[] }[];
  bridge?: { title: string; copy: string };
  sources?: { label: string; href: string }[];
  /** Search-result title/description, when it should differ from the on-page heading. */
  seoTitle?: string;
  seoDescription?: string;
  /** Last substantive review, when later than RESOURCE_REVIEW_DATE. */
  reviewed?: string;
};

export const RESOURCE_REVIEW_DATE = "2026-09-20";
export const resources: ResourceContent[] = [
  {
    "slug": "annual-appraisal-template",
    "seoTitle": "Free Annual Appraisal Form Template (UK) – Print or Save as PDF",
    "seoDescription": "Free annual appraisal form for employees and managers: objectives, performance, development and next steps. Copy, print or save as PDF.",
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
          "Example: Alex, Customer Support Adviser. Review period: April 2025 to March 2026. Objective: resolve routine enquiries within two working days while maintaining accurate records.",
          "Employee reflection: “I met the response target in nine of twelve months. During the autumn launch I missed the target when complex tickets increased. I created a triage checklist with the team, which reduced repeated handovers.”",
          "Manager observation: “Alex’s records are clear and colleagues can pick up the next step. In October, three complex cases waited too long for escalation. We will agree an escalation trigger and review it after six weeks.”",
          "Agreed next step: Alex will pilot the checklist on complex enquiries by 30 April. The manager will provide one hour of coaching each fortnight. Progress will be checked on 15 June."
        ]
      },
      {
        "title": "Completed example: an operations coordinator in a growing firm",
        "paragraphs": [
          "Example: Jordan, Operations Coordinator in a 35-person professional services firm. Review period: January to December 2025. Objective: keep client onboarding packs complete within five working days of signed engagement.",
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
          "If you are running many reviews at once, a blank form alone will not show who has finished. Use the annual appraisal guide to plan the cycle, or run the same structure as an annual campaign in employee appraisal software so employee and manager answers stay on one record."
        ]
      }
    ],
    "related": [
      "annual-appraisal-guide",
      "self-appraisal-template",
      "employee-appraisal-software"
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
      "copy": "Use the same questions in employee appraisal software: create a campaign, collect employee and manager responses on one record, and see who is still outstanding without chasing by spreadsheet."
    }
  },
  {
    "slug": "self-appraisal-template",
    "reviewed": "2026-10-24",
    "seoTitle": "Free Self-Appraisal Template & Employee Self-Assessment Form (UK)",
    "seoDescription": "Free employee self-assessment form with prompts for achievements, challenges and development. Copy, print or save as PDF — no sign-up needed.",
    "title": "Self Appraisal Template",
    "description": "A free employee self-assessment form to prepare for your review. Copy the prompts, print the form or save it as a PDF.",
    "audience": "Employees preparing their own review",
    "intent": "Blank self-reflection prompts, distinct from completed answer examples",
    "kind": "template",
    "sections": [
      {
        "title": "What a self-appraisal is for",
        "paragraphs": [
          "A self-appraisal — sometimes called an employee self-assessment or self-review — is the employee’s own account of the review period, written before the appraisal meeting. It gives the employee a voice in the review and gives the manager context they may not have seen: obstacles, extra work, support that helped and support that was missing.",
          "It is not a test, and it should not decide the outcome on its own. Its job is to make the conversation better prepared. When both people arrive having thought about the same questions, the meeting can focus on what the evidence means and what should happen next."
        ],
        "figure": {
          "type": "photo",
          "id": "self-appraisal-template-reflection",
          "brief": "An employee quietly completing a printed self-appraisal form or on a laptop, pen in hand. Calm, focused mood; a real UK workplace such as an office, shop back room or care setting.",
          "alt": "An employee completing a self-appraisal form before their review"
        }
      },
      {
        "title": "Prepare your evidence",
        "paragraphs": [
          "Look back over the whole review period: objectives, project notes, customer feedback and work you delivered. Choose a few examples that show your contribution, rather than listing everything you did.",
          "Separate results from effort. “I attended weekly project meetings” describes an activity. “I resolved the handover issue so the project met its deadline” explains a contribution. Only use figures you can support."
        ]
      },
      {
        "title": "How to complete each section of the form",
        "paragraphs": [
          "Each section of the template asks for something different. Use this table as a guide when you fill it in, and keep each answer to a few sentences."
        ],
        "table": {
          "caption": "What to write in each section of the self-appraisal template",
          "headers": [
            "Section",
            "What to write",
            "Common mistake"
          ],
          "rows": [
            [
              "Review details",
              "Your role, manager, the period covered and the meeting date.",
              "Leaving the period blank, so examples drift outside it."
            ],
            [
              "Achievements",
              "Two or three agreed objectives or pieces of work, your part in them and the evidence.",
              "Listing every task you did instead of the results that mattered."
            ],
            [
              "Strengths and learning",
              "A strength shown in a real situation, and something you found hard.",
              "Claiming no difficulties — it reads as unreflective."
            ],
            [
              "Support and development",
              "The support you need and one practical development action.",
              "Writing “more training” without saying what or why."
            ],
            [
              "Next period",
              "A proposed objective, how success would be seen and questions for your manager.",
              "Leaving it for the manager to decide alone."
            ]
          ]
        },
        "figure": {
          "type": "app",
          "graphic": "self-appraisal-form",
          "caption": "The same prompts in Appraisal Software: one question at a time, with progress shown and answers saved as you go. Try it — nothing here is saved."
        }
      },
      {
        "title": "Worked example: improving a team handover",
        "paragraphs": [
          "Example: “My objective was to make the weekly stock handover more reliable. I introduced a checklist and tested it with both shifts. Missed entries fell from six in the first month to two in the last month. The improvement was shared work: the evening team helped simplify the checklist.”",
          "“I still need to flag unusual stock movements sooner. Next period I would like to agree an exception threshold with my manager and review the log every Friday for six weeks.”",
          "This answer names the objective, the employee’s action, a result and an improvement. It acknowledges the team’s contribution without hiding the employee’s part."
        ]
      },
      {
        "title": "Self-assessment questions you can add",
        "paragraphs": [
          "The template keeps to the essentials. If your organisation wants more depth, choose two or three of these questions rather than adding them all — long forms produce repetitive answers."
        ],
        "items": [
          "What are you most proud of from this review period, and why?",
          "Which objective was hardest to achieve, and what got in the way?",
          "Describe a time you helped a colleague or another team.",
          "What feedback have you received this year, and what did you do with it?",
          "Which part of your role would you like to spend more time on?",
          "Which part of your role would you like to spend less time on?",
          "What is one process or tool that would make your work easier?",
          "What new skill have you used at work this year?",
          "How well do you understand what is expected of you in your role?",
          "What would you like to achieve in the next twelve months?",
          "What support would help you most from your manager?",
          "Is there anything else you would like to discuss in the meeting?"
        ],
        "callout": {
          "title": "Need example answers?",
          "copy": "This page gives you blank prompts. For worked first-person answers to these questions — by question and by role — see our self appraisal answers and examples guide."
        }
      },
      {
        "title": "Rating yourself fairly",
        "paragraphs": [
          "Some forms ask employees to rate themselves, often on a five-point scale. If yours does, read the definition of each point before you choose. A 3 on many scales means “fully meets expectations”, not “average” or “mediocre”.",
          "Base the rating on the whole period and on the agreed expectations, not on how you feel about your last week. Then add a sentence of evidence: a rating without a reason gives your manager nothing to discuss.",
          "People tend to rate themselves differently. Some are modest; others are generous. A gap between your rating and your manager’s is normal and worth exploring — it often reveals work one of you did not see, or an expectation that was never made clear."
        ]
      },
      {
        "title": "When you are unsure what to write",
        "paragraphs": [
          "If an objective changed, explain when it changed and what was agreed instead. If a result was missed, describe the gap, the factors involved and your next action. Avoid blaming another person or claiming success without evidence.",
          "Write down questions for your manager. Self-assessment should help the conversation: it is not a test of who can sound most confident."
        ]
      },
      {
        "title": "For managers: sharing the form with your team",
        "paragraphs": [
          "Send the self-appraisal at least a week before the meeting, together with the review period and any objectives agreed last time. Explain who will read the answers and how they will be used. Employees write more honestly when they know the purpose.",
          "Read the self-appraisal before you finalise your own view, and use it to plan the meeting. Start the conversation with the employee’s reflection, then add your observations. If you are running reviews for several people, keep track of who has completed their form so nobody arrives unprepared."
        ],
        "figure": {
          "type": "app",
          "graphic": "campaign-progress",
          "caption": "Appraisal Software tracks which self-assessments and manager responses are complete, and reminds anyone with an outstanding form."
        }
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
    "reviewed": "2026-10-24",
    "seoTitle": "Probation Review Template & Meeting Form – Free (UK)",
    "seoDescription": "Free probation review form for the end-of-probation meeting: performance, conduct, support and a clear pass, extend or end outcome. Copy or print.",
    "title": "Probation Review Template",
    "description": "A free probation review form for UK managers and employees, with evidence prompts, support actions and a follow-up checklist.",
    "audience": "Managers reviewing a new starter",
    "intent": "A probation-specific form focused on expectations, support and evidence",
    "kind": "template",
    "sections": [
      {
        "title": "What a probation review is for",
        "paragraphs": [
          "A probation period gives a new employee and their employer time to check that the role is working. The probation review is the structured conversation at the end of that period — and ideally at points along the way — where the manager and employee look at progress against the role’s expectations and agree what happens next.",
          "A good review is a two-way conversation. The manager shares evidence about the employee’s work; the employee shares how their induction, training and support have gone. Both perspectives matter: a new starter who is struggling has often not had the support or clarity they needed."
        ],
        "figure": {
          "type": "photo",
          "id": "probation-review-template-new-starter",
          "brief": "A manager and a recently hired employee in a friendly check-in meeting — perhaps in a shop, warehouse, care home or office. The new starter looks engaged; the mood is supportive rather than formal.",
          "alt": "A manager and new employee in a probation review meeting"
        }
      },
      {
        "title": "When to hold probation reviews",
        "paragraphs": [
          "Probation length is set by the employment contract or your policy. Three or six months is common in the UK, with longer periods for some senior roles. Whatever the length, do not wait until the final week to talk about progress — regular reviews make the final meeting a confirmation rather than a surprise."
        ],
        "table": {
          "caption": "Suggested probation review points for a six-month probation period",
          "headers": [
            "Review point",
            "Focus"
          ],
          "rows": [
            [
              "End of week one",
              "Induction, equipment, introductions and early questions."
            ],
            [
              "End of month one",
              "Understanding of the role, first tasks and any training gaps."
            ],
            [
              "Midpoint (month three)",
              "Progress against expectations; raise any concerns clearly, with support."
            ],
            [
              "Final review (month six)",
              "Overall evidence and the outcome: confirm, extend or, in some cases, end employment."
            ]
          ]
        }
      },
      {
        "title": "Prepare for the probation meeting",
        "paragraphs": [
          "Check the expectations agreed when the person joined and collect examples from the role. Ask the employee how induction, training and manager support have worked. Do not introduce a concern for the first time in the final meeting if it could have been discussed earlier.",
          "This form helps structure a conversation. It does not decide employment outcomes or replace your organisation’s policy, contract or appropriate advice. Follow your established process for any formal decision."
        ]
      },
      {
        "title": "Probation review questions to ask",
        "paragraphs": [
          "Choose questions that cover both the work and the experience of joining. The template includes the essentials; these are useful additions for the conversation."
        ],
        "items": [
          "Which parts of the role are you now confident doing on your own?",
          "Which tasks still feel unclear, and what would help?",
          "How well did your induction prepare you for the role?",
          "Is there any training you expected but have not received?",
          "How are you finding working with the team?",
          "Are the standards and expectations of the role clear to you?",
          "What has surprised you about the job, compared with what you expected?",
          "What support do you need from me over the next few months?",
          "Is there anything about the role or the organisation you would change?"
        ],
        "figure": {
          "type": "app",
          "graphic": "probation-form",
          "caption": "A probation review form in Appraisal Software, completed by the manager with a rating and an example for each expectation. Try it — nothing here is saved."
        }
      },
      {
        "title": "Completed example: an operations assistant",
        "paragraphs": [
          "Example: “Jordan completes the daily reconciliation accurately and has handled the standard supplier queries independently for three weeks. The remaining development need is escalating discrepancies on the day they are found.”",
          "Support action: the manager will demonstrate two exception cases on Tuesday. Jordan will use the escalation checklist for the next four weeks. They will review examples together each Friday.",
          "Record the evidence and the action separately from the organisation’s formal outcome. A general label such as “needs confidence” is less useful than the behaviour that needs support."
        ]
      },
      {
        "title": "Probation review outcomes",
        "paragraphs": [
          "Most probation reviews end with one of three outcomes. Whichever applies, explain it clearly, confirm it in writing and follow your organisation’s policy and the employee’s contract."
        ],
        "table": {
          "caption": "Common probation review outcomes",
          "headers": [
            "Outcome",
            "When it applies",
            "What to record"
          ],
          "rows": [
            [
              "Confirm (pass)",
              "The employee is meeting the role’s expectations.",
              "The evidence, any remaining development actions and the confirmation date."
            ],
            [
              "Extend",
              "Progress is being made but some standards are not yet met, and your contract or policy allows an extension.",
              "The specific gaps, the support offered, the new end date and the next review."
            ],
            [
              "End employment",
              "Expectations are not being met despite clear feedback and reasonable support.",
              "The concerns, how they were raised earlier, the support given and the process followed."
            ]
          ]
        },
        "callout": {
          "title": "Take advice before ending employment",
          "copy": "Employment law protections, including for new starters, are changing in the UK. Before deciding not to confirm someone’s employment, check your contract and policy, review current Acas guidance and take appropriate advice. This template supports the conversation; it does not make or justify the decision."
        }
      },
      {
        "title": "Extending a probation period",
        "paragraphs": [
          "An extension is useful when a new starter is close to the standard but needs more time — for example because training was delayed or the role changed. It should only be used if the contract or policy allows it, and it is not a way to postpone a difficult conversation.",
          "When you extend, be specific: which expectations are not yet met, what evidence you will look for, what support will be provided and the new review date. Agree weekly or fortnightly check-ins so the employee knows how they are doing before the end of the extension."
        ]
      },
      {
        "title": "Raising concerns during probation",
        "paragraphs": [
          "If a concern appears early, raise it early. Describe the specific task or behaviour, the standard you expected and the effect, and ask the employee for their view. They may not have known the expectation, or may have been missing information or training.",
          "Agree a practical action and a date to review it, and write a short note of what was discussed. A concern raised at month two, with support and a clear plan, is fairer to the employee and easier to resolve than one raised for the first time in the final meeting."
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
          "Example goal: “By July, I will lead the fortnightly project update so that attendees understand risks, decisions and next steps.”",
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
    "reviewed": "2026-10-24",
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
      },
      {
        "id": "examples",
        "title": "360 feedback examples by relationship",
        "paragraphs": [
          "Each reviewer sees a different part of someone’s work, so a useful comment comes from what that relationship can actually observe. The structure is the same each time: the situation, the behaviour, its effect on the work and what should continue or change. Do not diagnose personality or assume a motive.",
          "Names, comments and scores in these examples are fictional — they are not an assessment result or a product report."
        ],
        "examples": [
          {
            "label": "Peer · a strength",
            "quote": "During the last two launch handovers, Casey listed dependencies and confirmed who owned each action. That helped our team plan without repeated clarification. Please keep using that structure.",
            "note": "The reviewer describes a recent situation and a practice that can be repeated. It is more actionable than “Casey is a great team player”."
          },
          {
            "label": "Direct report · a development area",
            "quote": "When priorities changed in April, I understood the new deadline but not which existing tasks could wait. A short explanation of the trade-off would help me plan. The weekly check-in would be a useful place to confirm it.",
            "note": "This raises a gap without guessing why the manager acted that way. It includes a practical request rather than just expressing frustration."
          },
          {
            "label": "Manager · recognising progress",
            "quote": "Taylor now raises project risks before they affect the delivery date. In the last project, that gave us time to move the testing slot. The next step is to explain the proposed options alongside the risk.",
            "note": "Recognition and development can sit together. Keep the next step specific so it does not cancel out the positive observation."
          },
          {
            "label": "Self · comparing views",
            "quote": "I rated my communication as a 3 because I know some updates went out late during the spring launch. I would like to understand which updates people found most useful, so I can keep doing those and fix the gaps.",
            "note": "A self-review is not a confession or a sales pitch. It gives the conversation a starting point and shows where the person’s view may differ from others’."
          }
        ]
      },
      {
        "title": "Giving feedback to your manager",
        "paragraphs": [
          "Upward feedback is often the hardest to write, because the reviewer worries about how it will land. Keep it specific, practical and about the work. Include a strength where it is genuine; it makes the development point easier to act on.",
          "The example describes a situation and a practical request. It does not label the manager’s character or claim to know their motives. Use your own evidence, include a strength where relevant, and avoid private details that unnecessarily identify another person. Written comments may still reveal their author even when the report omits names."
        ],
        "examples": [
          {
            "label": "Direct report · upward feedback",
            "quote": "When project priorities changed in May, the update named the new deadline but not which tasks could wait. I spent time on the original task before learning it was no longer urgent. It would help if future updates listed the immediate priority and what to pause."
          }
        ]
      },
      {
        "title": "Weak comments and how to strengthen them",
        "paragraphs": [
          "Most unhelpful 360 comments fail in one of three ways: they are too general to act on, they judge character rather than behaviour, or they describe a single incident as a permanent trait. A small rewrite usually fixes them."
        ],
        "table": {
          "caption": "Weak 360 feedback comments compared with stronger versions",
          "headers": [
            "Weak comment",
            "Stronger version",
            "Why it is better"
          ],
          "rows": [
            [
              "“Great team player.”",
              "“Shares the handover checklist before each shift change, so the evening team starts with the open issues.”",
              "Names a repeatable behaviour and its effect."
            ],
            [
              "“Needs to communicate more.”",
              "“When the deadline moved in April, I found out at the stand-up. A message on the day it changed would have given me time to re-plan.”",
              "Describes a situation and a practical request."
            ],
            [
              "“Can be negative in meetings.”",
              "“In the last two planning meetings, risks were raised without a suggested option. Bringing one proposal alongside the risk would help us decide faster.”",
              "Avoids a character label and suggests what to do instead."
            ],
            [
              "“Always late with reports.”",
              "“Three of the last five monthly reports arrived after the Friday deadline, which delayed the board pack.”",
              "Replaces “always” with evidence that can be discussed."
            ]
          ]
        }
      },
      {
        "title": "Example summary report",
        "paragraphs": [
          "Example communication ratings on a five-point scale: self 3.0; manager 4.0; peers 3.5. Use them to practise interpretation, not as a benchmark.",
          "Theme: reviewers value clear handovers, while some want earlier explanation when priorities change. The self-rating is lower than other perspectives, which is a prompt to discuss what the subject was considering.",
          "Do not conclude that the subject is underconfident from the gap alone. Check the examples, review period and differences in what each group observed. Keep “not observed” responses out of rating calculations."
        ],
        "figure": {
          "type": "app",
          "graphic": "feedback-360-summary",
          "caption": "In Appraisal Software, 360 results unlock after the campaign closes and at least five reviewers have responded. Ratings are combined and names are not shown."
        }
      },
      {
        "title": "Turn the summary into an action",
        "paragraphs": [
          "Agreed action: for the next six weeks, Casey will include the reason for a priority change and the tasks affected in the weekly update. Manager support: review the first two updates together. Follow-up: ask the team whether priorities are clearer.",
          "Share only what your explained process allows. Small groups and distinctive incidents can reveal identities even in a summary without names.",
          "Keep the development conversation separate from any pay or formal performance decision. People give more candid feedback when they trust that it will be used to help, not to rank."
        ],
        "figure": {
          "type": "photo",
          "id": "360-feedback-conversation",
          "brief": "A manager and employee in a relaxed one-to-one, reviewing printed or on-screen feedback together. Warm, natural light; a UK office or meeting room; faces not the focus.",
          "alt": "A manager and employee discussing 360 feedback results together"
        }
      }
    ],
    "related": [
      "360-appraisals",
      "personal-development-plan-template"
    ],
    "bridge": {
      "title": "Run this as an anonymous 360 campaign",
      "copy": "Use Appraisal Software to invite reviewers, collect responses through personal links, and unlock combined anonymous feedback after closure."
    },
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
    ],
    "seoTitle": "360 Feedback Template & Examples – Free Form (UK)",
    "seoDescription": "Free 360 feedback form with a rating scale, questions for managers, peers and direct reports, and worked feedback examples. Copy, print or save as PDF.",
    "sources": [
      {
        "label": "Center for Creative Leadership: understanding 360 results",
        "href": "https://www.ccl.org/articles/leading-effectively-articles/360-assessment-results-meaning/"
      }
    ]
  },
  {
    "slug": "annual-appraisal-guide",
    "reviewed": "2026-10-24",
    "seoTitle": "Annual Appraisal Guide: What It Is & How to Run One (UK)",
    "seoDescription": "What an annual appraisal is, how to prepare, what to ask and how to follow up — a practical UK guide for managers and employees.",
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
        "title": "Annual appraisal, performance review or check-in?",
        "paragraphs": [
          "UK organisations use these terms loosely, and many use them interchangeably. The differences that matter are how often the conversation happens and what it is for."
        ],
        "table": {
          "caption": "How an annual appraisal compares with other review conversations",
          "headers": [
            "Conversation",
            "How often",
            "Main purpose"
          ],
          "rows": [
            [
              "Annual appraisal",
              "Once a year",
              "Look back over the year, agree objectives and development for the next one."
            ],
            [
              "Mid-year review",
              "Halfway through the year",
              "Check progress on objectives and adjust them if circumstances changed."
            ],
            [
              "One-to-one or check-in",
              "Weekly to monthly",
              "Day-to-day priorities, problems and support."
            ],
            [
              "Probation review",
              "During and at the end of probation",
              "Confirm a new starter is settling in and meeting the role’s standards."
            ],
            [
              "360 feedback",
              "Occasionally, for development",
              "Gather views from peers, direct reports and others who see the person’s work."
            ]
          ]
        },
        "callout": {
          "title": "Is an annual appraisal a legal requirement?",
          "copy": "For most UK employers there is no general legal requirement to hold annual appraisals, though some regulated sectors and contracts set their own expectations. Whatever you do, apply your process consistently and fairly. Acas publishes practical guidance on appraisals and performance management."
        }
      },
      {
        "title": "Who should be involved",
        "paragraphs": [
          "The employee and their line manager are the core of the appraisal. The manager should be someone who has seen the employee’s work over the period; if the line manager changed during the year, ask the previous manager for input before the meeting.",
          "In a small business, the owner or a director often runs appraisals. That works well when they see people’s work day to day. If they do not, ask a supervisor or team lead to contribute observations. HR, where you have it, is there to support a fair and consistent process — not to run the conversation."
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
        "title": "Keeping preparation on track",
        "paragraphs": [
          "Preparation is where most annual appraisal cycles slip. Forms go out late, a few people do not complete them, and meetings happen with one side unprepared. Set a clear deadline for self-assessments — a few days before the meeting — and check who is still outstanding.",
          "If you are reviewing several people, stagger the meetings so you have time to read each self-assessment properly and prepare your own view."
        ],
        "figure": {
          "type": "app",
          "graphic": "campaign-progress",
          "caption": "An annual appraisal campaign in Appraisal Software: employee and manager responses tracked in one place, with reminders for anyone outstanding."
        }
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
        "title": "A simple meeting agenda",
        "paragraphs": [
          "Allow around an hour. A predictable structure helps the employee relax and makes sure the future gets as much time as the past."
        ],
        "table": {
          "caption": "Suggested agenda for a one-hour annual appraisal meeting",
          "headers": [
            "Time",
            "Focus",
            "Questions to ask"
          ],
          "rows": [
            [
              "5 min",
              "Purpose and tone",
              "“How are you feeling about the year overall?”"
            ],
            [
              "15 min",
              "The employee’s reflection",
              "“What are you most proud of? What was hardest?”"
            ],
            [
              "15 min",
              "Manager’s observations",
              "“Here is what I saw — how does that match your view?”"
            ],
            [
              "15 min",
              "Objectives and development for next year",
              "“What should we focus on? What support do you need?”"
            ],
            [
              "10 min",
              "Summary and next steps",
              "“Let me summarise what we agreed — have I missed anything?”"
            ]
          ]
        },
        "figure": {
          "type": "app",
          "graphic": "self-vs-manager",
          "caption": "When self and manager answers sit side by side, the largest differences show where to focus the conversation."
        }
      },
      {
        "title": "Questions to ask in the appraisal meeting",
        "paragraphs": [
          "Open questions get better answers than yes-or-no ones. Choose a handful that fit the person and the year; you do not need to ask them all."
        ],
        "items": [
          "What are you most proud of from this year?",
          "Which objectives went well, and which were harder than expected?",
          "What got in the way of your work, and what helped?",
          "What feedback have you had from colleagues or customers?",
          "Which parts of the role do you enjoy most, and least?",
          "Is there anything I could do differently to support you?",
          "What would you like to learn or develop next year?",
          "Where do you see your role developing over the next year or two?",
          "Is there anything we have not discussed that you want to raise?"
        ]
      },
      {
        "title": "Handling disagreement",
        "paragraphs": [
          "Disagreement in an appraisal is normal and often useful. When your view differs from the employee’s, ask for their examples first, then share yours. Look for the reason behind the gap: unclear expectations, work you did not see, or a change in priorities during the year.",
          "If you still disagree, say so plainly and record both views. Forcing agreement produces a document neither person believes. If a performance concern is serious enough to need a formal process, keep that separate from the appraisal and follow your organisation’s procedure."
        ],
        "figure": {
          "type": "photo",
          "id": "annual-appraisal-guide-meeting",
          "brief": "A manager and employee in an annual appraisal meeting, sitting at a corner of a table rather than across a desk. Relaxed, open body language; papers or a laptop between them. UK small-business setting.",
          "alt": "A manager and employee talking through an annual appraisal together"
        }
      },
      {
        "title": "After the meeting: turn discussion into actions",
        "paragraphs": [
          "Write a short summary while the conversation is fresh. Share it with the employee and confirm any amendments. Store it according to your organisation’s agreed approach.",
          "Book an earlier check-in to review actions. At that meeting, ask what progress has been made and what needs to change; do not simply check whether the form was completed."
        ]
      },
      {
        "title": "Using ratings carefully",
        "paragraphs": [
          "Ratings can make results easier to compare across a team, but they also pull attention away from the conversation. If you use them, define each point on the scale in plain language and share the definitions before anyone completes a form.",
          "Avoid forced distributions in small teams, where a fixed share of people must receive each rating. With a handful of employees they rarely reflect reality. If pay decisions are linked to appraisal ratings, explain how — and consider holding the development conversation separately so it is not overshadowed."
        ]
      },
      {
        "title": "Common mistakes to avoid",
        "paragraphs": [
          "Long question lists produce repetitive answers. Choose prompts that inform a decision or useful discussion. Vague labels such as “more proactive” need a concrete example of what someone should do.",
          "Keep developmental conversation distinct from any formal capability or disciplinary process. This guide is a practical meeting structure, not employment-law advice. Acas provides additional guidance and appraisal form templates."
        ]
      },
      {
        "title": "Annual appraisal checklist",
        "paragraphs": [
          "Use this checklist to run an annual appraisal cycle from start to finish."
        ],
        "items": [
          "Confirm the review period and meeting dates.",
          "Share the form, any rating definitions and last year’s objectives.",
          "Ask the employee to complete a self-assessment by an agreed date.",
          "Gather your own evidence from across the whole year.",
          "Read the self-assessment before the meeting.",
          "Hold the meeting in private, with enough time.",
          "Agree three to five objectives and one or two development actions.",
          "Write and share a summary within a few days.",
          "Book a check-in for three to six months’ time.",
          "Store the record securely according to your organisation’s approach."
        ]
      }
    ],
    "related": [
      "annual-appraisal-template",
      "appraisal-objectives",
      "employee-appraisal-software"
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
    "reviewed": "2026-10-24",
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
        "title": "A simple structure for every answer",
        "paragraphs": [
          "Most self-appraisal questions can be answered with the same four parts. You do not need to label them, and a short answer can cover all four in three or four sentences."
        ],
        "table": {
          "caption": "Four parts of a self-appraisal answer",
          "headers": [
            "Part",
            "What to include",
            "Example phrase"
          ],
          "rows": [
            [
              "Situation or objective",
              "The goal, task or problem, and when it happened",
              "“In the spring rota change…”"
            ],
            [
              "Your contribution",
              "What you did — not what the team did in general",
              "“I drafted the new handover checklist and tested it with both shifts.”"
            ],
            [
              "Result or evidence",
              "What changed, with a figure or example you can support",
              "“Missed entries fell from six to two over the quarter.”"
            ],
            [
              "Learning or next step",
              "What you would repeat, change or need help with",
              "“Next I want to agree an escalation threshold with my manager.”"
            ]
          ]
        },
        "figure": {
          "type": "app",
          "graphic": "self-appraisal-form",
          "caption": "In Appraisal Software, employees answer one focused question at a time, with guidance under each prompt. Try it — nothing you type here is saved."
        }
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
      },
      {
        "title": "Example answers to common self-appraisal questions",
        "paragraphs": [
          "Forms word their questions differently, but most ask about the same few things. These fictional answers show the structure in action. Replace the details with your own work, and keep only the claims you can back up."
        ],
        "examples": [
          {
            "label": "What are your key strengths?",
            "quote": "I am reliable under deadline pressure. During the year-end close I kept the reconciliation tracker up to date every day, which meant the finance lead could see blockers early. I would like to use that strength in a wider role by coordinating the next close.",
            "note": "Name one or two strengths and prove each with a situation. A list of adjectives is easy to write and hard to discuss."
          },
          {
            "label": "How have you contributed to the team?",
            "quote": "I took over onboarding for the two new starters in March. I rewrote the first-week checklist and sat with each of them for their first three shifts. Both were working independently on the till by week three, a week earlier than the previous starters.",
            "note": "Contribution answers are stronger when they describe what changed for other people, not just the tasks you completed."
          },
          {
            "label": "Describe a challenge and how you handled it",
            "quote": "Our main supplier changed its ordering system in July and orders started arriving incomplete. I logged every discrepancy for three weeks, shared the pattern with the supplier’s account manager and agreed a daily check. Incomplete orders stopped by late August, but I should have escalated to my manager in the first week rather than the third.",
            "note": "A good challenge answer includes what you would do differently. It shows judgement, not weakness."
          },
          {
            "label": "How have you developed this year?",
            "quote": "I completed the internal data protection training and applied it when we updated the customer sign-up form. I also asked to shadow the team lead in two difficult customer calls, which helped me handle a complaint on my own in September.",
            "note": "Link learning to a moment where you used it. Courses alone do not show development."
          },
          {
            "label": "What are your goals for next year?",
            "quote": "I want to take ownership of the weekly stock report by the end of the first quarter, including the supplier follow-ups. To get there I need access to the purchasing system and two review sessions with the operations manager.",
            "note": "Goals are easier to agree when they include a date and the support you need. Your manager will turn the final version into objectives."
          },
          {
            "label": "How could your manager support you better?",
            "quote": "Our weekly one-to-ones help most when we look at specific cases. Moving them to Monday, before the week’s deadlines, would let me raise risks while there is still time to act.",
            "note": "Make support requests concrete and practical. This question is an invitation, not a trap."
          }
        ]
      },
      {
        "title": "Self-appraisal examples by role",
        "paragraphs": [
          "The same structure works in any job. What changes is the evidence: a care worker might point to a family’s feedback, a developer to a fix that reduced support tickets. These short examples show the kind of detail that makes an answer credible."
        ],
        "examples": [
          {
            "label": "Customer service",
            "quote": "I handled most of the team’s escalated billing queries from April. I wrote a short guide to the three most common causes, and the team now resolves about half of them without escalating."
          },
          {
            "label": "Sales",
            "quote": "I reached 92% of my annual target. I missed the second quarter after two large renewals were delayed, but I rebuilt the pipeline from referrals and finished the year with four new accounts."
          },
          {
            "label": "Office and administration",
            "quote": "I moved the meeting-room booking system online and trained the reception team. Double bookings, which happened most weeks, have not occurred since June."
          },
          {
            "label": "Team leader",
            "quote": "I introduced monthly development check-ins with my four direct reports. Two have since taken on new responsibilities, and I want to do better at following up actions between check-ins."
          },
          {
            "label": "Software developer",
            "quote": "I led the fix for the export timeouts that generated the most support tickets in spring. After the change, related tickets dropped from around ten a week to one or two."
          },
          {
            "label": "Care and support work",
            "quote": "I updated the care plans for my three key residents after each review and shared changes at handover. One family said they felt better informed about their mother’s routine since the summer."
          }
        ],
        "figure": {
          "type": "photo",
          "id": "appraisal-answers-preparing",
          "brief": "An employee preparing their self-appraisal at a desk or kitchen table — laptop open, notes beside them, thoughtful rather than stressed. Natural light, everyday UK workplace or home setting.",
          "alt": "An employee preparing their self-appraisal answers with notes and a laptop"
        }
      },
      {
        "title": "Phrases that weaken an answer",
        "paragraphs": [
          "Some phrases appear in almost every self-appraisal and tell the reader very little. Swap them for something specific."
        ],
        "table": {
          "caption": "Weak self-appraisal phrases and stronger alternatives",
          "headers": [
            "Instead of",
            "Try"
          ],
          "rows": [
            [
              "“I always go above and beyond.”",
              "One example of extra work, and what it achieved."
            ],
            [
              "“I am a team player.”",
              "A time you helped a colleague or another team, and the result."
            ],
            [
              "“I worked really hard this year.”",
              "The objective you met, missed or exceeded, with evidence."
            ],
            [
              "“I need more training.”",
              "The skill, the situation where you need it, and a suggested course or activity."
            ],
            [
              "“Communication could be better.”",
              "A specific situation, its effect on your work and what would help."
            ],
            [
              "“No areas for improvement.”",
              "One honest development area, framed as a next step."
            ]
          ]
        }
      },
      {
        "title": "If you have had a difficult year",
        "paragraphs": [
          "Not every review period goes well. Illness, caring responsibilities, a restructure or an unclear role can all affect results. Your self-appraisal can say so without becoming a list of excuses: describe what happened, what you still delivered and what would help now.",
          "Example: “The second half of the year was disrupted by the team restructure and my change of manager. I kept the monthly reporting on time, but I did not finish the process documentation. I would like to agree a revised date and a clearer scope for it.”",
          "You do not have to share private health or personal details in a written form. If something significant affected your work, it is reasonable to mention that there were personal circumstances and ask to discuss them in the meeting."
        ]
      },
      {
        "title": "How long should your answers be?",
        "paragraphs": [
          "Aim for three to six sentences per question — long enough to include evidence, short enough for your manager to discuss in the meeting. Two well-supported examples are better than a page covering everything you did.",
          "Before you submit, read your answers as your manager will:"
        ],
        "items": [
          "Does each answer relate to this review period?",
          "Have you named your own contribution, not just the team’s?",
          "Can you support every number or result you mention?",
          "Is there at least one honest development area?",
          "Have you removed comments about colleagues’ motives or character?",
          "Would you be comfortable discussing every sentence face to face?"
        ],
        "callout": {
          "title": "Your manager answers too",
          "copy": "Many appraisals collect a manager response alongside your self-assessment. Differences between the two are normal and are a good starting point for the conversation — they are not a verdict on who is right."
        }
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
    "slug": "appraisal-objectives",
    "reviewed": "2026-10-24",
    "seoTitle": "Appraisal Objectives: SMART Examples for Employees (UK)",
    "seoDescription": "Practical, SMART appraisal objective examples for employees and managers, with how to measure progress and agree support.",
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
        "title": "SMART objectives, explained",
        "paragraphs": [
          "SMART is the most common way to check an objective is clear enough to review. Use it as a checklist rather than a formula — an objective does not have to sound mechanical to be SMART."
        ],
        "table": {
          "caption": "What each part of a SMART objective means",
          "headers": [
            "Letter",
            "Meaning",
            "Question to ask"
          ],
          "rows": [
            [
              "S",
              "Specific",
              "What exactly should be different, and in which part of the role?"
            ],
            [
              "M",
              "Measurable",
              "What evidence will show progress — a number, a record, feedback?"
            ],
            [
              "A",
              "Achievable",
              "Does the person have the skills, time and authority to do it?"
            ],
            [
              "R",
              "Relevant",
              "Does it matter to the team’s or organisation’s priorities?"
            ],
            [
              "T",
              "Time-bound",
              "When is it due, and when will you check progress?"
            ]
          ]
        }
      },
      {
        "title": "Objectives and development goals are different",
        "paragraphs": [
          "An objective describes a result the role needs to deliver: a report, a target, a standard of service. A development goal describes what the person wants to learn or become able to do. Both belong in an appraisal, but mixing them makes both harder to review.",
          "For example, “Deliver the new onboarding guide by 30 June” is an objective. “Become confident presenting to senior stakeholders” is a development goal, supported by actions such as leading two project updates. Record development goals in a personal development plan, and keep objectives focused on outcomes."
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
        "title": "More appraisal objective examples by role",
        "paragraphs": [
          "These examples show the level of detail that makes an objective reviewable. Adjust the numbers, dates and measures to your own role and organisation — the figures here are illustrative."
        ],
        "examples": [
          {
            "label": "Sales",
            "quote": "Generate twelve qualified opportunities from existing accounts by the end of Q2, logged in the CRM with the next step and date for each.",
            "note": "Measures activity the salesperson controls, as well as the result the business needs."
          },
          {
            "label": "Office and administration",
            "quote": "Move supplier invoices to the shared digital approval process by 31 March, so every invoice has an approver and date recorded.",
            "note": "Clear finish line and an observable standard."
          },
          {
            "label": "Hospitality",
            "quote": "Train the three new weekend staff on the closing checklist by the end of May, and check their first two closes each."
          },
          {
            "label": "Finance",
            "quote": "Complete the month-end reconciliation by the fifth working day for the next six months, with variances over the agreed threshold explained in the pack."
          },
          {
            "label": "Software development",
            "quote": "Reduce the average response time of the reporting page to under two seconds by the end of the quarter, measured in production monitoring."
          },
          {
            "label": "Care and support work",
            "quote": "Review and update the care plans for your key residents within one week of each formal review, and share the changes at the next handover."
          },
          {
            "label": "HR and people",
            "quote": "Introduce a consistent onboarding checklist for all new starters by September, and ask each starter for feedback at the end of their first month."
          }
        ]
      },
      {
        "title": "Weak objectives and stronger versions",
        "paragraphs": [
          "Most weak objectives are activities or wishes. Rewrite them around a result, a measure and a date."
        ],
        "table": {
          "caption": "Weak appraisal objectives compared with stronger versions",
          "headers": [
            "Weak",
            "Stronger"
          ],
          "rows": [
            [
              "“Improve customer service.”",
              "“Respond to all routine enquiries within one working day for the next quarter, with complete case notes.”"
            ],
            [
              "“Be more organised.”",
              "“Keep the project tracker updated every Friday, with owners and dates for each open action.”"
            ],
            [
              "“Learn Excel.”",
              "“Build the monthly sales report in Excel without help by the end of April.” (Record the learning itself as a development goal.)"
            ],
            [
              "“Support the team more.”",
              "“Hold a monthly check-in with each direct report and agree one development action at each.”"
            ],
            [
              "“Increase sales.”",
              "“Grow repeat orders from existing accounts by 10% compared with last year, by year end.”"
            ]
          ]
        }
      },
      {
        "title": "How many objectives should you set?",
        "paragraphs": [
          "Three to five objectives is enough for most roles over a year. More than that, and the most important work gets lost among the routine. If a task is simply part of the job, it does not need to be an objective — it belongs in the role description.",
          "Agree the objectives together. Employees are more committed to objectives they helped shape, and they often know better than their manager what is realistic. Ask the employee to propose their own objectives before the meeting, then refine them together."
        ],
        "figure": {
          "type": "app",
          "graphic": "objectives-form",
          "caption": "In Appraisal Software, employees can propose next-period objectives in their self-assessment, so the meeting starts from a draft. Try it — nothing here is saved."
        }
      },
      {
        "title": "Review objectives fairly",
        "paragraphs": [
          "Use a small number of priorities that reflect the role. Too many objectives obscure the most important work. Explain the measure before the review period starts.",
          "At the check-in, compare the result with the agreed expectation and discuss changed circumstances. If a target became unrealistic, record the change and the revised agreement rather than quietly rewriting history."
        ]
      },
      {
        "title": "When circumstances change",
        "paragraphs": [
          "Objectives agreed in January can be overtaken by events — a lost client, a restructure, a long absence. Review them at a mid-year check-in and change them openly when they no longer fit. Note the date and reason, so the end-of-year review assesses the person against what was actually expected.",
          "Do not penalise someone for missing an objective that became impossible for reasons outside their control. Instead, look at how they responded: what they prioritised, what they communicated and what they delivered instead."
        ],
        "figure": {
          "type": "photo",
          "id": "appraisal-objectives-planning",
          "brief": "A manager and employee planning together at a whiteboard or over a printed plan — writing down goals or dates. Collaborative, energetic mood; UK office or workshop setting.",
          "alt": "A manager and employee agreeing appraisal objectives together"
        }
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
  }
];

export function resourceBySlug(slug: string): ResourceContent {
  const resource = resources.find((entry) => entry.slug === slug);
  if (!resource) throw new Error(`Unknown resource: ${slug}`);
  return resource;
}
/** The question guide has a dedicated page; include its metadata in library discovery. */
export const resourceListings: Pick<ResourceContent, "slug" | "title" | "description" | "audience" | "kind">[] = [
  ...resources
];
