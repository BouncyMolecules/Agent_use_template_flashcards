# Progress

## Done

- Step 1: Inspected the starter repository and explored health-tech mini-project ideas.
- Step 2: Chose TrialScope, a ClinicalTrials.gov study explorer, with Chart.js as the single library.
- Step 3: Built the responsive dashboard in the existing HTML, CSS, and JavaScript files. It searches a health topic, shows up to 10 studies, links to official study records, and charts the displayed study statuses.
- Tested JavaScript syntax, checked patch whitespace, confirmed the live API data fields, and tested searches for migraine and sleep in the browser.

## Next

- Try another health topic in the search box.

## Decisions & notes

- Chart.js is loaded from a CDN. Study data comes from the public ClinicalTrials.gov API.
- The status chart summarizes only the studies currently shown, not every study in the database.
- No extra project files were created, and SPEC.md was not changed.

## Known problems

- The dashboard needs an internet connection to load Chart.js and current study data.