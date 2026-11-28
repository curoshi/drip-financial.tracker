# Drip

Drip is a spending-limit tracker for small purchases that add up, like coffee, snacks, delivery and subscriptions. You set a monthly limit for each category you want to watch, log purchases, and Drip shows how much of each limit you have used and where you are headed by the end of the month.

Built for the ELEG 1301 Software Application Development Project (Prairie View A&M University).

## Features

- Add purchases with amount, category, merchant and date, with input validation
- Monthly limits per category, with status colors: OK (under 80%), warning (80% or more), over (100% or more)
- Dashboard with an alert banner, month-end projection, safe-to-spend-per-day number, and bars for today, 1 month, 3 months, 6 months or 1 year
- Impulse check: shows budget left, percent of the limit, yearly habit cost and work hours before you buy
  - **Check before I buy** previews a purchase and saves nothing. "I won't buy it" adds the amount to Money Saved.
  - Adding a purchase in a watched category runs the same check in log mode, which only records it.
- Subscription detector (3 or more similar charges about a month apart)
- Duplicate purchase and duplicate category checks
- Categories screen (deleting a category moves its purchases to "Other")
- History screen
- Settings: currency, hourly wage, test data

All data is stored in your browser's localStorage. Nothing leaves your device.

## Run it

You need Node.js installed.

```
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

To make a production build: `npm run build`

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure and screens |
| `style.css` | Styling |
| `app.js` | Screens, buttons and form handlers |
| `data.js` | Storage, formulas, subscription detector, test data and scenarios |
| `tests.js` | Automated tests that print PASS/FAIL to the browser console |

## Testing

1. Run the app and open the browser console (F12).
2. Reload the page. `tests.js` runs automatically and prints a PASS or FAIL line for each test.
3. In **Settings > Data**, the stress-test buttons load 30 to 300 purchases over different time spans. The limit and feature test buttons load known data and tell you what you should see on screen.

## Known limitations

- The impulse check works best before a purchase. If you log something you already bought, it can only be recorded.
- Purchases are entered by hand. Linking a bank or card feed is future work.
- Not yet built: insights page, savings goal planner, spending streaks, CSV import and export.
