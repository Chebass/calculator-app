# Prompts used

This project was built with Claude Code (Claude Sonnet 5.5) in a plan-then-build session. The conversation was in Spanish; the prompts below are translated and condensed, in order. Claude wrote the code; decisions were made by the author in these exchanges.

## 1. Kick-off (plan mode)

> Help me develop this challenge. For now, in the plan phase, let's define the stack and initial decisions, see which skills to use, and structure everything. Don't do anything in the `sebas` folder itself; create a folder inside it where both projects will live.

The full text of the challenge brief (React frontend, Go preferred backend microservice, tests, README, optional Dockerfile) was pasted with this message.

## 2. Tooling decision

Claude found that Go was not installed. Answer: install Go with winget, and use Docker both for development and for a Dockerfile that runs frontend and backend together.

## 3. Framework questions

> I don't know if you recommend Next.js; the brief only mentions React with TypeScript for the frontend. It's a technical test, could I use a framework if it's better? Also Tailwind. And for the backend they ask for microservices, let's make sure of that, and that a Dockerfile can run both projects together.

Outcome: Vite + React + TypeScript (Next.js rejected, reasons in the README), Tailwind CSS v4, a Dockerfile plus a compose file.

## 4. Microservices and history

> Is it guaranteed that we'll do microservices in the backend?

> OK, one well-made microservice is fine, but leave the structure ready to scale to more microservices. As an extra I want a history. What do you think about one microservice for the math operations and another for creating, deleting and editing the operations done before?

Outcome: `calculator-service` and `history-service`, with a `services/<name>/` layout.

## 5. Design and motion

> I created the folder in `sebas` and added `stitch_calculator_app` with mockup images. Follow the colour palette from the pictures, with both dark and light mode. The images go further with more sections and features, so follow the design and structure but keep the scope we have here. On the frontend I want animations, effects and transitions, for example when doing an operation or switching dark/light mode, and anywhere else it makes sense. Can we look for skills for that, or can I add more skills later?

## 6. Naming

> Last thing: don't use the name "AuraCalc" from the mockups as the app title; call it SezzleMath.

## 7. Execution

After the plan was approved, Claude implemented it in this order: calculator-service with tests, frontend with tests, history-service plus history panel, Docker files, README. Each step was verified by running the tests and driving the app in the browser.
