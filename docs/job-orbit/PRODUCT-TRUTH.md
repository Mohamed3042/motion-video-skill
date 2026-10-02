# Job Orbit: feature benefits and claim boundaries

Job Orbit helps applicants organize career evidence, inspect saved opportunity research and choose a useful next step. The film illustrates ten parts of that workflow with fictional sample data. Its code-drawn interfaces are **film illustrations, not runtime screen recordings**. They may simplify or combine related native and web workflows.

This claim review is based on the recovered product source reviewed on 3 October 2026. Source references below are relative to the Job Orbit product repository, which is separate from this film package. They document implemented behavior; they do not establish a current provider connection, an open vacancy, a successful application or physical-phone acceptance.

## Ten feature worlds

| Feature | Applicant benefit | Accurate claim and important limit | Product source |
|---|---|---|---|
| Profile & resume | Keep each person's career evidence separate; create a resume from reviewed facts. | “Confirm facts before export.” Imports need review; exports use confirmed wording. Drafts do not become verified facts, and adding evidence does not train a model. | `web/src/ProfileStudio.tsx:19–34,104–158` |
| The globe | Explore saved research by geography and inspect its sources. | “Explore the evidence, place by place.” A country filter is a research scope, not complete market coverage or work eligibility. Unresolved locations must not become exact pins. | `web/src/App.tsx:1338–1454,1546–1907`; `web/src/True3DGlobe.tsx:1128–1286` |
| New findings | Read dated source observations and confirmed-skill overlaps. | “Findings with source context.” “Seen in employer feed” means when observed; other pages can remain “Opening unverified.” Newest observations come first. Refreshing the list does not itself run new research. | `web/src/FreshFindings.tsx:5–15`; `team3/findings.py:57–82` |
| Job focus | Narrow a noisy list to a role, its evidence and a review action. | “One role. Clear evidence. A next step.” Ordering helps review; it is not hiring probability. Saving a role is not submitting an application. | `web/src/FocusWorkspace.tsx:87–191`; `web/src/jobDecision.ts:57–95` |
| Your fit | Separate supported requirements, confirmed contradictions and missing evidence. | “Missing evidence is not a rejection.” Supported does not mean eligible or hired; undocumented does not mean the person lacks the skill. Supported or contradicted classifications need source evidence and confirmed fact excerpts. | `web/src/jobDecision.ts:27–32`; `web/src/JobDetail.tsx:95 onward` |
| Next proof | Explore which additional evidence might improve a future review. | “Hypothetical scenario.” “No skill is added to your profile.” A scenario does not confirm an achievement, grant a skill or guarantee interviews. | `web/src/App.tsx:2841–2891`; `web/src/ProfileStudio.tsx:142–153` |
| My market | Compare what saved research supports, including gaps in salary evidence. | “From your saved research.” “Undisclosed pay stays unknown.” The sample is not the whole market. Preserve salary source, date, currency and period; illustrative country bars are not normalized pay comparisons. | `web/src/App.tsx:2307–2735`; `src/Research.tsx:840–919`; `src/main.tsx:1026–1113` |
| Employers | Inspect employer observations and keep useful employers in view. | “Inspect employers through their sources.” Accepted public observations can describe needs without proving a current vacancy. Native watchlists track changes; they do not contact employers. | `web/src/App.tsx:2739–2837`; `src/Research.tsx:455–480,712–756` |
| Evidence & agents | Trace provenance, distinguish rejected claims and understand research status. | “Trace claims to sources and dates.” Reported, verified and rejected are different. A configured route is not a validated connection, and an animation of stages is not evidence of a completed live run. | `web/src/App.tsx:2895–3228`; `web/src/ResearchConnections.tsx:187–307` |
| Yours, everywhere | Open the desktop-hosted workspace through a private phone connection. | “Local workspace. Optional external providers.” The phone uses the PC workspace; keep the PC awake, Orbit running and the private Tailnet available. This is not an independent offline workspace or automatic synchronization between separate profile systems. | `src/OrbitPhone.tsx:27–111`; `web/src/MobileCompanion.tsx:119–159` |

## Applications and automation

The accurate whole-product wording is: **“Research with evidence. Applications require review and authorization.”** Native routes can fill and submit application forms after their authorization and package checks. Automatic execution also requires saved rules and an enabled automatic route. Research activity alone does not authorize a submission. Preserve challenge, takeover and pending-verification states instead of turning uncertain outcomes into “Submitted.”

Product source: `desktop/main.cjs:179–301,443–486`. The film does not demonstrate a live submission or promise autonomous hiring outcomes.

## Privacy and connections

Local storage is the default workspace model, but optional external services exist. Native fact extraction can send document text to the selected AI provider; searches can send query text to the selected search provider. Optional encrypted GitHub or S3 backups can leave the device. Describe these choices explicitly instead of saying all data always stays on the PC.

Product source: `src/main.tsx:651–658,774–799,1360–1452`. Free-only, local, connected-chat and capped-paid routes have separate setup and execution conditions (`web/src/ResearchConnections.tsx:187–307`). A policy label is not a claim of current service availability or measured spending.

The phone opens the same desktop service through the private link. Sleep, shutdown or closing Orbit can interrupt access. Offline caching covers a static connection page and icons, not career records or resumes. Browser presence is reported session activity, not proof that a physical phone was tested (`src/OrbitPhone.tsx:97–109`; `web/src/MobileCompanion.tsx:138–157`).

## Rules for future edits

- Resume wording must match the facts visibly confirmed in the example. Do not add qualifications during the export animation.
- Keep source-observation dates visible. A dated observation that an opening existed must not become an unqualified present-tense “is live.” A separate freshness rule does not make every finding checked within 24 hours.
- Keep salary units and unknown values honest. Sample charts must not imply real market measurements or cross-currency comparability.
- Use the private-link workflow for PC-to-phone access. Whole-workspace backup/restore is separate from document import and is not a profile “snapshot handoff” to a phone.
- Keep proposed UI designs and historical screenshots distinct from current runtime evidence. This film's illustrative UI does not establish that its exact layout is shipped.
- Use fictional sample people and employers. Do not publish real career facts, private application records, credentials, working private URLs or QR codes.

The optical illusions explain the creative story. They are not job-matching algorithms, eligibility assessments or scientific tests of viewers. Automated media checks verify specified technical properties; visual review, listening and product runtime verification remain separate kinds of evidence.
