// ============================================================
// tests.js
// Simple tests for Drip's data functions.
// These tests use a tiny assert() helper — no test framework.
// Results are logged to the browser console (F12 > Console).
// ============================================================

import {
  roundMoney,
  makeId,
  todayString,
  formatDate,
  addDaysToDate,
  isValidDate,
  isFutureDate,
  monthKey,
  currentMonthKey,
  makeDefaultCategories,
  sumAmounts,
  sortPurchasesByDate,
  hoursWorked,
  findDuplicateCategory,
  findDuplicatePurchase,
  percentUsed,
  getStatus,
  projectMonthEnd,
  daysInMonth,
  getLimitForRange,
  getPurchasesThisMonth,
  loadSettings,
  loadScenario,
  SCENARIOS,
  addMoneySaved,
  getPurchasesSince,
  calcHabitCost,
  safeToSpendPerDay,
  detectSubscriptions,
  saveCategories,
  savePurchases,
  loadCategories,
  loadPurchases,
  addCategory,
  deleteCategory,
  STORAGE_KEYS,
} from './data.js';

// ------------------------------------------------------------
// assertEqual(actual, expected, label) checks if two values
// are equal. If they match, it logs PASS. If not, it logs FAIL
// with both values so you can see what went wrong.
// ------------------------------------------------------------
function assertEqual(actual, expected, label) {
  if (actual === expected) {
    console.log('%cPASS%c ' + label, 'color:green;font-weight:bold', 'color:inherit');
  } else {
    console.log(
      '%cFAIL%c ' + label +
      ' — expected: ' + String(expected) +
      ', got: ' + String(actual),
      'color:red;font-weight:bold',
      'color:inherit'
    );
  }
}

// ------------------------------------------------------------
// assertTrue(value, label) checks that a value is true.
// ------------------------------------------------------------
function assertTrue(value, label) {
  assertEqual(value, true, label);
}

// ------------------------------------------------------------
// assertFalse(value, label) checks that a value is false.
// ------------------------------------------------------------
function assertFalse(value, label) {
  assertEqual(value, false, label);
}

// ------------------------------------------------------------
// runTests() runs every test group and prints a summary.
// ------------------------------------------------------------
function runTests() {
  console.log('%c=== Drip Tests ===', 'font-size:16px;font-weight:bold');
  let passed = 0;
  let failed = 0;

  // Save the real console.log so we can count results.
  const originalLog = console.log;
  console.log = function () {
    originalLog.apply(console, arguments);
    if (arguments.length >= 2) {
      const style = arguments[0] || '';
      if (style.includes('color:green')) passed++;
      if (style.includes('color:red')) failed++;
    }
  };

  // --- roundMoney ---
  assertEqual(roundMoney(10.005), 10.01, 'roundMoney rounds up at 5');
  assertEqual(roundMoney(10.004), 10.0, 'roundMoney rounds down at 4');
  assertEqual(roundMoney(0), 0, 'roundMoney handles zero');
  assertEqual(roundMoney('5.5'), 5.5, 'roundMoney works with string input');

  // --- makeId ---
  const id1 = makeId();
  const id2 = makeId();
  assertTrue(id1.length > 0, 'makeId returns a non-empty string');
  assertTrue(id1 !== id2, 'makeId returns unique ids');

  // --- formatDate ---
  const d = new Date(2026, 0, 5); // Jan 5, 2026
  assertEqual(formatDate(d), '2026-01-05', 'formatDate pads month and day');
  const d2 = new Date(2026, 10, 25); // Nov 25, 2026
  assertEqual(formatDate(d2), '2026-11-25', 'formatDate handles double-digit month');

  // --- addDaysToDate ---
  assertEqual(addDaysToDate('2026-01-01', 5), '2026-01-06', 'addDaysToDate adds days');
  assertEqual(addDaysToDate('2026-01-31', 1), '2026-02-01', 'addDaysToDate crosses month boundary');
  assertEqual(addDaysToDate('2026-03-01', -1), '2026-02-28', 'addDaysToDate subtracts days');

  // --- isValidDate ---
  assertTrue(isValidDate('2026-01-15'), 'isValidDate accepts a real date');
  assertFalse(isValidDate('2026-02-30'), 'isValidDate rejects Feb 30');
  assertFalse(isValidDate('not-a-date'), 'isValidDate rejects garbage');
  assertFalse(isValidDate('2026-1-5'), 'isValidDate rejects non-padded format');
  assertFalse(isValidDate(123), 'isValidDate rejects a number');

  // --- isFutureDate ---
  assertFalse(isFutureDate('2020-01-01'), 'isFutureDate is false for a past date');
  assertTrue(isFutureDate('2099-12-31'), 'isFutureDate is true for a far future date');

  // --- monthKey ---
  assertEqual(monthKey('2026-11-23'), '2026-11', 'monthKey extracts YYYY-MM');
  assertEqual(monthKey('2026-01-01'), '2026-01', 'monthKey works for January');

  // --- currentMonthKey ---
  const cmk = currentMonthKey();
  assertTrue(cmk.length === 7, 'currentMonthKey returns 7 characters');

  // --- todayString ---
  const today = todayString();
  assertTrue(isValidDate(today), 'todayString returns a valid date');
  assertFalse(isFutureDate(today), 'todayString is not in the future');

  // --- makeDefaultCategories ---
  const cats = makeDefaultCategories();
  assertEqual(cats.length, 8, 'makeDefaultCategories returns 8 categories');
  assertEqual(cats[0].name, 'Coffee', 'first default category is Coffee');
  assertEqual(cats[7].name, 'Other', 'last default category is Other');
  assertEqual(cats[0].monthlyLimit, 0, 'default monthly limit is 0');
  assertEqual(cats[0].watch, false, 'default watch is false');

  // --- sumAmounts ---
  const samplePurchases = [
    { amount: 5.5 },
    { amount: 3.25 },
    { amount: 1.0 },
  ];
  assertEqual(sumAmounts(samplePurchases), 9.75, 'sumAmounts adds amounts correctly');
  assertEqual(sumAmounts([]), 0, 'sumAmounts of empty array is 0');

  // --- sortPurchasesByDate ---
  const unsorted = [
    { id: 'a', date: '2026-03-01' },
    { id: 'b', date: '2026-01-15' },
    { id: 'c', date: '2026-02-10' },
  ];
  const sorted = sortPurchasesByDate(unsorted);
  assertEqual(sorted[0].id, 'a', 'sortPurchasesByDate puts newest first');
  assertEqual(sorted[2].id, 'b', 'sortPurchasesByDate puts oldest last');
  // Make sure it did not change the original array.
  assertEqual(unsorted[0].id, 'a', 'sortPurchasesByDate does not mutate original');

  // --- hoursWorked ---
  assertEqual(hoursWorked(100, 25), 4, 'hoursWorked divides amount by wage');
  assertEqual(hoursWorked(50, 0), null, 'hoursWorked returns null for zero wage');
  assertEqual(hoursWorked(50, -10), null, 'hoursWorked returns null for negative wage');
  assertEqual(hoursWorked(33.5, 15), 2.2, 'hoursWorked rounds to 1 decimal');

  // --- percentUsed ---
  assertEqual(percentUsed(50, 100), 50, 'percentUsed: half the limit is 50%');
  assertEqual(percentUsed(80, 100), 80, 'percentUsed: 80 of 100 is exactly 80%');
  assertEqual(percentUsed(50, 0), null, 'percentUsed: limit 0 returns null');
  assertEqual(percentUsed(50, -5), null, 'percentUsed: negative limit returns null');
  assertEqual(percentUsed(120, 100), 120, 'percentUsed: can go over 100%');

  // --- getStatus ---
  assertEqual(getStatus(79.99), 'ok', 'getStatus: 79.99 is ok');
  assertEqual(getStatus(80), 'warning', 'getStatus: exactly 80 is warning');
  assertEqual(getStatus(99.99), 'warning', 'getStatus: 99.99 is still warning');
  assertEqual(getStatus(100), 'over', 'getStatus: exactly 100 is over');
  assertEqual(getStatus(150), 'over', 'getStatus: 150 is over');
  assertEqual(getStatus(null), 'ok', 'getStatus: null (no limit) is ok');

  // --- projectMonthEnd ---
  // $30 spent in 1 day of a 30-day month projects to $900.
  assertEqual(projectMonthEnd(30, 1, 30), 900, 'projectMonthEnd: day 1 of 30 scales up 30x');
  // $30 spent over all 30 days is just $30 at month end.
  assertEqual(projectMonthEnd(30, 30, 30), 30, 'projectMonthEnd: last day adds no projection');
  // $10 over 5 days of a 31-day month projects to $62.
  assertEqual(projectMonthEnd(10, 5, 31), 62, 'projectMonthEnd: uses actual days in month');
  // 0 days elapsed is guarded — no division by zero.
  assertEqual(projectMonthEnd(30, 0, 30), 30, 'projectMonthEnd: 0 days elapsed returns spentSoFar');

  // --- calcHabitCost ---
  // 12 purchases of $5 across the last 4 weeks = 3 per week.
  // $5 average x 3 per week x 52 weeks = $780 per year.
  const weeklyHistory = [];
  for (let w = 0; w < 11; w++) {
    weeklyHistory.push(5);
  }
  assertEqual(calcHabitCost(weeklyHistory, 5), 780, 'calcHabitCost: $5 x 3 per week = $780/year');

  // --- safeToSpendPerDay ---
  // Over budget already — never negative, returns 0.
  assertEqual(safeToSpendPerDay(100, 150, 10), 0, 'safeToSpendPerDay: negative budget returns 0');
  assertEqual(safeToSpendPerDay(100, 100, 10), 0, 'safeToSpendPerDay: exactly at budget returns 0');
  assertEqual(safeToSpendPerDay(100, 50, 10), 5, 'safeToSpendPerDay: $50 left over 10 days is $5/day');
  assertEqual(safeToSpendPerDay(100, 50, 0), 0, 'safeToSpendPerDay: 0 days left returns 0');

  // --- getLimitForRange ---
  assertEqual(getLimitForRange(60, 'month'), 60, 'getLimitForRange month = monthly limit');
  assertEqual(getLimitForRange(60, '3months'), 180, 'getLimitForRange 3 months = x3');
  assertEqual(getLimitForRange(60, '6months'), 360, 'getLimitForRange 6 months = x6');
  assertEqual(getLimitForRange(60, 'year'), 720, 'getLimitForRange year = x12');
  assertEqual(getLimitForRange(60, 'today'), roundMoney(60 / daysInMonth()), 'getLimitForRange today = one day share');
  assertEqual(getLimitForRange(0, 'year'), 0, 'getLimitForRange returns 0 when no limit');

  // Restore console.log and print the summary.
  console.log = originalLog;
  console.log(
    '%c=== Results: ' + passed + ' passed, ' + failed + ' failed ===',
    'font-size:14px;font-weight:bold;color:' + (failed === 0 ? 'green' : 'red')
  );

  // Duplicate tests run separately so they do not affect the count above.
  runDuplicateTests();

  // Category-delete and subscription tests also run separately
  // because they temporarily swap real storage for fakes.
  runDeleteCategoryTests();
  runSubscriptionTests();
  runScenarioTests();
  runTimeRangeTests();
}

// Run the tests after the page is fully loaded.
document.addEventListener('DOMContentLoaded', runTests);

// ============================================================
// PHASE 2 TESTS — duplicates
// These use in-memory arrays so they do not touch storage.
// ============================================================

// ------------------------------------------------------------
// runDuplicateTests() checks findDuplicateCategory and
// findDuplicatePurchase with sample arrays.
// ------------------------------------------------------------
function runDuplicateTests() {
  console.log('%c=== Duplicate Tests ===', 'font-size:16px;font-weight:bold');

  // Sample categories to test against.
  const sampleCats = [
    { id: '1', name: 'Coffee', monthlyLimit: 0, watch: false },
    { id: '2', name: 'Snacks', monthlyLimit: 0, watch: false },
  ];

  // Exact match is found.
  const dup1 = findDuplicateCategory('Snacks', sampleCats);
  assertTrue(dup1 !== null, 'duplicate category: exact name is rejected');
  assertEqual(dup1 && dup1.id, '2', 'duplicate category: returns the right one');

  // Different capitalization is still rejected.
  const dup2 = findDuplicateCategory('COFFEE', sampleCats);
  assertTrue(dup2 !== null, 'duplicate category: UPPERCASE is rejected');
  assertEqual(dup2 && dup2.id, '1', 'duplicate category: uppercase matches Coffee');

  const dup3 = findDuplicateCategory('  coffee ', sampleCats);
  assertTrue(dup3 !== null, 'duplicate category: extra spaces + lowercase rejected');

  // A brand new name is allowed.
  const dup4 = findDuplicateCategory('Bubble Tea', sampleCats);
  assertEqual(dup4, null, 'duplicate category: new name is allowed');

  // Sample purchases to test against.
  const samplePurchases = [
    { id: 'a', amount: 4.5, category: '1', date: '2026-11-20', note: '', merchant: 'Starbucks' },
    { id: 'b', amount: 12.0, category: '2', date: '2026-11-21', note: '', merchant: 'Uber Eats' },
  ];

  // Same amount, merchant, and date = duplicate.
  const dupP1 = findDuplicatePurchase(4.5, 'Starbucks', '2026-11-20', samplePurchases);
  assertTrue(dupP1 !== null, 'duplicate purchase: exact match triggers confirmation');

  // Same merchant and amount but a different date is NOT a duplicate.
  const dupP2 = findDuplicatePurchase(4.5, 'Starbucks', '2026-11-22', samplePurchases);
  assertEqual(dupP2, null, 'duplicate purchase: different date is allowed');

  // Merchant matching ignores capitalization.
  const dupP3 = findDuplicatePurchase(4.5, 'starbucks', '2026-11-20', samplePurchases);
  assertTrue(dupP3 !== null, 'duplicate purchase: merchant capitalization ignored');

  // Same date and merchant but different amount is NOT a duplicate.
  const dupP4 = findDuplicatePurchase(5.0, 'Starbucks', '2026-11-20', samplePurchases);
  assertEqual(dupP4, null, 'duplicate purchase: different amount is allowed');
}

// ============================================================
// DELETE CATEGORY TESTS — purchases move to Other
// These temporarily swap the real storage functions for fake
// in-memory ones so the user's real data is never touched.
// ============================================================

// ------------------------------------------------------------
// installFakeStorage() replaces window.localStorage with an
// in-memory object that has the same getItem/setItem/removeItem
// methods. Returns the saved real storage so it can be restored.
// ------------------------------------------------------------
function installFakeStorage() {
  const real = window.localStorage;
  const fake = {};
  const fakeStorage = {
    getItem: function (key) {
      return key in fake ? fake[key] : null;
    },
    setItem: function (key, value) {
      fake[key] = String(value);
    },
    removeItem: function (key) {
      delete fake[key];
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: fakeStorage,
    configurable: true,
  });
  return real;
}

// ------------------------------------------------------------
// restoreStorage(real) puts the real localStorage back.
// ------------------------------------------------------------
function restoreStorage(real) {
  Object.defineProperty(window, 'localStorage', {
    value: real,
    configurable: true,
  });
}

// ------------------------------------------------------------
// runDeleteCategoryTests() checks that deleting a category
// moves its purchases to the "Other" category instead of
// deleting them.
// ------------------------------------------------------------
function runDeleteCategoryTests() {
  console.log('%c=== Delete Category Tests ===', 'font-size:16px;font-weight:bold');

  const real = installFakeStorage();

  try {
    // Set up two categories: one to delete and one named Other.
    saveCategories([
      { id: 'coffee', name: 'Coffee', monthlyLimit: 0, watch: false },
      { id: 'other', name: 'Other', monthlyLimit: 0, watch: false },
    ]);

    // Two purchases in Coffee.
    savePurchases([
      { id: 'p1', amount: 4.0, category: 'coffee', date: '2026-11-01', note: '', merchant: '' },
      { id: 'p2', amount: 6.0, category: 'coffee', date: '2026-11-02', note: '', merchant: '' },
    ]);

    // Delete the Coffee category.
    deleteCategory('coffee');

    // Coffee is gone.
    const cats = loadCategories();
    assertEqual(cats.length, 1, 'deleteCategory: category is removed');
    assertEqual(cats[0].id, 'other', 'deleteCategory: Other category remains');

    // Both purchases survived, now living in Other.
    const purchases = loadPurchases();
    assertEqual(purchases.length, 2, 'deleteCategory: purchases are not deleted');
    assertTrue(
      purchases.every(function (p) { return p.category === 'other'; }),
      'deleteCategory: purchases moved to Other'
    );

    // If there is NO Other category, deleting still keeps purchases.
    saveCategories([
      { id: 'coffee', name: 'Coffee', monthlyLimit: 0, watch: false },
    ]);
    savePurchases([
      { id: 'p3', amount: 5.0, category: 'coffee', date: '2026-11-03', note: '', merchant: '' },
    ]);
    deleteCategory('coffee');
    const afterCats = loadCategories();
    const afterPurchases = loadPurchases();
    assertEqual(afterPurchases.length, 1, 'deleteCategory: no Other still keeps purchases');
    assertTrue(
      afterCats.length === 1 && afterCats[0].name === 'Other' &&
        afterPurchases[0].category === afterCats[0].id,
      'deleteCategory: a new Other is created when missing'
    );
  } finally {
    restoreStorage(real);
  }
}

// ============================================================
// SUBSCRIPTION DETECTION TESTS
// Pure-function tests using in-memory purchase arrays.
// ============================================================

// ------------------------------------------------------------
// runSubscriptionTests() checks detectSubscriptions flags a
// clean 30-day repeat and ignores one-off purchases.
// ------------------------------------------------------------
function runSubscriptionTests() {
  console.log('%c=== Subscription Tests ===', 'font-size:16px;font-weight:bold');

  // A clean subscription: $15.49 every 30 days, 3 times.
  const repeating = [
    { id: 's1', amount: 15.49, category: 'c', date: '2026-09-01', note: '', merchant: 'Netflix' },
    { id: 's2', amount: 15.49, category: 'c', date: '2026-10-01', note: '', merchant: 'Netflix' },
    { id: 's3', amount: 15.49, category: 'c', date: '2026-11-01', note: '', merchant: 'Netflix' },
  ];
  const found = detectSubscriptions(repeating);
  assertEqual(found.length, 1, 'subscriptions: 30-day repeat is detected');
  assertEqual(found[0] && found[0].chargeCount, 3, 'subscriptions: counts all 3 charges');

  // Two random one-offs from the same merchant are NOT a subscription.
  const oneOffs = [
    { id: 'o1', amount: 8.0, category: 'c', date: '2026-09-14', note: '', merchant: 'Amazon' },
    { id: 'o2', amount: 45.0, category: 'c', date: '2026-11-20', note: '', merchant: 'Amazon' },
  ];
  const none = detectSubscriptions(oneOffs);
  assertEqual(none.length, 0, 'subscriptions: one-offs are ignored');

  // A single purchase can never be a subscription.
  const single = detectSubscriptions([repeating[0]]);
  assertEqual(single.length, 0, 'subscriptions: a single charge is ignored');

  // Only 2 charges a month apart is NOT enough (could be a coincidence).
  const twoCharges = detectSubscriptions([repeating[0], repeating[1]]);
  assertEqual(twoCharges.length, 0, 'subscriptions: only 2 charges is not enough');

  // Exactly 3 charges is the minimum that counts.
  const threeCharges = detectSubscriptions(repeating);
  assertEqual(threeCharges.length, 1, 'subscriptions: 3 charges is detected');
}

// ============================================================
// TIME RANGE TESTS — getPurchasesSince
// Uses the fake storage swap so the user's real data is safe.
// ============================================================

// ------------------------------------------------------------
// runTimeRangeTests() checks getPurchasesSince returns only
// purchases within the last N days, including today.
// These tests also document the dashboard dropdown options:
//   today     -> getPurchasesSince(0)
//   3 months  -> getPurchasesSince(89)
//   6 months  -> getPurchasesSince(182)
//   1 year    -> getPurchasesSince(364)
// ------------------------------------------------------------
function runTimeRangeTests() {
  console.log('%c=== Time Range Tests ===', 'font-size:16px;font-weight:bold');

  const real = installFakeStorage();

  try {
    const today = todayString();
    saveCategories(makeDefaultCategories());
    savePurchases([
      { id: 't1', amount: 1.0, category: 'x', date: addDaysToDate(today, 0), note: '', merchant: '' },
      { id: 't2', amount: 2.0, category: 'x', date: addDaysToDate(today, -10), note: '', merchant: '' },
      { id: 't3', amount: 4.0, category: 'x', date: addDaysToDate(today, -80), note: '', merchant: '' },
      { id: 't4', amount: 8.0, category: 'x', date: addDaysToDate(today, -150), note: '', merchant: '' },
      { id: 't5', amount: 16.0, category: 'x', date: addDaysToDate(today, -400), note: '', merchant: '' },
    ]);

    // Today only catches just the purchase dated today.
    assertEqual(getPurchasesSince(0).length, 1, 'time range: today returns 1 purchase');

    // Last 30 days catches today and 10 days ago.
    assertEqual(getPurchasesSince(30).length, 2, 'time range: last 30 days returns 2 purchases');

    // ~3 months catches 80 days ago too.
    assertEqual(getPurchasesSince(89).length, 3, 'time range: 3 months returns 3 purchases');

    // ~6 months catches 150 days ago.
    assertEqual(getPurchasesSince(182).length, 4, 'time range: 6 months returns 4 purchases');

    // ~1 year catches everything here (oldest is 400 days out only).
    assertEqual(getPurchasesSince(364).length, 4, 'time range: 1 year returns 4 purchases');
  } finally {
    restoreStorage(real);
  }
}

// ============================================================
// SCENARIO TESTS — the Settings test buttons
// ============================================================

// ------------------------------------------------------------
// statusesThisMonth() returns the status of each of the first 5
// categories this month ("none" when the limit is 0).
// ------------------------------------------------------------
function statusesThisMonth() {
  const cats = loadCategories();
  const month = getPurchasesThisMonth();
  const result = [];
  for (let i = 0; i < 5; i++) {
    const spent = sumAmounts(month.filter(function (p) { return p.category === cats[i].id; }));
    const pct = percentUsed(spent, cats[i].monthlyLimit);
    result.push(pct === null ? 'none' : getStatus(pct));
  }
  return result;
}

// ------------------------------------------------------------
// runScenarioTests() loads each limit scenario into fake storage
// and checks the statuses the dashboard should show.
// ------------------------------------------------------------
function runScenarioTests() {
  console.log('%c=== Scenario Tests ===', 'font-size:16px;font-weight:bold');
  const real = installFakeStorage();
  try {
    loadScenario('limits-ok');
    assertEqual(statusesThisMonth().join(','), 'ok,ok,ok,ok,ok', 'scenario: all under 80% is ok');

    loadScenario('limits-warning');
    assertEqual(statusesThisMonth().join(','), 'warning,warning,warning,warning,warning', 'scenario: 85% is warning');

    loadScenario('limits-over');
    assertEqual(statusesThisMonth().join(','), 'over,over,over,over,over', 'scenario: 120% is over');

    loadScenario('limits-boundary');
    assertEqual(statusesThisMonth().join(','), 'warning,over,ok,over,ok', 'scenario: exact 80% / 100% boundaries');

    loadScenario('limits-mixed');
    assertEqual(statusesThisMonth().join(','), 'ok,warning,over,none,ok', 'scenario: mixed statuses');

    loadScenario('no-limits');
    assertEqual(statusesThisMonth().join(','), 'none,none,none,none,none', 'scenario: no limits shows none');

    loadScenario('empty-month');
    assertEqual(getPurchasesThisMonth().length, 0, 'scenario: empty month has no purchases this month');
    assertTrue(loadPurchases().length > 0, 'scenario: empty month still has older purchases');

    loadScenario('subscriptions');
    const subs = detectSubscriptions(loadPurchases()).map(function (s) { return s.merchant; }).sort();
    assertEqual(subs.join(','), 'Disney+,Netflix,Spotify', 'scenario: only the real subscriptions are detected');

    loadScenario('duplicates');
    assertTrue(
      findDuplicatePurchase(5.5, 'starbucks', todayString(), loadPurchases()) !== null,
      'scenario: duplicates data triggers the duplicate check'
    );

    loadScenario('impulse');
    assertEqual(loadSettings().hourlyWage, 15, 'scenario: impulse sets an hourly wage');

    // Money Saved adds up across skipped purchases.
    addMoneySaved(5);
    addMoneySaved(2.5);
    assertEqual(loadSettings().moneySaved, 7.5, 'money saved: adds up skipped amounts');
    loadScenario('limits-ok');
    assertEqual(loadSettings().moneySaved, 0, 'money saved: scenarios reset it to 0');

    assertEqual(loadScenario('not-a-scenario'), null, 'scenario: unknown key changes nothing');
    assertTrue(SCENARIOS.length >= 10, 'scenario: list has the test buttons');
  } finally {
    restoreStorage(real);
  }
}
