# Privacy and Anonymisation Protocol

## Public-release objective

The public repository should demonstrate what the team did while minimising the risk that a reader can identify a participant. Public evidence therefore uses research IDs, grouped demographics, paraphrased observations, and aggregate issue counts.

## Identifier scheme

- `E01--E03`: early exploratory interview records.
- `IR01`: one internal team-review session; not an individual participant ID.
- `P01`: internal formative evaluator.
- `P02--P04`: external formative evaluators.

E01--E03 and P01--P04 represent seven different people, as confirmed by the study organiser. The separate ID ranges preserve the distinction between exploratory interviews and later usability testing.

## Information included publicly

- broad status such as student, internal evaluator, or external peer;
- whether the perspective was diner-facing or merchant-dashboard evaluation;
- broad test surface and browser class;
- task outcome, observed hesitation, issue frequency, and product response; and
- missing demographic fields explicitly marked as not recorded.

## Information excluded from the public repository

- names, handles, avatars, emails, phone numbers, account IDs, and credentials;
- exact home, study, work, or test locations;
- precise device identifiers where they add re-identification risk without research value;
- raw screenshots containing Discord identities or private screen content;
- raw forms, response spreadsheets, recordings, private transcripts, and contact lists;
- image metadata and document metadata containing author names or local paths; and
- persona scenario text presented as if it were a verbatim participant response.

## Quotes and consent boundary

No retained evidence confirms explicit consent for publishing verbatim quotations. The public report therefore uses paraphrases rather than direct quotations. Private working documents may retain more detailed wording for internal traceability, but they must remain outside the public repository.

## Anonymisation limitations

Pseudonymisation is not absolute anonymity. A small project team may infer the identity of an internal evaluator from role and timing. To reduce that risk, the public report generalises the internal role, suppresses precise location and device details, and does not publish raw screenshots. The team must not attempt to re-identify external participants or combine this package with private contact information.

## Pre-publication audit

Before commit, search every proposed file for:

- real names and online handles;
- email patterns, phone numbers, passwords, tokens, and URLs containing identifiers;
- exact addresses, coordinates, institutions outside the project context, and private timestamps;
- image EXIF metadata;
- Word/PDF author metadata; and
- statements that imply uncollected demographics, consent, native-device testing, statistical generalisability, or restaurant-operator participation.

The public package should contain only the six files listed in its `README.md`. Raw evidence and superseded drafts must remain outside the public repository.
