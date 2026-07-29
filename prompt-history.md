# Prompt History — Steady

Prompts and decisions from building this project with Claude (Anthropic). This is a
representative selection rather than a transcript, chosen to show how the decisions got made.

---

## Planning

**Choosing the problem**

I work in the social impact space around substance use and mental health, so I wanted the project
to come from that rather than be a generic demo. My starting instruction was to build a recovery
or peer support tool.

Claude proposed four options: a daily check-in with a coping toolkit, an urge-surfing timer, a
milestone tracker, and a resource directory. I picked the check-in plus coping toolkit because it
had the most real value and enough logic to actually talk about in an interview.

**Narrowing the scope**

> The pre-course lesson is called "The Smallest Demonstration of Value." What is the smallest
> version of this that still does something useful, rather than being a to-do list with a
> different name?

This is where the shape of the app came from. The answer was that the check-in and the coping
strategy have to be one flow. Logging a craving and then having to go hunting for a coping skill
is the failure mode of every worksheet. The slider crossing a threshold is what makes it a tool
instead of a diary.

**Deciding what to leave out**

> The requirements say no database, no API, no accounts are needed. Is there any reason to add
> them anyway?

Conclusion: no, and there's a positive reason not to. Recovery data is sensitive, and for
justice-impacted users especially there's a real reluctance to hand records to someone else's
server. Keeping everything in `localStorage` turned a shortcut into the actual argument for the
product. That reasoning is now in the README under Value.

---

## Building

**Structure first**

> Build the HTML and CSS with all panels visible so I can see the whole shape before any
> behaviour exists.

I wanted to see the layout before wiring anything up. The panels use the `hidden` attribute and
JavaScript toggles it, so the structure is in HTML and only the state changes in JS.

**Organising the JavaScript**

Section 5 of the pre-course is about separation of concerns, so I asked for `app.js` to be grouped
into labelled parts — data, storage, helpers, rendering, events — rather than one long file in
whatever order things got written. That grouping is still in the file as comment headers.

**Naming**

> `daysSince` and `nextMilestone` are clear. Is `randomStrategy` doing what its name says, or is
> it also doing the displaying?

It was only picking, and `showCoping` does the displaying. Kept them separate.

---

## Questioning the AI

**The date bug I asked about before it happened**

> Counting days between two dates with plain `Date` objects usually goes wrong around daylight
> saving. Is this implementation safe?

It wasn't, initially. Subtracting two midnight timestamps can produce 23 or 25 hours across a DST
boundary, which rounds to the wrong day. The fix was to normalise both dates to midday before
subtracting, so a one-hour shift can't move the result across a day boundary. That's why
`daysSince` builds its dates at `12, 0, 0`.

**Pushing back on innerHTML**

The first version of the history list built rows with a template string and `innerHTML`. The
trigger field is free text the user types.

> If someone types HTML into the trigger box, what happens when it renders?

It would be parsed as markup. I had it rebuilt using `createElement` and `textContent` for the
user-supplied values, so typed input is always treated as text. The insights tiles still use
`innerHTML` because those values are numbers and counts the app calculates, not raw user input —
that was a deliberate distinction, not an oversight.

**Corrupt storage**

> What happens on load if `localStorage` holds something that isn't valid JSON?

`JSON.parse` throws and the app dies before rendering. `loadCheckins` now wraps the parse in a
`try/catch` and falls back to an empty array, and also checks that the result is actually an array.

---

## Verifying

I didn't take "it works" as an answer. What I checked in the browser:

- Set the start date to 45 days back — counter showed 45 and "15 days until day 60," so the maths
  and the next-milestone lookup were both right
- Logged a craving of 8 — the coping card appeared automatically and the page scrolled to it
- Saved a second check-in on the same day — confirmed in `localStorage` that it **replaced** the
  first entry rather than adding a duplicate, which was the behaviour I asked for
- Reloaded the page — day count, history, and insights all came back
- Seeded two older entries and confirmed the seven-day average came out to 5.7 for cravings of
  3, 5 and 9, and that "work stress" was correctly identified as the most-named trigger
- Checked the browser console — no errors

The same-day replacement was the one I most expected to be wrong, because it's easy to write it as
an append and not notice until you have two entries for one day.

---

## What I'd ask next time

Sooner: "what happens when this input is empty, wrong, or hostile?" Most of the real fixes in this
build — the DST rounding, the `innerHTML` issue, the corrupt-storage crash — came from asking that
about one specific piece of the code rather than from asking whether the app worked overall.
