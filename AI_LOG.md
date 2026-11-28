# AI Use Log

This log records where AI tools were used on Drip and what the team did ourselves. Edit the bracketed parts so they are accurate.

## Tools

| Tool | Used for |
| --- | --- |
| Claude (Anthropic) | Brainstorming project ideas, writing the build prompt, reviewing and fixing the code, writing tests, drafting report sections, making diagrams |
| Bolt.new | Generating the first version of the app (vanilla JavaScript, Vite), synced to GitHub |

## Timeline

1. **Idea.** Compared several project ideas with Claude and chose the spending-limit tracker (Drip). [Add who made the final choice and why.]
2. **Build.** Wrote a prompt with Claude and gave it to Bolt.new to generate the app. [Add what you changed or tested in Bolt.]
3. **Code review and fixes.** Claude read the GitHub repo and:
   - fixed the dashboard bars so they follow the selected time range (today, 1, 3, 6 months, 1 year)
   - fixed deleting a category so purchases move to "Other" instead of being lost
   - required 3 or more charges before something counts as a subscription
4. **Test tools.** Claude added stress-test buttons (30 to 300 purchases over different spans) and scenario buttons for limits, subscriptions, duplicates and the impulse check, plus more tests in `tests.js`.
5. **Impulse check.** We noticed the check is useless if the purchase already happened. Claude added a "Check before I buy" preview mode, and Money Saved now only counts purchases skipped in that mode.
6. **Report.** Claude drafted the report sections and diagrams from the rubric and the real code. [Add which sentences you rewrote in your own words.]

## What we did ourselves

- [Ran the app locally and tested every screen.]
- [Checked the PASS/FAIL results in the browser console.]
- [Took the screenshots in the report.]
- [Decided what features to keep and what to leave as future work.]
- [Reviewed and edited the report text.]

## How we checked AI output

- Ran `tests.js` after changes and confirmed all tests print PASS.
- Used the scenario buttons to compare what the screen shows with what each scenario says to expect.
- [Add anything else you checked by hand.]
