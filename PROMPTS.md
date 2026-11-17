# How I used AI on this project

The brief says to use any AI tooling and to share the prompts. This file covers three things: the tools and what each was for, the workflow, and the prompts that shaped the project. The conversation with Claude was in Spanish; prompts are translated and condensed.

## Tools

| Tool | Used for |
|---|---|
| **Stitch** (Google) | I generated the UI mockups myself before writing any code: web and mobile, dark and light. It produced the palette, typography and layout reference, and a design-system description for each theme. |
| **Claude Code** (Claude Sonnet 5.5) | Planning, architecture, implementation, tests, Docker, documentation. |
| Claude Code's built-in browser | Driving the running app to check the UI, the theme switch and the mobile viewport. |

## Workflow

1. **Design first, outside the code.** I made the mockups in Stitch. They went well beyond the brief (scientific and converter modes, matrices, memory keys, telemetry cards), so a later job was deciding what to keep.
2. **Plan before code.** I started Claude in plan mode and gave it the brief plus my own constraints: define the stack, make the initial decisions, structure both projects in a new folder, and tell me which skills would help. No code was written until I approved the plan.
3. **Challenge the plan.** I pushed back on several proposals before approving (framework choice, what "microservice" means here, scope of the history feature). These exchanges changed the architecture; they are listed below.
4. **Build in verified steps.** One service or layer at a time, each with tests, then run for real: Go tests, Vitest with coverage, the app in a browser, and finally the Docker stack.
5. **Iterate on the UI by looking at it.** I ran the app, reported what bothered me, and Claude changed it.
6. **Review as the last step.** Once everything worked, I asked for a code review and a security review of the whole codebase, fixed what they found, and re-ran everything (details at the end).

On skills: during planning we listed candidates (a UI/UX design skill, code-review, simplify, security-review, browser verification) as a checklist of what the project would need. During the build only browser verification was used; the code-review and security-review skills were run at the end. The UI/UX and simplify skills were not used.

## Decisions I made, with the prompts behind them

**1. Kick-off.** The brief was pasted along with:
> Help me develop this challenge. For now, in the plan phase, let's define the stack and initial decisions, see which skills to use, and structure everything. Don't do anything in the `sebas` folder itself; create a folder inside it where both projects will live.

Claude inspected the machine and found Go missing (Node and Docker present). *My call:* install Go with winget, and use Docker both for development and for the full-stack Dockerfile.

**2. Framework.**
> I don't know if you recommend Next.js; the brief only mentions React with TypeScript. It's a technical test, could I use a framework if it's better? Also Tailwind.

Claude recommended against Next.js for a client-side app that only calls an API. *Result:* Vite + React + TypeScript + Tailwind v4, reasoning recorded in the README.

**3. Microservices.** I asked whether the backend would really be microservices. Claude proposed one well-built service. *My call:*
> One well-made microservice is fine, but leave the structure ready to scale. As an extra I want a history. What do you think about one microservice for the math operations and another for creating, deleting and editing past operations?

Claude agreed it is a real bounded context (stateless compute vs. stateful CRUD) and flagged the extra scope, so history was built after the calculator and the UI. The history service recomputes every result through the calculator service rather than trusting the client.

**4. Scoping the mockups.**
> Follow the colour palette from the pictures, with dark and light mode. The images go further with more sections and features, so follow the design and structure but keep the scope we have here. I also want animations and transitions, for example on an operation or on switching theme.

Claude read the mockups and their design tokens and proposed a keep/drop list that I approved. Motion was a requirement from me, not a default.

**5. Naming.** The mockups said "AuraCalc"; I renamed the product to SezzleMath everywhere.

**6. UI refinements after running it.** Short follow-ups, each from looking at the real app: remove placeholder status badges and the footer, a better logo that fits the palette, a calculator that fits the viewport height with no page scroll, a nicer history scrollbar, and a flash of page scrollbar when deleting a history row.

## Where I had to correct or verify the AI

- **Docker build failed at `npm ci`.** The lockfile created on Windows lacked Linux-only optional packages. It only showed up when I actually built the images; I regenerated the lockfile in a Linux container.
- **Operator keys were hard to read in light mode** (peach text on a light blue key). Found in the browser, fixed with the theme accent.
- **A scrollbar flashed on the page when deleting a history row.** Root cause: the exiting row was positioned against the whole page. Fixed by making the list its own positioning context.
- **Go version drift.** One dependency raised the minimum Go version, so `go.mod`, `go.work` and the Dockerfiles had to be aligned afterwards.
- **Keyboard input in the test browser** did not register, so I drove the UI by clicking keys instead of assuming typing worked.

## Final step: AI code review and security review

> Run a code review and a security review over the project, fix what they find, and re-test.

I ran Claude Code's `code-review` skill (high effort) over both services and the frontend, then the `security-review` skill.

**Code review: 9 findings, 8 fixed, 1 deliberately skipped.** Each fix has a regression test.

| Finding | Fix |
|---|---|
| Enter after clicking a keypad key re-pressed that key instead of calculating | Enter on a keypad key now means `=` |
| Backspace on a result like `1e+21` silently turned it into `1e+2` | Backspace is ignored for exponent-form results |
| The initial history load could overwrite a calculation made while it was loading | The list now merges with entries added meanwhile |
| The result's `aria-live` region was remounted on each result, so screen readers could miss it | The live region stays mounted; only the inner text animates |
| AC looked enabled while a request was running but did nothing | All keys are disabled while a request is in flight |
| `percentage` reported a false overflow when `a * b` overflowed but the answer fit (`1e308 % of 10`) | Falls back to `a / 100 * b` |
| The history edit form accepted `0x10` and similar through `Number()` | A strict decimal parser rejects them |
| `history-service` read upstream responses with no size limit | Capped at 64 KiB |
| Middleware and config helpers are copied between the two services | Skipped on purpose; documented trade-off (README) |

One related item was left undone: forwarding the request ID from `history-service` to `calculator-service` for cross-service log tracing (listed in the README under next steps).

**Security review: no reportable vulnerabilities.** The branch diff was only documentation, so I pointed it at the whole codebase. It found no injection, XSS, path or SSRF issue (parameterised SQL everywhere, React text rendering, fixed proxy prefixes, validated input). Two hardening notes came out, neither a vulnerability today: the default `CORS_ORIGINS=*` and the absence of security headers in nginx. There is also no authentication, which is a documented scope decision.

After the fixes: Go tests, lint and type-check pass, and the frontend suite grew from 74 to 93 tests (96.6% statement coverage). I then rebuilt the Docker stack and took the README screenshots from it.

## What AI did and did not do here

Claude wrote most of the code and tests. I owned the design, the scope, the architecture choices above, and the acceptance: nothing counted as done until tests passed and I had seen it run. Not done: an end-to-end browser test suite and CI (both listed under "What I would do next" in the README).
