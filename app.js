// ============================================================
// app.js
// Controls the user interface for Drip.
// Imports data functions from data.js and wires them to
// the HTML elements in index.html.
// ============================================================

import {
  loadCategories,
  saveCategories,
  addCategory,
  renameCategory,
  deleteCategory,
  setCategoryLimit,
  toggleWatch,
  getCategoryById,
  loadPurchases,
  addPurchase,
  deletePurchase,
  getPurchasesThisMonth,
  getPurchasesByCategory,
  getRecentPurchases,
  sortPurchasesByDate,
  sumAmounts,
  hoursWorked,
  loadSettings,
  saveSettings,
  loadTheme,
  saveTheme,
  loadDemoData,
  clearAllData,
  todayString,
  isValidDate,
  isFutureDate,
  roundMoney,
  currentMonthKey,
  monthKey,
  getBudgetLeftAfter,
  getPercentOfLimit,
  calcHabitCost,
  getRecentAmountsForCategory,
  addMoneySaved,
  daysLeftInMonth,
  safeToSpendPerDay,
  getSafeToSpendPerDay,
  detectSubscriptions,
  getTotalYearlySubscriptions,
  findDuplicateCategory,
  findDuplicatePurchase,
  percentUsed,
  getStatus,
  projectMonthEnd,
  daysInMonth,
  getPurchasesSince,
} from './data.js';

// We keep the current view name here so we know which tab is active.
let currentView = 'dashboard';

// We keep the current filter for the purchases table here.
let purchaseFilter = 'all';

// Which time range the Spending by Category card shows.
// One of: today, month, 3months, 6months, year.
let categoryRange = 'month';

// How many recent purchases the dashboard card shows.
// A number, or 'all' for every purchase.
let recentCount = 5;

// We store the pending purchase here during an impulse check.
let pendingPurchase = null;

// ============================================================
// HELPERS — small functions that make rendering easier
// ============================================================

// ------------------------------------------------------------
// $(id) is a shortcut for document.getElementById(id).
// It returns the element or null if not found.
// ------------------------------------------------------------
function $(id) {
  return document.getElementById(id);
}

// ------------------------------------------------------------
// formatMoney(amount, currency) turns a number into a string
// like "$12.50". It always shows 2 decimal places.
// ------------------------------------------------------------
function formatMoney(amount, currency) {
  const sym = currency || '$';
  const num = Number(amount).toFixed(2);
  return sym + num;
}

// ------------------------------------------------------------
// escapeHTML(str) replaces special characters so user input
// cannot break the HTML. This prevents XSS issues.
// ------------------------------------------------------------
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ------------------------------------------------------------
// showSuccess(spanId, message) shows a success message in a
// green span, then hides it after 2 seconds.
// ------------------------------------------------------------
function showSuccess(spanId, message) {
  const span = $(spanId);
  if (!span) return;
  span.textContent = message;
  span.classList.add('show');
  setTimeout(function () {
    span.classList.remove('show');
    span.textContent = '';
  }, 2000);
}

// ------------------------------------------------------------
// setError(spanId, message) shows or clears an inline error.
// If message is empty, the error is cleared.
// ------------------------------------------------------------
function setError(spanId, message) {
  const span = $(spanId);
  if (!span) return;
  span.textContent = message || '';
}

// ============================================================
// NAVIGATION — switching between tabs/views
// ============================================================

// ------------------------------------------------------------
// switchView(viewName) hides all views, shows the one we want,
// and updates the tab buttons and bottom-nav buttons to mark
// the active one. Nothing reloads the page.
// ------------------------------------------------------------
function switchView(viewName) {
  currentView = viewName;

  // Hide every view section.
  const views = document.querySelectorAll('.view');
  for (let i = 0; i < views.length; i++) {
    views[i].classList.remove('active');
  }

  // Show the one we want.
  const target = $('view-' + viewName);
  if (target) {
    target.classList.add('active');
  }

  // Update top tab buttons.
  updateNavButtons('.tab', viewName);

  // Update bottom nav buttons (phones).
  updateNavButtons('.nav-item', viewName);

  // Re-render the view's content so it is always up to date.
  renderView(viewName);
}

// ------------------------------------------------------------
// updateNavButtons(selector, viewName) marks the one button
// matching viewName as active and clears the rest.
// Used for both the top tabs and the bottom nav.
// ------------------------------------------------------------
function updateNavButtons(selector, viewName) {
  const buttons = document.querySelectorAll(selector);
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active');
    if (buttons[i].getAttribute('data-view') === viewName) {
      buttons[i].classList.add('active');
    }
  }
}

// ------------------------------------------------------------
// renderView(viewName) calls the right render function for
// the current view.
// ------------------------------------------------------------
function renderView(viewName) {
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'add') {
    renderCategorySelect('f-category');
    // Set the date field to today by default.
    const dateField = $('f-date');
    if (dateField) dateField.value = todayString();
  } else if (viewName === 'categories') {
    renderCategoriesList();
  } else if (viewName === 'purchases') {
    renderPurchasesTable();
  } else if (viewName === 'subscriptions') {
    renderSubscriptions();
  } else if (viewName === 'settings') {
    renderSettingsForm();
  }
}

// ------------------------------------------------------------
// initTabs() adds click handlers to the top tab buttons and
// the bottom nav buttons. Both switch views without reloading.
// ------------------------------------------------------------
function initTabs() {
  // Top tabs.
  const tabs = document.querySelectorAll('.tab');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      const view = tabs[i].getAttribute('data-view');
      switchView(view);
    });
  }

  // Bottom nav (phones).
  const navItems = document.querySelectorAll('.nav-item');
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function () {
      const view = navItems[i].getAttribute('data-view');
      switchView(view);
    });
  }
}

// ------------------------------------------------------------
// initBottomNavSlide() makes the phone-only bottom nav slide
// up into view once the user scrolls past the top menus
// (header + tabs), and slide away when they are back in view.
// Uses IntersectionObserver so it works without scroll math.
// ------------------------------------------------------------
function initBottomNavSlide() {
  const bottomNav = $('bottom-nav');
  const tabs = $('tabs');
  if (!bottomNav || !tabs) return;

  // This only matters on phones, where the bottom nav shows.
  if (window.matchMedia('(min-width: 640px)').matches) return;

  const observer = new IntersectionObserver(
    function (entries) {
      // isIntersecting is true when the tabs are on screen.
      // No tabs visible = bottom nav slides up.
      bottomNav.classList.toggle('visible', !entries[0].isIntersecting);
    },
    // Fire as soon as the tabs fully leave the viewport.
    { threshold: 0 }
  );

  observer.observe(tabs);
}

// ============================================================
// CATEGORY DROPDOWN — used by the Add Purchase form and filter
// ============================================================

// ------------------------------------------------------------
// renderCategorySelect(selectId) fills a <select> element with
// all categories as <option> tags.
// ------------------------------------------------------------
function renderCategorySelect(selectId) {
  const select = $(selectId);
  if (!select) return;
  const cats = loadCategories();

  // Build the options HTML.
  let html = '<option value="">Select a category…</option>';
  for (let i = 0; i < cats.length; i++) {
    html +=
      '<option value="' + cats[i].id + '">' +
      escapeHTML(cats[i].name) +
      '</option>';
  }
  select.innerHTML = html;
}

// ============================================================
// DASHBOARD
// ============================================================

// ------------------------------------------------------------
// renderDashboard() fills the dashboard view with summary
// cards, category spending bars, and recent purchases.
// ------------------------------------------------------------
function renderDashboard() {
  const settings = loadSettings();
  const cats = loadCategories();
  const thisMonthPurchases = getPurchasesThisMonth();
  const totalThisMonth = sumAmounts(thisMonthPurchases);

  // Purchases in the selected time range (for the category card).
  const rangedPurchases = getPurchasesForRange(categoryRange);
  const totalRanged = sumAmounts(rangedPurchases);

  // --- Summary cards ---
  const cardsEl = $('summary-cards');
  if (!cardsEl) return;

  // Work out each category's spending status using the pure
  // helpers. Exactly 100% counts as "over".
  let overCount = 0;
  let warningCount = 0;
  for (let i = 0; i < cats.length; i++) {
    if (cats[i].monthlyLimit > 0) {
      const spent = sumAmounts(
        thisMonthPurchases.filter(function (p) {
          return p.category === cats[i].id;
        })
      );
      const status = getStatus(percentUsed(spent, cats[i].monthlyLimit));
      if (status === 'over') overCount++;
      if (status === 'warning') warningCount++;
    }
  }

  // Month-end projection for ALL categories combined.
  const totalProjected = projectMonthEnd(
    totalThisMonth,
    daysInMonth() - daysLeftInMonth(),
    daysInMonth()
  );

  // Safe-to-spend per day.
  const safeDaily = getSafeToSpendPerDay();
  const daysLeft = daysLeftInMonth();

  // Build the summary cards.
  cardsEl.innerHTML =
    buildSummaryCard('Spent This Month', formatMoney(totalThisMonth, settings.currency), settings.currency) +
    buildSummaryCard(
      'Over Limit',
      String(overCount),
      overCount === 0 ? 'categories' : overCount + ' categor' + (overCount === 1 ? 'y' : 'ies'),
      overCount > 0 ? 'warn' : ''
    ) +
    buildSummaryCard(
      'Safe to Spend/Day',
      formatMoney(safeDaily, settings.currency),
      daysLeft + ' days left in month'
    ) +
    buildSummaryCard('Total Purchases', String(loadPurchases().length), 'all time') +
    buildSummaryCard(
      'Money Saved',
      formatMoney(settings.moneySaved || 0, settings.currency),
      'by skipping impulse buys'
    ) +
    buildSummaryCard(
      'Projected Month End',
      formatMoney(totalProjected, settings.currency),
      'at current pace'
    );

  // --- Alert banner (warnings and over-limit alerts) ---
  renderAlertBanner(cats, thisMonthPurchases, settings.currency);

  // --- Category bars (uses the selected time range) ---
  renderDashboardCategories(cats, rangedPurchases, settings.currency);

  // --- Recent purchases (uses the selected count) ---
  renderRecentPurchases(settings.currency);
}

// ------------------------------------------------------------
// getPurchasesForRange(rangeKey) returns the purchases for a
// named time range: today, month, 3months, 6months, or year.
// ------------------------------------------------------------
function getPurchasesForRange(rangeKey) {
  if (rangeKey === 'today') return getPurchasesSince(0);
  if (rangeKey === 'month') return getPurchasesThisMonth();
  if (rangeKey === '3months') return getPurchasesSince(89);
  if (rangeKey === '6months') return getPurchasesSince(182);
  if (rangeKey === 'year') return getPurchasesSince(364);
  return loadPurchases();
}

// ------------------------------------------------------------
// renderAlertBanner(cats, monthPurchases, currency) shows a
// banner at the top of the dashboard: red for categories at
// 100%+ of their limit, yellow for categories at 80-99%.
// Hidden when no category is in either state.
// ------------------------------------------------------------
function renderAlertBanner(cats, monthPurchases, currency) {
  const bannerEl = $('alert-banner');
  if (!bannerEl) return;

  // Collect warning and over-limit category names.
  const warnings = [];
  const overs = [];

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    if (cat.monthlyLimit <= 0) continue;
    const spent = sumAmounts(
      monthPurchases.filter(function (p) {
        return p.category === cat.id;
      })
    );
    const pct = percentUsed(spent, cat.monthlyLimit);
    const status = getStatus(pct);
    if (status === 'over') {
      overs.push(cat.name + ' (' + Math.round(pct) + '%)');
    } else if (status === 'warning') {
      warnings.push(cat.name + ' (' + Math.round(pct) + '%)');
    }
  }

  let html = '';
  if (overs.length > 0) {
    html +=
      '<div class="alert alert-danger" role="alert">' +
      '<strong>Over budget:</strong> ' + escapeHTML(overs.join(', ')) +
      '</div>';
  }
  if (warnings.length > 0) {
    html +=
      '<div class="alert alert-warning" role="alert">' +
      '<strong>Close to limit:</strong> ' + escapeHTML(warnings.join(', ')) +
      '</div>';
  }

  // No alerts — hide the banner entirely.
  bannerEl.innerHTML = html;
  bannerEl.classList.toggle('hidden', html === '');
}

// ------------------------------------------------------------
// buildSummaryCard(label, value, sub, extraClass) returns
// the HTML string for one summary card.
// ------------------------------------------------------------
function buildSummaryCard(label, value, sub, extraClass) {
  const cls = extraClass ? 'summary-value ' + extraClass : 'summary-value';
  return (
    '<div class="summary-card">' +
    '<div class="summary-label">' + escapeHTML(label) + '</div>' +
    '<div class="' + cls + '">' + escapeHTML(value) + '</div>' +
    '<div class="summary-sub">' + escapeHTML(sub || '') + '</div>' +
    '</div>'
  );
}

// ------------------------------------------------------------
// renderDashboardCategories(cats, monthPurchases, currency)
// builds the spending-by-category bars for the dashboard.
// Each bar shows how much was spent vs the monthly limit.
// ------------------------------------------------------------
function renderDashboardCategories(cats, monthPurchases, currency) {
  const container = $('dashboard-categories');
  if (!container) return;

  let html = '';

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    // Find this category's purchases in the selected range.
    const catPurchases = monthPurchases.filter(function (p) {
      return p.category === cat.id;
    });
    const spent = sumAmounts(catPurchases);
    const limit = cat.monthlyLimit;

    // Figure out the bar color and width using getStatus.
    // Exactly 100% now counts as "over" (red).
    let fillClass = 'ok';
    let fillWidth = 0;
    let projectionText = '';

    // Status colors and projection only make sense against a
    // monthly limit, so we compare this month's spending.
    const thisMonthCatPurchases = getPurchasesThisMonth().filter(function (p) {
      return p.category === cat.id;
    });
    const monthSpent = sumAmounts(thisMonthCatPurchases);

    if (limit > 0) {
      const pct = percentUsed(monthSpent, limit);
      fillWidth = Math.min(pct, 100);
      const status = getStatus(pct);
      if (status === 'over') {
        fillClass = 'over';
      } else if (status === 'warning') {
        fillClass = 'warn';
      }

      // Project this category's month-end total at current pace.
      const daysElapsed = daysInMonth() - daysLeftInMonth();
      const projected = projectMonthEnd(monthSpent, daysElapsed, daysInMonth());
      projectionText = ' · projected ' + formatMoney(projected, currency);
    } else {
      // No limit set — show a short blue bar.
      fillClass = '';
      fillWidth = Math.min(spent, 100) > 0 ? 8 : 0;
    }

    const watchBadge = cat.watch ? '<span class="watch-badge">Watching</span>' : '';
    const limitText = limit > 0
      ? formatMoney(spent, currency) + ' / ' + formatMoney(limit, currency) + projectionText
      : formatMoney(spent, currency) + ' · no limit';

    const fillHtml = fillClass
      ? '<div class="cat-bar-fill ' + fillClass + '" style="width:' + fillWidth + '%"></div>'
      : '<div class="cat-bar-fill cat-bar-nolimit" style="width:' + fillWidth + '%"></div>';

    html +=
      '<div class="cat-bar-row">' +
      '<div class="cat-bar-top">' +
      '<span class="cat-bar-name">' + escapeHTML(cat.name) + watchBadge + '</span>' +
      '<span class="cat-bar-amount">' + escapeHTML(limitText) + '</span>' +
      '</div>' +
      '<div class="cat-bar-track">' + fillHtml + '</div>' +
      '</div>';
  }

  if (cats.length === 0) {
    html = '<p class="empty-state">No categories yet. Add some in the Categories tab.</p>';
  }

  container.innerHTML = html;
}

// ------------------------------------------------------------
// initDashboardControls() wires up the two dashboard dropdowns:
// the Spending by Category time range and the Recent Purchases
// count. Changing either re-renders the dashboard right away.
// ------------------------------------------------------------
function initDashboardControls() {
  const rangeSelect = $('range-select');
  const countSelect = $('recent-count');

  if (rangeSelect) {
    rangeSelect.addEventListener('change', function () {
      categoryRange = rangeSelect.value;
      renderDashboard();
    });
  }

  if (countSelect) {
    countSelect.addEventListener('change', function () {
      recentCount = countSelect.value === 'all' ? 'all' : Number(countSelect.value);
      renderDashboard();
    });
  }
}

// ------------------------------------------------------------
// renderRecentPurchases(currency) shows the most recent
// purchases in the dashboard's right-side card, using the
// count chosen in the dropdown (5, 10, 25, or all).
// ------------------------------------------------------------
function renderRecentPurchases(currency) {
  const list = $('dashboard-recent');
  if (!list) return;

  // Use the selected count: a number, or everything for 'all'.
  const recent = recentCount === 'all'
    ? sortPurchasesByDate(loadPurchases())
    : getRecentPurchases(Number(recentCount));
  const cats = loadCategories();

  if (recent.length === 0) {
    list.innerHTML = '<p class="empty-state">No purchases yet.</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < recent.length; i++) {
    const p = recent[i];
    const cat = getCategoryById(p.category);
    const catName = cat ? cat.name : 'Unknown';
    const merchant = p.merchant || catName;

    html +=
      '<li class="recent-item">' +
      '<div class="recent-info">' +
      '<span class="recent-merchant">' + escapeHTML(merchant) + '</span>' +
      '<span class="recent-meta">' + escapeHTML(p.date) + ' · ' + escapeHTML(catName) + '</span>' +
      '</div>' +
      '<span class="recent-amount">' + formatMoney(p.amount, currency) + '</span>' +
      '</li>';
  }

  list.innerHTML = html;
}

// ============================================================
// ADD PURCHASE FORM + IMPULSE CHECK
// ============================================================

// ------------------------------------------------------------
// initAddPurchaseForm() wires up the form's submit handler
// and does all the validation when the user clicks Add.
// If the category is "watched," it shows the impulse check
// panel instead of saving right away.
// ------------------------------------------------------------
function initAddPurchaseForm() {
  const form = $('add-purchase-form');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    // Stop the page from reloading.
    event.preventDefault();

    // Read the field values.
    const amountStr = $('f-amount').value;
    const categoryId = $('f-category').value;
    const dateStr = $('f-date').value;
    const note = $('f-note').value;
    const merchant = $('f-merchant').value;

    // Clear old errors.
    setError('err-amount', '');
    setError('err-category', '');
    setError('err-date', '');

    let hasError = false;

    // Validate amount: must be a number greater than 0.
    const amountNum = Number(amountStr);
    if (amountStr === '' || isNaN(amountNum)) {
      setError('err-amount', 'Enter a number.');
      hasError = true;
    } else if (amountNum <= 0) {
      setError('err-amount', 'Amount must be greater than 0.');
      hasError = true;
    }

    // Validate category: required.
    if (!categoryId) {
      setError('err-category', 'Pick a category.');
      hasError = true;
    }

    // Validate date: must be valid and not in the future.
    if (!dateStr) {
      setError('err-date', 'Enter a date.');
      hasError = true;
    } else if (!isValidDate(dateStr)) {
      setError('err-date', 'That is not a valid date.');
      hasError = true;
    } else if (isFutureDate(dateStr)) {
      setError('err-date', 'Date cannot be in the future.');
      hasError = true;
    }

    if (hasError) return;

    // Build the purchase we are about to save.
    const newPurchase = {
      amount: roundMoney(amountNum),
      category: categoryId,
      date: dateStr,
      note: note,
      merchant: merchant,
    };

    // Duplicate check: same amount, merchant, and date.
    const duplicate = findDuplicatePurchase(
      newPurchase.amount,
      newPurchase.merchant,
      newPurchase.date,
      loadPurchases()
    );
    if (duplicate) {
      const ok = confirm('This looks like a duplicate. Save anyway?');
      if (!ok) return;
    }

    // Check if this category is "watched."
    const cat = getCategoryById(categoryId);
    if (cat && cat.watch) {
      // Show the impulse check panel instead of saving.
      pendingPurchase = newPurchase;
      showImpulseCheck(pendingPurchase);
      return;
    }

    // Not a watched category — save the purchase right away.
    savePendingPurchase();
  });
}

// ------------------------------------------------------------
// savePendingPurchase() saves the purchase stored in
// pendingPurchase, resets the form, and shows a success message.
// ------------------------------------------------------------
function savePendingPurchase() {
  if (!pendingPurchase) return;

  addPurchase({
    amount: pendingPurchase.amount,
    category: pendingPurchase.category,
    date: pendingPurchase.date,
    note: pendingPurchase.note,
    merchant: pendingPurchase.merchant,
  });

  // Reset the form and show a success message.
  const form = $('add-purchase-form');
  form.reset();
  $('f-date').value = todayString();
  showSuccess('add-success', 'Purchase added!');

  // Re-render the category dropdown in case it changed.
  renderCategorySelect('f-category');

  // Clear the pending purchase and hide the impulse panel.
  pendingPurchase = null;
  hideImpulseCheck();

  // Go back to the dashboard so the new totals show right away.
  switchView('dashboard');
}

// ------------------------------------------------------------
// showImpulseCheck(data) builds and shows the impulse check
// panel with budget left, percent of limit, habit cost, and
// work hours.
// ------------------------------------------------------------
function showImpulseCheck(data) {
  const panel = $('impulse-panel');
  const content = $('impulse-content');
  if (!panel || !content) return;

  const settings = loadSettings();
  const cat = getCategoryById(data.category);
  const catName = cat ? cat.name : 'this category';

  // Calculate budget left after this purchase.
  const budgetLeft = getBudgetLeftAfter(data.category, data.amount);

  // Calculate percent of limit.
  const pct = getPercentOfLimit(data.category, data.amount);

  // Calculate habit cost from recent purchases.
  const recentAmounts = getRecentAmountsForCategory(data.category, data.date);
  const habitCost = calcHabitCost(recentAmounts, data.amount);

  // Calculate work hours if hourly wage is set.
  const workHours = hoursWorked(data.amount, settings.hourlyWage);

  // Build the panel HTML.
  let html = '';

  // Budget left.
  if (budgetLeft !== null) {
    const leftClass = budgetLeft < 0 ? 'impulse-stat-value danger' : 'impulse-stat-value';
    html +=
      '<div class="impulse-stat">' +
      '<span class="impulse-stat-label">Budget left after this</span>' +
      '<span class="' + leftClass + '">' + formatMoney(budgetLeft, settings.currency) + '</span>' +
      '</div>';
  }

  // Percent of limit.
  if (pct !== null) {
    html +=
      '<div class="impulse-stat">' +
      '<span class="impulse-stat-label">% of monthly limit</span>' +
      '<span class="impulse-stat-value">' + pct + '%</span>' +
      '</div>';
  }

  // Habit cost.
  html +=
    '<div class="impulse-stat">' +
    '<span class="impulse-stat-label">Yearly cost if this becomes a habit</span>' +
    '<span class="impulse-stat-value warn">' + formatMoney(habitCost, settings.currency) + '</span>' +
    '</div>';

  // Work hours.
  if (workHours !== null) {
    html +=
      '<div class="impulse-stat">' +
      '<span class="impulse-stat-label">Work hours this costs</span>' +
      '<span class="impulse-stat-value">' + workHours + ' hrs</span>' +
      '</div>';
  }

  // Amount summary.
  html +=
    '<div class="impulse-summary">' +
    'You are about to log ' +
    '<strong>' + formatMoney(data.amount, settings.currency) + '</strong>' +
    ' in <strong>' + escapeHTML(catName) + '</strong>' +
    (data.merchant ? ' at <strong>' + escapeHTML(data.merchant) + '</strong>' : '') +
    '.</div>';

  content.innerHTML = html;
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ------------------------------------------------------------
// hideImpulseCheck() hides the impulse check panel.
// ------------------------------------------------------------
function hideImpulseCheck() {
  const panel = $('impulse-panel');
  if (panel) panel.classList.add('hidden');
}

// ------------------------------------------------------------
// initImpulseCheck() wires up the "Log it anyway" and
// "Skip it" buttons on the impulse check panel.
// ------------------------------------------------------------
function initImpulseCheck() {
  const logBtn = $('impulse-log');
  const skipBtn = $('impulse-skip');

  if (logBtn) {
    logBtn.addEventListener('click', function () {
      savePendingPurchase();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', function () {
      // Add the amount to the "money saved" counter.
      if (pendingPurchase) {
        addMoneySaved(pendingPurchase.amount);
        const form = $('add-purchase-form');
        form.reset();
        $('f-date').value = todayString();
        showSuccess('add-success', 'Skipped it! Money saved.');
      }
      pendingPurchase = null;
      hideImpulseCheck();
    });
  }
}

// ============================================================
// CATEGORIES SCREEN
// ============================================================

// ------------------------------------------------------------
// initAddCategoryForm() wires up the "Add Category" form.
// Validates the name is not empty, then saves it.
// ------------------------------------------------------------
function initAddCategoryForm() {
  const form = $('add-category-form');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = $('c-name').value.trim();
    const limitStr = $('c-limit').value;

    setError('err-cname', '');

    if (!name) {
      setError('err-cname', 'Enter a category name.');
      return;
    }

    // Duplicate check: same name (ignoring capitalization).
    const duplicateCat = findDuplicateCategory(name, loadCategories());
    if (duplicateCat) {
      setError('err-cname', '"' + duplicateCat.name + '" already exists.');
      return;
    }

    const limitNum = limitStr ? Number(limitStr) : 0;

    addCategory(name, limitNum);

    form.reset();
    showSuccess('cat-success', 'Category added!');
    renderCategoriesList();
  });
}

// ------------------------------------------------------------
// renderCategoriesList() builds the list of categories with
// their limits, watch toggles, rename, and delete buttons.
// ------------------------------------------------------------
function renderCategoriesList() {
  const container = $('categories-list');
  if (!container) return;

  const cats = loadCategories();
  const settings = loadSettings();

  if (cats.length === 0) {
    container.innerHTML = '<p class="empty-state">No categories yet. Add one above.</p>';
    return;
  }

  let html = '';

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];

    const limitText = cat.monthlyLimit > 0
      ? formatMoney(cat.monthlyLimit, settings.currency) + ' / mo'
      : 'No limit';

    html +=
      '<div class="cat-row" data-id="' + cat.id + '">' +
      '<div class="cat-row-info">' +
      '<div class="cat-row-name">' + escapeHTML(cat.name) + '</div>' +
      '<div class="cat-row-limit">' + escapeHTML(limitText) + '</div>' +
      '</div>' +
      '<div class="cat-row-edit">' +
      '<input type="number" step="0.01" min="0" class="limit-input" placeholder="Limit" value="' +
      (cat.monthlyLimit > 0 ? cat.monthlyLimit : '') + '" />' +
      '<button class="btn btn-secondary btn-sm btn-set-limit" type="button">Set</button>' +
      '<button class="btn btn-secondary btn-sm btn-rename" type="button">Rename</button>' +
      '<button class="btn-icon danger btn-delete" type="button" aria-label="Delete">✕</button>' +
      '</div>' +
      '<label class="toggle" title="Watch this category">' +
      '<input type="checkbox" class="watch-toggle" ' + (cat.watch ? 'checked' : '') + ' />' +
      '<span class="toggle-slider"></span>' +
      '</label>' +
      '</div>';
  }

  container.innerHTML = html;

  // Now wire up the buttons inside each row.
  attachCategoryHandlers();
}

// ------------------------------------------------------------
// attachCategoryHandlers() finds every button inside the
// categories list and adds click/change handlers.
// We read the parent row's data-id to know which category
// the user is editing.
// ------------------------------------------------------------
function attachCategoryHandlers() {
  const rows = document.querySelectorAll('.cat-row');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const catId = row.getAttribute('data-id');

    // Set limit button.
    const setBtn = row.querySelector('.btn-set-limit');
    if (setBtn) {
      setBtn.addEventListener('click', function () {
        const input = row.querySelector('.limit-input');
        const val = Number(input.value);
        if (!isNaN(val) && val >= 0) {
          setCategoryLimit(catId, val);
          renderCategoriesList();
        }
      });
    }

    // Rename button — turns the name into an editable input.
    const renameBtn = row.querySelector('.btn-rename');
    if (renameBtn) {
      renameBtn.addEventListener('click', function () {
        const nameEl = row.querySelector('.cat-row-name');
        const oldName = nameEl.textContent;
        nameEl.innerHTML =
          '<input type="text" class="rename-input" value="' +
          escapeHTML(oldName) + '" />';
        const input = nameEl.querySelector('.rename-input');
        input.focus();
        input.select();

        // Save when the user presses Enter or leaves the field.
        function saveRename() {
          const newName = input.value.trim();
          if (newName) {
            renameCategory(catId, newName);
          }
          renderCategoriesList();
        }

        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
          }
        });
      });
    }

    // Delete button.
    const delBtn = row.querySelector('.btn-delete');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        const cat = getCategoryById(catId);
        const catName = cat ? cat.name : 'this category';
        const ok = confirm(
          'Delete "' + catName + '"? This also removes all purchases in this category.'
        );
        if (ok) {
          deleteCategory(catId);
          renderCategoriesList();
        }
      });
    }

    // Watch toggle.
    const watchCheckbox = row.querySelector('.watch-toggle');
    if (watchCheckbox) {
      watchCheckbox.addEventListener('change', function () {
        toggleWatch(catId);
      });
    }
  }
}

// ============================================================
// PURCHASES TABLE
// ============================================================

// ------------------------------------------------------------
// initPurchasesFilter() fills the filter dropdown and handles
// changes to it.
// ------------------------------------------------------------
function initPurchasesFilter() {
  const select = $('filter-category');
  if (!select) return;

  // Fill it with categories.
  const cats = loadCategories();
  let html = '<option value="all">All categories</option>';
  for (let i = 0; i < cats.length; i++) {
    html +=
      '<option value="' + cats[i].id + '">' +
      escapeHTML(cats[i].name) +
      '</option>';
  }
  select.innerHTML = html;

  select.addEventListener('change', function () {
    purchaseFilter = select.value;
    renderPurchasesTable();
  });
}

// ------------------------------------------------------------
// renderPurchasesTable() fills the purchases table with rows.
// If a filter is selected, only matching purchases are shown.
// ------------------------------------------------------------
function renderPurchasesTable() {
  const tbody = $('purchases-body');
  const emptyMsg = $('purchases-empty');
  const filterSelect = $('filter-category');

  if (!tbody) return;

  // Make sure the filter dropdown is populated.
  if (filterSelect && filterSelect.options.length <= 1) {
    initPurchasesFilter();
  }

  const settings = loadSettings();
  let purchases = loadPurchases();

  // Apply filter if one is selected.
  if (purchaseFilter !== 'all') {
    purchases = purchases.filter(function (p) {
      return p.category === purchaseFilter;
    });
  }

  // Sort newest first.
  purchases = sortPurchasesByDate(purchases);

  if (purchases.length === 0) {
    tbody.innerHTML = '';
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');

  let html = '';
  for (let i = 0; i < purchases.length; i++) {
    const p = purchases[i];
    const cat = getCategoryById(p.category);
    const catName = cat ? cat.name : 'Unknown';

    html +=
      '<tr data-id="' + p.id + '">' +
      '<td>' + escapeHTML(p.date) + '</td>' +
      '<td>' + escapeHTML(catName) + '</td>' +
      '<td>' + escapeHTML(p.merchant || '—') + '</td>' +
      '<td>' + escapeHTML(p.note || '—') + '</td>' +
      '<td class="ta-right">' + formatMoney(p.amount, settings.currency) + '</td>' +
      '<td><button class="btn-icon danger btn-del-purchase" type="button">✕</button></td>' +
      '</tr>';
  }

  tbody.innerHTML = html;

  // Wire up delete buttons.
  const delBtns = tbody.querySelectorAll('.btn-del-purchase');
  for (let i = 0; i < delBtns.length; i++) {
    delBtns[i].addEventListener('click', function () {
      const row = delBtns[i].closest('tr');
      const id = row.getAttribute('data-id');
      deletePurchase(id);
      renderPurchasesTable();
    });
  }
}

// ============================================================
// SUBSCRIPTIONS SCREEN
// ============================================================

// ------------------------------------------------------------
// renderSubscriptions() detects subscriptions from all
// purchases and displays them with monthly cost, yearly cost,
// next expected date, and a total yearly subscription cost.
// ------------------------------------------------------------
function renderSubscriptions() {
  const list = $('subscriptions-list');
  const totalEl = $('subscriptions-total');
  if (!list || !totalEl) return;

  const settings = loadSettings();
  const purchases = loadPurchases();
  const subs = detectSubscriptions(purchases);

  if (subs.length === 0) {
    list.innerHTML =
      '<p class="empty-state">No subscriptions detected. ' +
      'Subscriptions are 2+ charges from the same merchant, ' +
      'similar amounts (within 10%), about 30 days apart.</p>';
    totalEl.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    html +=
      '<div class="sub-row">' +
      '<div class="sub-info">' +
      '<div class="sub-merchant">' + escapeHTML(sub.merchant) + '</div>' +
      '<div class="sub-meta">' +
      sub.chargeCount + ' charges · next ~' + escapeHTML(sub.nextExpectedDate) +
      '</div>' +
      '</div>' +
      '<div class="sub-costs">' +
      '<div class="sub-cost-line">' +
      '<span class="sub-cost-label">Monthly</span>' +
      '<span class="sub-cost-value">' + formatMoney(sub.monthlyCost, settings.currency) + '</span>' +
      '</div>' +
      '<div class="sub-cost-line">' +
      '<span class="sub-cost-label">Yearly</span>' +
      '<span class="sub-cost-value">' + formatMoney(sub.yearlyCost, settings.currency) + '</span>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  list.innerHTML = html;

  // Show the total yearly cost.
  const totalYearly = getTotalYearlySubscriptions(subs);
  totalEl.innerHTML =
    '<div class="sub-total">' +
    '<span class="sub-total-label">Total yearly subscription cost</span>' +
    '<span class="sub-total-value">' + formatMoney(totalYearly, settings.currency) + '</span>' +
    '</div>';
}

// ============================================================
// SETTINGS
// ============================================================

// ------------------------------------------------------------
// renderSettingsForm() loads the current settings and fills
// the settings form fields.
// ------------------------------------------------------------
function renderSettingsForm() {
  const s = loadSettings();
  $('s-wage').value = s.hourlyWage ? s.hourlyWage : '';
  $('s-currency').value = s.currency || '$';
  $('s-goal').value = s.savingsGoal != null ? s.savingsGoal : '';
}

// ------------------------------------------------------------
// initSettingsForm() saves settings when the user submits.
// ------------------------------------------------------------
// ------------------------------------------------------------
// initSettingsForm() saves settings when the user submits.
// It validates the hourly wage is 0 or more before saving.
// ------------------------------------------------------------
function initSettingsForm() {
  const form = $('settings-form');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const wageStr = $('s-wage').value;
    const currency = $('s-currency').value || '$';
    const goalStr = $('s-goal').value;

    setError('err-wage', '');

    // Validate hourly wage: must be 0 or more (blank counts as 0).
    const wage = wageStr ? roundMoney(Number(wageStr)) : 0;
    if (wageStr !== '' && (isNaN(wage) || wage < 0)) {
      setError('err-wage', 'Wage must be 0 or more.');
      return;
    }

    const goal = goalStr ? roundMoney(Number(goalStr)) : null;

    // Keep the existing moneySaved value.
    const existing = loadSettings();

    saveSettings({
      hourlyWage: wage,
      currency: currency,
      savingsGoal: goal,
      moneySaved: existing.moneySaved || 0,
    });

    showSuccess('set-success', 'Settings saved!');
  });
}

// ============================================================
// DATA BUTTONS — Load demo data & Clear all data
// ============================================================

// ------------------------------------------------------------
// initDataButtons() wires up the demo and clear buttons.
// Clear shows a confirm dialog before doing anything.
// ------------------------------------------------------------
function initDataButtons() {
  const demoBtn = $('btn-demo');
  const clearBtn = $('btn-clear');

  if (demoBtn) {
    demoBtn.addEventListener('click', function () {
      loadDemoData();
      // Re-render whatever view is active.
      renderView(currentView);
      showSuccess('set-success', 'Demo data loaded!');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      const ok = confirm(
        'This will delete ALL purchases, categories, and settings. Are you sure?'
      );
      if (ok) {
        clearAllData();
        // Re-render everything.
        renderView(currentView);
        showSuccess('set-success', 'All data cleared.');
      }
    });
  }
}

// ============================================================
// THEME
// ============================================================

// ------------------------------------------------------------
// applyTheme(theme) sets data-theme on the <html> element.
// ------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ------------------------------------------------------------
// initThemeToggle() sets up the light/dark mode button.
// ------------------------------------------------------------
function initThemeToggle() {
  const btn = $('theme-toggle');
  if (!btn) return;

  // Apply the saved theme on load.
  applyTheme(loadTheme());

  btn.addEventListener('click', function () {
    const current = loadTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  });
}

// ============================================================
// START THE APP
// ============================================================

// ------------------------------------------------------------
// init() is called once when the page loads.
// It sets up every event handler and renders the first view.
// ------------------------------------------------------------
function init() {
  // Set up the theme first so the page looks right.
  initThemeToggle();

  // Set up navigation.
  initTabs();
  initBottomNavSlide();

  // Set up forms and buttons.
  initAddPurchaseForm();
  initImpulseCheck();
  initAddCategoryForm();
  initSettingsForm();
  initDataButtons();

  // Fill the purchases filter dropdown.
  initPurchasesFilter();

  // Set up the dashboard dropdowns (range and recent count).
  initDashboardControls();

  // Show the dashboard by default.
  switchView('dashboard');
}

// Run init when the DOM is ready.
document.addEventListener('DOMContentLoaded', init);
