# Steady — Daily Recovery Check-In

A private daily check-in and coping toolkit for people in recovery from substance use.

## Live Demo

https://nelson-agentic.github.io/steady-checkin/

## Problem

People early in recovery are told to "track how you're doing" and to "have a plan for cravings,"
but the two rarely live in the same place. Journals record what happened after the fact and
offer nothing in the moment. Coping-skill worksheets sit in a folder and are hardest to reach
for at exactly the moment they're needed most.

There is also a trust problem. Recovery data is some of the most sensitive information a person
has. Handing a daily log of cravings, moods, and triggers to a website that stores it on someone
else's server is a real barrier — particularly for people who are justice-impacted and have good
reason to be cautious about who holds records about them.

## Value

Steady puts the tracking and the coping response in the same tool, and keeps the data on the
user's own device.

- **It responds in the moment.** When a craving is logged at 6 or above, a coping strategy appears
  immediately, without the user having to go looking for one.
- **It shows patterns the user can act on.** A seven-day craving average and a most-named trigger
  turn scattered daily entries into something that can be discussed with a sponsor or counselor.
- **It gives credit for time served.** The day counter and milestone markers make progress visible
  on days that otherwise feel like nothing happened.
- **It is private by construction.** There is no account, no server, and no network request. Data
  is stored in `localStorage` and can be erased entirely with one button.

## Project Plan

I planned this in the order the pre-course lays out: identify the problem, define the value,
then pick the smallest version that actually delivers it.

The core insight was that the check-in and the coping strategy needed to be one flow, not two
features. That decision drove the design — the craving slider is the input, and crossing a
threshold on that slider is what triggers the response.

I deliberately scoped out anything requiring a backend. No accounts, no database, no API. Partly
because the requirements allow it, but mainly because storing this category of data remotely
would undercut the privacy argument that makes the tool worth using.

Build order:
1. Static layout and styling, with all panels visible, to get the shape right
2. `localStorage` read/write and the start-date setup flow
3. Day counter and milestone maths
4. The check-in form and saving entries
5. The craving threshold and coping strategy card
6. History list and the derived insights
7. Erase-all-data, crisis resources, and the accessibility pass

## Features

**Complete**

- Recovery start date with a live day counter
- Milestone tracking (1, 7, 30, 60, 90, 180, 365, 730 days) with a countdown to the next one
- Daily check-in capturing mood, craving intensity (0–10), and an optional trigger note
- One entry per calendar day — saving again the same day updates rather than duplicates
- Automatic coping strategy when a craving is logged at 6 or above
- Ten coping strategies, with a button to cycle to another
- History list of past check-ins, newest first
- Derived insights: seven-day craving average, total check-ins, most frequently named trigger
- All data persisted locally; one-click erase with confirmation
- Crisis resources (988, SAMHSA) and an explicit statement that this is not medical advice
- Responsive layout with light and dark support

**What I would build next**

- A simple chart of craving intensity over time — the numbers are already stored, they just aren't
  visualised, and a trend line would say more than an average
- Let the user add their own coping strategies, since the ones that work are personal
- Export to a text or CSV file, so a user can bring their history to an appointment
- A personal support-contact list, reachable from the coping card itself
- Configurable milestones, because recovery programs mark different intervals

## Technologies Used

- **HTML** — semantic structure, with `fieldset`/`legend` for the form groups and `aria-label`s
  on the emoji mood buttons so they're usable with a screen reader
- **CSS** — custom properties for the palette, flexbox for layout, `prefers-color-scheme` for
  dark mode. No framework.
- **JavaScript** — plain ES6. No libraries, no build step.
- **Web Storage API** — `localStorage` for persistence
- **GitHub Pages** — static hosting

## AI Tools Used

Claude (Anthropic), used throughout. See [`prompt-history.md`](prompt-history.md) for the
prompts and decisions behind the build.

## Running the Project

There is no build step and no dependencies.

**Online:** open the live demo link above.

**Locally:**

```bash
git clone https://github.com/nelson-agentic/steady-checkin.git
cd steady-checkin
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Opening `index.html` directly from the filesystem also works, but serving it over HTTP is closer
to how it behaves when deployed.

**Note on data:** everything is stored in your browser's `localStorage` for the site's origin.
Data does not follow you between browsers or devices, and clearing site data removes it.

## License

MIT
