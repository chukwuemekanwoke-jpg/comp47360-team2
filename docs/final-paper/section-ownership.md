# Final Paper Outline and Section Ownership

Jira task: `final paper - outline and first draft`

Status: first draft created from the synchronized repository on 2026-07-09. The draft is intentionally evidence-aware: final deployment URL, final screenshots, final model metrics, CI status, and user-testing results are marked as TODOs where the team needs to supply measured evidence.

## Paper Structure

| Section | First-draft content | Suggested owner |
|---|---|---|
| Abstract | Problem, objectives, methods, current findings, application URL placeholder | Yuhao Xu + Chukwuemeka Nwoke |
| Introduction | Product idea, two-sided marketplace problem, innovation on user and ML sides | Yuhao Xu |
| Literature Review | Existing reservation products, urban mobility datasets, open restaurant data | all leads |
| Methodology | Requirements, user stories, architecture rationale, technology stack | Chukwuemeka Nwoke + Yang Liu |
| System Architecture | React/Vite, Expo, shared API client, Express gateway, PostgreSQL, FastAPI, Google Routes fallback | Yang Liu + Milo Dennehy + Andrew Mitchell |
| Data Analytics and Visualization | NYC inspections, TLC taxi demand, simulated availability, features, UI analytics views | Rui Xu |
| Evaluation and Results | CI/tests, model metrics plan, usability testing, failure-mode testing | Chukwuemeka Nwoke + Rui Xu |
| Conclusion and Future Work | Critical reflection, limitations, future integrations and deployment | all leads |
| References | IEEE-style source cleanup, final URL verification | Chukwuemeka Nwoke |

## Evidence Still Needed Before Submission

- Deployed application URL for the abstract and title block.
- Final screenshots from the running app, preferably login, preferences, map discovery, flash deal inbox, booking, and merchant dashboard.
- CI status and test counts from the final branch.
- Model or heuristic evaluation numbers from notebooks, including busyness error if available and recommendation/promotional metrics if using simulated data.
- User testing notes: participant count, task completion rate, time on task, qualitative feedback.
- Confirmation of what is implemented versus planned for push notifications, manual search fallback, and production deployment.

## Circulation Plan

1. Yuhao reviews product framing, personas, competitor comparison, and conclusion.
2. Yang verifies backend, database, booking, offer, and campaign details.
3. Milo and Andrew verify mobile/web architecture, shared client, and screenshots.
4. Rui fills final data pipeline, model, and evaluation metrics.
5. Chukwuemeka verifies CI/CD, integration process, final references, and IEEE formatting.
6. Whole team performs one pass for overclaiming: anything based on simulated data should be labelled as simulated or predicted, not real production occupancy.

