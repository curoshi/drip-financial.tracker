// ============================================================
// data.js
// All data for Drip lives in the browser's localStorage.
// Every read and write is wrapped in try/catch so the app
// still works if storage is empty or blocked.
// ============================================================

// The keys we use to save things in localStorage.
const STORAGE_KEYS = {
  categories: 'drip.categories',
  purchases: 'drip.purchases',
  settings: 'drip.settings',
  theme: 'drip.theme',
};

// Default category names the app starts with.
const DEFAULT_CATEGORY_NAMES = [
  'Coffee',
  'Food Delivery',
  'Fast Food',
  'Subscriptions',
  'In-App/Gaming',
  'Snacks',
  'Shopping',
  'Other',
];

// Default settings when the app runs for the first time.
const DEFAULT_SETTINGS = {
  hourlyWage: 0,
  currency: '$',
  savingsGoal: null,
  moneySaved: 0,
};

// Export the keys so other files can use them.
export { STORAGE_KEYS, DEFAULT_CATEGORY_NAMES, DEFAULT_SETTINGS };

// ------------------------------------------------------------
// makeId() returns a simple unique string used for ids.
// It combines the current time and a random number.
// ------------------------------------------------------------
export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ------------------------------------------------------------
// roundMoney(n) rounds a number to 2 decimal places.
// We store all money values as numbers with 2 decimals.
// ------------------------------------------------------------
export function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

// ------------------------------------------------------------
// todayString() returns today's date as "YYYY-MM-DD".
// ------------------------------------------------------------
export function todayString() {
  const d = new Date();
  return formatDate(d);
}

// ------------------------------------------------------------
// formatDate(d) takes a Date object and returns "YYYY-MM-DD".
// We pad single-digit months and days with a leading zero.
// ------------------------------------------------------------
export function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// ------------------------------------------------------------
// addDaysToDate(dateStr, n) takes a "YYYY-MM-DD" string,
// adds n days, and returns a new "YYYY-MM-DD" string.
// ------------------------------------------------------------
export function addDaysToDate(dateStr, n) {
  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

// ------------------------------------------------------------
// daysBetween(dateStr1, dateStr2) returns the number of days
// between two "YYYY-MM-DD" date strings.
// A positive result means dateStr2 is after dateStr1.
// ------------------------------------------------------------
export function daysBetween(dateStr1, dateStr2) {
  const p1 = dateStr1.split('-');
  const d1 = new Date(Number(p1[0]), Number(p1[1]) - 1, Number(p1[2]));
  const p2 = dateStr2.split('-');
  const d2 = new Date(Number(p2[0]), Number(p2[1]) - 1, Number(p2[2]));
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2 - d1) / msPerDay);
}

// ------------------------------------------------------------
// isValidDate(dateStr) returns true if the string is a real
// calendar date in "YYYY-MM-DD" format.
// ------------------------------------------------------------
export function isValidDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  if (dateStr.length !== 10) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

// ------------------------------------------------------------
// isFutureDate(dateStr) returns true if the date is after today.
// ------------------------------------------------------------
export function isFutureDate(dateStr) {
  if (!isValidDate(dateStr)) return false;
  const today = todayString();
  return dateStr > today;
}

// ------------------------------------------------------------
// monthKey(dateStr) returns "YYYY-MM" for a "YYYY-MM-DD" string.
// We use this to group purchases by month.
// ------------------------------------------------------------
export function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

// ------------------------------------------------------------
// currentMonthKey() returns the "YYYY-MM" for this month.
// ------------------------------------------------------------
export function currentMonthKey() {
  return monthKey(todayString());
}

// ============================================================
// STORAGE — all reads and writes wrapped in try/catch
// ============================================================

// ------------------------------------------------------------
// readJSON(key, fallback) reads a key from localStorage,
// parses it as JSON, and returns the value.
// If anything fails, it returns the fallback value.
// ------------------------------------------------------------
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

// ------------------------------------------------------------
// writeJSON(key, value) saves a value as JSON to localStorage.
// Returns true if it worked, false if it failed.
// ------------------------------------------------------------
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

// ============================================================
// CATEGORIES
// ============================================================

// ------------------------------------------------------------
// makeDefaultCategories() builds an array of category objects
// from the default names. Each gets an id, a limit of 0, and
// watch set to false.
// ------------------------------------------------------------
export function makeDefaultCategories() {
  const list = [];
  for (let i = 0; i < DEFAULT_CATEGORY_NAMES.length; i++) {
    list.push({
      id: makeId(),
      name: DEFAULT_CATEGORY_NAMES[i],
      monthlyLimit: 0,
      watch: false,
    });
  }
  return list;
}

// ------------------------------------------------------------
// loadCategories() reads categories from storage.
// If nothing is saved, it creates and saves defaults.
// ------------------------------------------------------------
export function loadCategories() {
  let cats = readJSON(STORAGE_KEYS.categories, null);
  if (!cats || !Array.isArray(cats) || cats.length === 0) {
    cats = makeDefaultCategories();
    writeJSON(STORAGE_KEYS.categories, cats);
  }
  return cats;
}

// ------------------------------------------------------------
// saveCategories(list) saves the categories array to storage.
// ------------------------------------------------------------
export function saveCategories(list) {
  return writeJSON(STORAGE_KEYS.categories, list);
}

// ------------------------------------------------------------
// addCategory(name, monthlyLimit) creates a new category,
// saves it, and returns the new category object.
// ------------------------------------------------------------
export function addCategory(name, monthlyLimit) {
  const cats = loadCategories();
  const cat = {
    id: makeId(),
    name: name,
    monthlyLimit: roundMoney(monthlyLimit || 0),
    watch: false,
  };
  cats.push(cat);
  saveCategories(cats);
  return cat;
}

// ------------------------------------------------------------
// findDuplicateCategory(name, categories) returns the first
// category whose name matches the given name, ignoring
// capitalization and extra spaces. Returns null if none match.
// ------------------------------------------------------------
export function findDuplicateCategory(name, categories) {
  const clean = name.trim().toLowerCase();
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].name.toLowerCase() === clean) {
      return categories[i];
    }
  }
  return null;
}

// ------------------------------------------------------------
// renameCategory(id, newName) changes the name of one category.
// ------------------------------------------------------------
export function renameCategory(id, newName) {
  const cats = loadCategories();
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].id === id) {
      cats[i].name = newName;
      break;
    }
  }
  saveCategories(cats);
}

// ------------------------------------------------------------
// deleteCategory(id) removes a category. Purchases in that
// category are NOT deleted — they are moved to the "Other"
// category instead, so no spending history is lost. If there
// is no "Other" category to move them to (for example when
// deleting "Other" itself), the purchases are removed.
// ------------------------------------------------------------
export function deleteCategory(id) {
  let cats = loadCategories();

  // Find the "Other" category, as long as it is not the one
  // being deleted.
  let otherCat = null;
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].name.toLowerCase() === 'other' && cats[i].id !== id) {
      otherCat = cats[i];
      break;
    }
  }

  // Remove the category itself.
  cats = cats.filter(function (c) {
    return c.id !== id;
  });
  saveCategories(cats);

  const purchases = loadPurchases();

  if (otherCat) {
    // Move every purchase from the deleted category to Other.
    for (let i = 0; i < purchases.length; i++) {
      if (purchases[i].category === id) {
        purchases[i].category = otherCat.id;
      }
    }
    savePurchases(purchases);
  } else {
    // No Other category — remove the purchases as before.
    const kept = purchases.filter(function (p) {
      return p.category !== id;
    });
    savePurchases(kept);
  }
}

// ------------------------------------------------------------
// setCategoryLimit(id, limit) sets the monthly limit for
// one category.
// ------------------------------------------------------------
export function setCategoryLimit(id, limit) {
  const cats = loadCategories();
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].id === id) {
      cats[i].monthlyLimit = roundMoney(limit);
      break;
    }
  }
  saveCategories(cats);
}

// ------------------------------------------------------------
// toggleWatch(id) flips the watch flag on one category.
// ------------------------------------------------------------
export function toggleWatch(id) {
  const cats = loadCategories();
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].id === id) {
      cats[i].watch = !cats[i].watch;
      break;
    }
  }
  saveCategories(cats);
}

// ------------------------------------------------------------
// getCategoryById(id) looks up a single category by id.
// Returns null if not found.
// ------------------------------------------------------------
export function getCategoryById(id) {
  const cats = loadCategories();
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].id === id) return cats[i];
  }
  return null;
}

// ============================================================
// PURCHASES
// ============================================================

// ------------------------------------------------------------
// loadPurchases() reads purchases from storage.
// Returns an empty array if nothing is saved.
// ------------------------------------------------------------
export function loadPurchases() {
  const list = readJSON(STORAGE_KEYS.purchases, []);
  if (!Array.isArray(list)) return [];
  return list;
}

// ------------------------------------------------------------
// savePurchases(list) saves the purchases array to storage.
// ------------------------------------------------------------
export function savePurchases(list) {
  return writeJSON(STORAGE_KEYS.purchases, list);
}

// ------------------------------------------------------------
// addPurchase(data) creates a new purchase from a data object,
// saves it, and returns the new purchase.
// The data object should have: amount, category, date, note, merchant.
// ------------------------------------------------------------
export function addPurchase(data) {
  const purchases = loadPurchases();
  const purchase = {
    id: makeId(),
    amount: roundMoney(data.amount),
    category: data.category,
    date: data.date,
    note: data.note || '',
    merchant: data.merchant || '',
  };
  purchases.push(purchase);
  savePurchases(purchases);
  return purchase;
}

// ------------------------------------------------------------
// findDuplicatePurchase(amount, merchant, date, purchases)
// returns the first purchase with the same amount, merchant,
// and date as the new one. Returns null if there is no match.
// ------------------------------------------------------------
export function findDuplicatePurchase(amount, merchant, date, purchases) {
  const targetAmount = roundMoney(amount);
  const targetMerchant = (merchant || '').trim().toLowerCase();
  for (let i = 0; i < purchases.length; i++) {
    const p = purchases[i];
    const sameAmount = roundMoney(p.amount) === targetAmount;
    const sameDate = p.date === date;
    const sameMerchant = (p.merchant || '').trim().toLowerCase() === targetMerchant;
    if (sameAmount && sameDate && sameMerchant) {
      return p;
    }
  }
  return null;
}

// ------------------------------------------------------------
// deletePurchase(id) removes one purchase by id.
// ------------------------------------------------------------
export function deletePurchase(id) {
  let purchases = loadPurchases();
  purchases = purchases.filter(function (p) {
    return p.id !== id;
  });
  savePurchases(purchases);
}

// ------------------------------------------------------------
// getPurchasesByCategory(catId) returns only the purchases
// that belong to one category.
// ------------------------------------------------------------
export function getPurchasesByCategory(catId) {
  const purchases = loadPurchases();
  return purchases.filter(function (p) {
    return p.category === catId;
  });
}

// ------------------------------------------------------------
// getPurchasesThisMonth() returns only the purchases whose
// date falls in the current calendar month.
// ------------------------------------------------------------
export function getPurchasesThisMonth() {
  const key = currentMonthKey();
  const purchases = loadPurchases();
  return purchases.filter(function (p) {
    return monthKey(p.date) === key;
  });
}

// ------------------------------------------------------------
// sumAmounts(purchases) adds up the amount of every purchase
// in the array and returns the total as a rounded number.
// ------------------------------------------------------------
export function sumAmounts(purchases) {
  let total = 0;
  for (let i = 0; i < purchases.length; i++) {
    total = total + purchases[i].amount;
  }
  return roundMoney(total);
}

// ------------------------------------------------------------
// getRecentPurchases(n) returns the last n purchases,
// sorted by date with the newest first.
// ------------------------------------------------------------
export function getRecentPurchases(n) {
  const purchases = loadPurchases().slice();
  purchases.sort(function (a, b) {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
  return purchases.slice(0, n);
}

// ------------------------------------------------------------
// sortPurchasesByDate(purchases) returns a new array sorted
// newest-first by date.
// ------------------------------------------------------------
export function sortPurchasesByDate(purchases) {
  const copy = purchases.slice();
  copy.sort(function (a, b) {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
  return copy;
}

// ------------------------------------------------------------
// hoursWorked(amount, hourlyWage) returns how many hours of
// work an amount equals, based on an hourly wage.
// Returns null if the wage is 0 or not a positive number.
// ------------------------------------------------------------
export function hoursWorked(amount, hourlyWage) {
  if (!hourlyWage || hourlyWage <= 0) return null;
  return Math.round((amount / hourlyWage) * 10) / 10;
}

// ============================================================
// SETTINGS
// ============================================================

// ------------------------------------------------------------
// loadSettings() reads settings from storage.
// If nothing is saved, it returns the default settings.
// ------------------------------------------------------------
export function loadSettings() {
  const s = readJSON(STORAGE_KEYS.settings, null);
  if (!s) return Object.assign({}, DEFAULT_SETTINGS);
  return {
    hourlyWage: s.hourlyWage || 0,
    currency: s.currency || '$',
    savingsGoal: s.savingsGoal != null ? s.savingsGoal : null,
    moneySaved: s.moneySaved || 0,
  };
}

// ------------------------------------------------------------
// saveSettings(settings) saves the settings object to storage.
// ------------------------------------------------------------
export function saveSettings(settings) {
  return writeJSON(STORAGE_KEYS.settings, settings);
}

// ============================================================
// THEME
// ============================================================

// ------------------------------------------------------------
// loadTheme() returns "light" or "dark".
// Defaults to "light" if nothing is saved.
// ------------------------------------------------------------
export function loadTheme() {
  return readJSON(STORAGE_KEYS.theme, 'light');
}

// ------------------------------------------------------------
// saveTheme(theme) saves "light" or "dark" to storage.
// ------------------------------------------------------------
export function saveTheme(theme) {
  return writeJSON(STORAGE_KEYS.theme, theme);
}

// ============================================================
// IMPULSE CHECK — habit cost and budget impact
// ============================================================

// ------------------------------------------------------------
// getBudgetLeftAfter(catId, amount) returns how much budget
// is left in a category after a potential purchase.
// Returns null if the category has no limit (limit = 0).
// ------------------------------------------------------------
export function getBudgetLeftAfter(catId, amount) {
  const cat = getCategoryById(catId);
  if (!cat || cat.monthlyLimit <= 0) return null;
  const monthPurchases = getPurchasesThisMonth().filter(function (p) {
    return p.category === catId;
  });
  const spent = sumAmounts(monthPurchases);
  return roundMoney(cat.monthlyLimit - spent - amount);
}

// ------------------------------------------------------------
// getPercentOfLimit(catId, amount) returns what percentage
// of the monthly limit a purchase would use.
// Returns null if the category has no limit.
// ------------------------------------------------------------
export function getPercentOfLimit(catId, amount) {
  const cat = getCategoryById(catId);
  if (!cat || cat.monthlyLimit <= 0) return null;
  return Math.round((amount / cat.monthlyLimit) * 100);
}

// ============================================================
// BUDGET STATUS & MONTH-END PROJECTION
// Pure functions — they only use their inputs, so they are
// easy to test without any saved data.
// ============================================================

// ------------------------------------------------------------
// percentUsed(spent, limit) returns how much of the limit was
// spent, as a percentage (80 means 80% used).
// Returns null if the limit is 0, because there is no limit
// to compare against (and dividing by zero is impossible).
// ------------------------------------------------------------
export function percentUsed(spent, limit) {
  if (!limit || limit <= 0) return null;
  return (spent / limit) * 100;
}

// ------------------------------------------------------------
// getStatus(percent) turns a percentage into a status word:
//   "ok"      — under 80
//   "warning" — 80 up to (but not including) 100
//   "over"    — 100 or more (at exactly 100% the budget is
//               used up, so it counts as over)
// Returns "ok" for null (no limit set).
// ------------------------------------------------------------
export function getStatus(percent) {
  if (percent === null || percent === undefined) return 'ok';
  if (percent >= 100) return 'over';
  if (percent >= 80) return 'warning';
  return 'ok';
}

// ------------------------------------------------------------
// projectMonthEnd(spentSoFar, daysElapsed, daysInMonth)
// estimates the total spent by the end of the month, based on
// the average spending per day so far.
// daysElapsed must be at least 1. If a smaller value is given
// there is no pace to measure, so it just returns spentSoFar.
// ------------------------------------------------------------
export function projectMonthEnd(spentSoFar, daysElapsed, daysInMonth) {
  if (daysElapsed < 1) return roundMoney(spentSoFar);
  const perDay = spentSoFar / daysElapsed;
  return roundMoney(perDay * daysInMonth);
}

// ------------------------------------------------------------
// calcHabitCost(recentAmounts, newAmount) estimates the yearly
// cost if a purchase becomes a habit.
// recentAmounts = array of purchase amounts in the last 4 weeks.
// newAmount = the amount of the potential new purchase.
// Formula: average amount × purchases per week × 52.
// ------------------------------------------------------------
export function calcHabitCost(recentAmounts, newAmount) {
  const allAmounts = recentAmounts.slice();
  allAmounts.push(newAmount);
  const count = allAmounts.length;
  if (count === 0) return 0;
  const purchasesPerWeek = count / 4;
  let sum = 0;
  for (let i = 0; i < allAmounts.length; i++) {
    sum += allAmounts[i];
  }
  const averageAmount = sum / count;
  return roundMoney(averageAmount * purchasesPerWeek * 52);
}

// ------------------------------------------------------------
// getRecentAmountsForCategory(catId, dateStr) returns an array
// of purchase amounts in a category from the last 4 weeks
// (28 days) before the given date.
// ------------------------------------------------------------
export function getRecentAmountsForCategory(catId, dateStr) {
  const cutoff = addDaysToDate(dateStr, -28);
  const purchases = getPurchasesByCategory(catId);
  const result = [];
  for (let i = 0; i < purchases.length; i++) {
    if (purchases[i].date >= cutoff && purchases[i].date <= dateStr) {
      result.push(purchases[i].amount);
    }
  }
  return result;
}

// ------------------------------------------------------------
// addMoneySaved(amount) adds to the "money saved by skipping"
// counter in settings. Returns the new total.
// ------------------------------------------------------------
export function addMoneySaved(amount) {
  const s = loadSettings();
  s.moneySaved = roundMoney((s.moneySaved || 0) + amount);
  saveSettings(s);
  return s.moneySaved;
}

// ============================================================
// SAFE-TO-SPEND PER DAY
// ============================================================

// ------------------------------------------------------------
// daysLeftInMonth() returns how many days are left in the
// current month, not counting today.
// Returns 0 on the last day of the month.
// ------------------------------------------------------------
export function daysLeftInMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Last day of the current month.
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const left = lastDay - today;
  return left > 0 ? left : 0;
}

// ------------------------------------------------------------
// daysInMonth() returns the total number of days in the
// current month (e.g. 30 for November, 31 for January).
// ------------------------------------------------------------
export function daysInMonth() {
  const now = new Date();
  // Day 0 of next month is the last day of this month.
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// ------------------------------------------------------------
// safeToSpendPerDay(totalLimits, totalSpent, daysLeft) returns
// how much money is safe to spend per day for the rest of the
// month. Returns 0 if the budget is negative or daysLeft is 0.
// ------------------------------------------------------------
export function safeToSpendPerDay(totalLimits, totalSpent, daysLeft) {
  const remaining = totalLimits - totalSpent;
  if (remaining <= 0) return 0;
  if (daysLeft <= 0) return 0;
  return roundMoney(remaining / daysLeft);
}

// ------------------------------------------------------------
// getSafeToSpendPerDay() reads all data from storage and
// returns the safe-to-spend amount for today.
// ------------------------------------------------------------
export function getSafeToSpendPerDay() {
  const cats = loadCategories();
  let totalLimits = 0;
  for (let i = 0; i < cats.length; i++) {
    totalLimits += cats[i].monthlyLimit;
  }
  const totalSpent = sumAmounts(getPurchasesThisMonth());
  return safeToSpendPerDay(totalLimits, totalSpent, daysLeftInMonth());
}

// ============================================================
// SUBSCRIPTION DETECTOR
// ============================================================

// ------------------------------------------------------------
// withinTenPercent(a, b) returns true if two amounts are
// within 10% of each other.
// ------------------------------------------------------------
export function withinTenPercent(a, b) {
  if (a === 0 && b === 0) return true;
  const larger = Math.max(a, b);
  if (larger === 0) return false;
  const diff = Math.abs(a - b);
  return diff / larger <= 0.10;
}

// ------------------------------------------------------------
// amountsAllWithinTenPercent(purchases) checks if every pair
// of purchase amounts in the array is within 10% of each other.
// ------------------------------------------------------------
function amountsAllWithinTenPercent(purchases) {
  for (let i = 0; i < purchases.length; i++) {
    for (let j = i + 1; j < purchases.length; j++) {
      if (!withinTenPercent(purchases[i].amount, purchases[j].amount)) {
        return false;
      }
    }
  }
  return true;
}

// ------------------------------------------------------------
// gapsAllInRange(purchases) checks if the gap between every
// pair of consecutive purchases is between 25 and 35 days.
// ------------------------------------------------------------
function gapsAllInRange(purchases) {
  for (let i = 1; i < purchases.length; i++) {
    const gap = daysBetween(purchases[i - 1].date, purchases[i].date);
    if (gap < 25 || gap > 35) return false;
  }
  return true;
}

// ------------------------------------------------------------
// averageAmount(purchases) returns the average amount of
// all purchases in the array.
// ------------------------------------------------------------
function averageAmount(purchases) {
  if (purchases.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < purchases.length; i++) {
    sum += purchases[i].amount;
  }
  return sum / purchases.length;
}

// ------------------------------------------------------------
// averageGap(purchases) returns the average number of days
// between consecutive purchases.
// ------------------------------------------------------------
function averageGap(purchases) {
  if (purchases.length < 2) return 30;
  let total = 0;
  let count = 0;
  for (let i = 1; i < purchases.length; i++) {
    total += daysBetween(purchases[i - 1].date, purchases[i].date);
    count++;
  }
  return total / count;
}

// ------------------------------------------------------------
// detectSubscriptions(purchases) groups purchases by merchant
// (case-insensitive) and finds subscriptions.
// A subscription is 2+ purchases from the same merchant whose
// amounts are within 10% of each other and whose gaps are
// 25-35 days apart.
// Returns an array of subscription objects:
//   { merchant, averageAmount, monthlyCost, yearlyCost,
//     nextExpectedDate, chargeCount }
// ------------------------------------------------------------
export function detectSubscriptions(purchases) {
  // Group purchases by merchant name (lowercase for matching).
  const groups = {};
  for (let i = 0; i < purchases.length; i++) {
    const p = purchases[i];
    if (!p.merchant) continue;
    const key = p.merchant.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  const subs = [];
  const keys = Object.keys(groups);

  for (let g = 0; g < keys.length; g++) {
    const group = groups[keys[g]];
    if (group.length < 2) continue;

    // Sort by date oldest first.
    group.sort(function (a, b) {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });

    // Check amounts are all within 10% of each other.
    if (!amountsAllWithinTenPercent(group)) continue;

    // Check gaps are all 25-35 days.
    if (!gapsAllInRange(group)) continue;

    // It is a subscription!
    const avgAmt = averageAmount(group);
    const avgGapDays = Math.round(averageGap(group));
    const lastDate = group[group.length - 1].date;
    const nextDate = addDaysToDate(lastDate, avgGapDays);

    subs.push({
      merchant: group[0].merchant,
      averageAmount: roundMoney(avgAmt),
      monthlyCost: roundMoney(avgAmt),
      yearlyCost: roundMoney(avgAmt * 12),
      nextExpectedDate: nextDate,
      chargeCount: group.length,
    });
  }

  return subs;
}

// ------------------------------------------------------------
// getTotalYearlySubscriptions(subs) adds up the yearly cost
// of all detected subscriptions.
// ------------------------------------------------------------
export function getTotalYearlySubscriptions(subs) {
  let total = 0;
  for (let i = 0; i < subs.length; i++) {
    total += subs[i].yearlyCost;
  }
  return roundMoney(total);
}

// ============================================================
// DEMO DATA
// ============================================================

// A list of realistic merchants and price ranges for each
// default category. We use this to build demo purchases.
const DEMO_MERCHANTS = [
  { cat: 0, name: 'Starbucks', min: 3.5, max: 6.5 },
  { cat: 0, name: 'Campus Cafe', min: 2.5, max: 5.0 },
  { cat: 1, name: 'Uber Eats', min: 12.0, max: 28.0 },
  { cat: 1, name: 'DoorDash', min: 10.0, max: 25.0 },
  { cat: 2, name: "McDonald's", min: 5.0, max: 12.0 },
  { cat: 2, name: 'Chick-fil-A', min: 7.0, max: 14.0 },
  // NOTE: Netflix and Spotify are NOT in this random pool.
  // They are added separately in loadDemoData() as clean
  // monthly charges so subscription detection can find them.
  { cat: 4, name: 'App Store', min: 0.99, max: 9.99 },
  { cat: 4, name: 'Steam', min: 4.99, max: 29.99 },
  { cat: 5, name: 'Vending Machine', min: 1.5, max: 3.5 },
  { cat: 5, name: 'Corner Store', min: 2.0, max: 6.0 },
  { cat: 6, name: 'Amazon', min: 8.0, max: 45.0 },
  { cat: 6, name: 'Target', min: 5.0, max: 35.0 },
  { cat: 7, name: 'Misc', min: 2.0, max: 20.0 },
];

// Notes we randomly pick for purchases.
const DEMO_NOTES = [
  'Morning pick-me-up',
  'Study snack',
  'Late night order',
  'Weekly treat',
  'Game purchase',
  'Quick bite',
  'Stocking up',
  '',
  '',
  '',
];

// ------------------------------------------------------------
// randomBetween(min, max) returns a random number between
// min and max, rounded to 2 decimals.
// ------------------------------------------------------------
function randomBetween(min, max) {
  const raw = min + Math.random() * (max - min);
  return roundMoney(raw);
}

// ------------------------------------------------------------
// pickRandom(arr) returns a random element from an array.
// ------------------------------------------------------------
function pickRandom(arr) {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

// ------------------------------------------------------------
// loadDemoData() fills storage with about 60 realistic
// purchases spread over the last 3 months, plus default
// categories and 2 recurring subscriptions.
// It also sets a few categories to "watch" and sets limits.
// ------------------------------------------------------------
export function loadDemoData() {
  // Start fresh with default categories.
  const cats = makeDefaultCategories();
  saveCategories(cats);

  // Set some monthly limits and watch flags.
  setCategoryLimit(cats[0].id, 60); // Coffee
  setCategoryLimit(cats[1].id, 120); // Food Delivery
  setCategoryLimit(cats[2].id, 80); // Fast Food
  setCategoryLimit(cats[3].id, 40); // Subscriptions
  setCategoryLimit(cats[4].id, 50); // In-App/Gaming
  toggleWatch(cats[0].id); // watch Coffee
  toggleWatch(cats[1].id); // watch Food Delivery
  toggleWatch(cats[4].id); // watch In-App/Gaming

  // Reload categories so the watch and limit changes are in memory.
  const updatedCats = loadCategories();

  const purchases = [];
  const today = todayString();

  // Add the 2 recurring subscriptions first.
  // Same merchant and same amount, about every 30 days.
  const subMerchants = [
    { cat: updatedCats[3], merchant: 'Netflix', amount: 15.49, note: 'Monthly subscription' },
    { cat: updatedCats[3], merchant: 'Spotify', amount: 11.99, note: 'Monthly subscription' },
  ];

  for (let s = 0; s < subMerchants.length; s++) {
    const sub = subMerchants[s];
    // Add a subscription charge every ~30 days for 3 months.
    for (let m = 0; m < 3; m++) {
      const dateStr = addDaysToDate(today, -(m * 30 + 5));
      purchases.push({
        id: makeId(),
        amount: sub.amount,
        category: sub.cat.id,
        date: dateStr,
        note: sub.note,
        merchant: sub.merchant,
      });
    }
  }

  // Now add about 58 more random purchases over 90 days.
  // We loop until we have roughly 60 total.
  let target = 60 - purchases.length;

  for (let i = 0; i < target; i++) {
    // Pick a random merchant entry.
    const entry = pickRandom(DEMO_MERCHANTS);
    // Find the category object by index.
    const cat = updatedCats[entry.cat];
    // Pick a random day in the last 90 days.
    const daysAgo = Math.floor(Math.random() * 90);
    const dateStr = addDaysToDate(today, -daysAgo);

    purchases.push({
      id: makeId(),
      amount: randomBetween(entry.min, entry.max),
      category: cat.id,
      date: dateStr,
      note: pickRandom(DEMO_NOTES),
      merchant: entry.name,
    });
  }

  savePurchases(purchases);
}

// ============================================================
// CLEAR ALL DATA
// ============================================================

// ------------------------------------------------------------
// clearAllData() removes every Drip key from localStorage.
// It re-creates default categories so the app is not empty.
// ------------------------------------------------------------
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.purchases);
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.categories);
  } catch (err) {
    // Ignore — we did our best.
  }
  // Re-create default categories and settings.
  saveCategories(makeDefaultCategories());
  saveSettings(Object.assign({}, DEFAULT_SETTINGS));
}
