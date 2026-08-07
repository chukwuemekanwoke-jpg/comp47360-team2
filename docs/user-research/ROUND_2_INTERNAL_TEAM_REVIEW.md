# Round 2: Internal Team Review and Demo Preparation

## Purpose and evidence status

This round was an internal engineering and product-quality review held on 25 July 2026. Five team members reviewed the end-to-end prototype and prepared for the final demonstration. The evidence source is the action-item summary posted after the meeting.

This was not an external usability study. It is reported as one five-person internal review session (`IR01`) and is not added to the count of seven research participants in Rounds 1 and 3. The action items record issues or requested work; they do not by themselves prove that every item was implemented.

## Participants and setting

| Session ID | Participants | Relationship to project | Review perspective | Individual demographics |
|---|---:|---|---|---|
| IR01 | 5 | Project team members | Product, engineering, data, interface, integration, and demo readiness | Not reported because this was an internal team session |

The retained summary does not contain participant-by-participant task results, individual quotations, or a formal task script.

## Review outputs

### Machine learning and prediction

- Replace the heuristic busyness fallback with the trained model at the prediction endpoint.
- Add a short-loop background job so predictions are recalculated and busyness values can change during the demonstration.
- Use historical averages as proxy inputs when live features such as taxi demand are unavailable.

### Matching and recommendation

- Compare budget tiers and dietary tags with restaurant attributes instead of awarding points merely because a preference exists.
- Add cuisine-preference matches to candidate scoring.

### Data and repository quality

- Move user preferences into a dedicated table linked by `user_id`.
- Import historical traffic data as a reproducible proxy input.
- Promote tested work through the agreed branch flow while preserving pull-request history.

### Frontend and interaction quality

- Remove fragile manual address entry where map selection is the intended control.
- Correct light/dark theme leaks and map-style refresh behaviour.
- Remove inconsistent gradients from authentication screens.
- Limit onboarding cuisine selections and persist them in the preference model.
- Personalise Discover results using saved preferences.

### Delivery readiness

- Update team timesheets.
- Distribute external test material and builds.
- Run an in-person end-to-end demo rehearsal before assessment.

## Interpretation and product response

The review identified readiness risks across model integration, data freshness, matching correctness, preference persistence, visual consistency, repository discipline, and demo reliability. It helped the team prioritise integration and presentation work before external formative testing and assessment.

The retained evidence does not provide a verified completion state for every action. Implementation claims should therefore be checked against merged code, pull requests, and the final repository rather than inferred from this action list.

## Limitations

- The review was conducted by the development team and was not independent.
- The build or commit reviewed was not recorded in the retained summary.
- A formal test protocol and participant-level results were not retained.
- Action ownership and completion status were not fully captured.
- The findings represent internal quality assurance, not evidence of external-user usability or market demand.
