
const addTradeBtn = document.getElementById("add-trade-btn");
const tradeFormPanel = document.getElementById("trade-form-panel");
const cancelTradeBtn = document.getElementById("cancel-trade-btn");
const tradeForm = document.getElementById("trade-form");
const strategyInput = document.getElementById("strategy");
const tradeNotesInput = document.getElementById("trade-notes");

const tokenInput = document.getElementById("token");
const chainInput = document.getElementById("chain");
const sideInput = document.getElementById("side");
const entryPriceInput = document.getElementById("entry-price");
const exitPriceInput = document.getElementById("exit-price");
const quantityInput = document.getElementById("quantity");
const feesInput = document.getElementById("fees");

const tradeList = document.getElementById("trade-list");
const emptyState = document.getElementById("empty-state");
const tableWrapper = document.getElementById("table-wrapper");

const totalTradesEl = document.getElementById("total-trades");
const netPlEl = document.getElementById("net-pl");
const winRateEl = document.getElementById("win-rate");
const winningTradesEl = document.getElementById("winning-trades");

const searchInput = document.getElementById("trade-search");
const sideFilter = document.getElementById("side-filter");

const submitBtn = tradeForm.querySelector('[type="submit"]');
const tradeCountEl = document.getElementById("trade-count");

const exportTradesBtn = document.getElementById("export-trades-btn");
const maxDrawdownEl = document.getElementById("max-drawdown");
const averageWinEl = document.getElementById("average-win");
const profitFactorEl = document.getElementById("profit-factor");
const averageLossEl = document.getElementById("average-loss");

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}


// Load saved trades safely.
let trades = [];

try {
  const savedTrades = localStorage.getItem("trades");
  const parsedTrades = savedTrades ? JSON.parse(savedTrades) : [];

  if (Array.isArray(parsedTrades)) {
    trades = parsedTrades;
  }
} catch (error) {
  console.error("Could not load saved trades:", error);
}

let editingIndex = null;

// Save the current trades.
function saveTrades() {
  try {
    localStorage.setItem("trades", JSON.stringify(trades));
    return true;
  } catch (error) {
    console.error("Could not save trades:", error);
    alert("Could not save your trades. Check your browser storage.");
    return false;
  }
}
// Open the form for a new trade.
addTradeBtn.addEventListener("click", () => {
  editingIndex = null;
  tradeForm.reset();
  submitBtn.textContent = "Save Trade";
  tradeFormPanel.hidden = false;
  tradeFormPanel.scrollIntoView({
  behavior: "smooth",
  block: "start"
});
});

// Close and reset the form.
cancelTradeBtn.addEventListener("click", () => {
  tradeForm.reset();
  editingIndex = null;
  submitBtn.textContent = "Save Trade";
  tradeFormPanel.hidden = true;
});

// Add or edit a trade.
tradeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const token = tokenInput.value.trim();
  const chain = chainInput.value;
  const side = sideInput.value;
  const entryPrice = Number(entryPriceInput.value);
  const exitPrice = Number(exitPriceInput.value);
  const quantity = Number(quantityInput.value);
  const fees = feesInput.value.trim() === ""
    ? 0
    : Number(feesInput.value);

  // Validate the inputs.
  if (!token) {
  showToast("Enter a token name.", "error");
  tokenInput.focus();
  return;
}

  if (
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(exitPrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(fees) ||
    entryPrice <= 0 ||
    exitPrice <= 0 ||
    quantity <= 0 ||
    fees < 0
  ) {
    showToast(
  "Prices and quantity must be positive. Fees cannot be negative.",
  "error"
);
    return;
  }

  if (side !== "Long" && side !== "Short") {
   showToast("Choose Long or Short.", "error");
    return;
  }

  // Calculate profit or loss.
  const priceDifference = side === "Long"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const profitLoss = priceDifference * quantity - fees;

  const trade = {
    token,
    chain,
    side,
    entryPrice,
    exitPrice,
    strategy: strategyInput.value,
  notes: tradeNotesInput.value.trim(),
    quantity,
    fees,
    profitLoss,
    createdAt: editingIndex !== null
      ? trades[editingIndex].createdAt
      : new Date().toISOString()
  };
const previousTrade =
  editingIndex !== null ? trades[editingIndex] : null;
  if (editingIndex !== null) {
    trades[editingIndex] = trade;
  } else {
    trades.push(trade);
  }

  
  if (!saveTrades()) {
  // Undo the change if saving fails.
  if (editingIndex !== null) {
    trades[editingIndex] = previousTrade;
  } else {
    trades.pop();
  }

  return;
}
  tradeForm.reset();
  editingIndex = null;
  submitBtn.textContent = "Save Trade";
  tradeFormPanel.hidden = true;

  displayTrades();

if (previousTrade !== null) {
  showToast("Trade updated successfully!");
} else {
  showToast("Trade saved successfully!");
}
  
});


// Display the trades in the table.

function displayTrades() {
  tradeList.innerHTML = "";

  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const selectedSide = sideFilter
    ? sideFilter.value
    : "All";

  const visibleTrades = trades.filter((trade) => {
    const matchesSearch = trade.token
      .toLowerCase()
      .includes(searchTerm);

    const matchesSide =
      selectedSide === "All" || trade.side === selectedSide;

    return matchesSearch && matchesSide;
  });

  visibleTrades.forEach((trade) => {
    const row = document.createElement("tr");
    



    function addCell(value) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
      return cell;
    }

    addCell(trade.token);
addCell(trade.side);
addCell(trade.strategy || "Other");
const notesCell = addCell(trade.notes || "—");
notesCell.classList.add("notes-column");
notesCell.title = trade.notes || "";

    addCell(
      trade.entryPrice.toLocaleString("en-US", {
        maximumSignificantDigits: 8
      })
    );

    addCell(
      trade.exitPrice.toLocaleString("en-US", {
        maximumSignificantDigits: 8
      })
    );

    // Net P/L cell
    const plCell = addCell(
      `${trade.profitLoss < 0 ? "-" : ""}$${Math.abs(trade.profitLoss).toFixed(2)}`
    );

    if (trade.profitLoss > 0) {
      plCell.classList.add("profit");
    } else if (trade.profitLoss < 0) {
      plCell.classList.add("loss");
    }

    // Action cell
    const actionCell = document.createElement("td");

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit-btn");

    
editBtn.addEventListener("click", () => {
  editingIndex = trades.indexOf(trade);

  tokenInput.value = trade.token;
  chainInput.value = trade.chain;
  sideInput.value = trade.side;
  strategyInput.value = trade.strategy || "Other";
  tradeNotesInput.value = trade.notes || "";
  entryPriceInput.value = trade.entryPrice;
  exitPriceInput.value = trade.exitPrice;
  quantityInput.value = trade.quantity;
  feesInput.value = trade.fees;

  submitBtn.textContent = "Update Trade";
  tradeFormPanel.hidden = false;

  // Scroll to the form when Edit is clicked.
  tradeFormPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");

    
deleteBtn.addEventListener("click", () => {
  const index = trades.indexOf(trade);

  if (index !== -1) {
    const deletedTrade = trades[index];

    trades.splice(index, 1);

    if (!saveTrades()) {
      // Restore the trade if saving fails.
      trades.splice(index, 0, deletedTrade);
      displayTrades();
      return;
    }

    if (editingIndex === index) {
      editingIndex = null;
      tradeForm.reset();
      submitBtn.textContent = "Save Trade";
      tradeFormPanel.hidden = true;
    } else if (
      editingIndex !== null &&
      index < editingIndex
    ) {
      editingIndex--;
    }

    displayTrades();
    showToast("Trade deleted successfully!");
  }
});


    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    // Add the completed row to the table.
    tradeList.appendChild(row);
  });

  emptyState.hidden = visibleTrades.length > 0;
  tableWrapper.hidden = visibleTrades.length === 0;

  updateStats();
}


// Update the dashboard statistics.
function updateStats() {
  totalTradesEl.textContent = trades.length;
  tradeCountEl.textContent =
  `${trades.length} ${trades.length === 1 ? "trade" : "trades"}`;

  const totalProfit = trades.reduce((total, trade) => {
    return total + trade.profitLoss;
  }, 0);

  netPlEl.textContent =
    `${totalProfit < 0 ? "-" : ""}$${Math.abs(totalProfit).toFixed(2)}`;

  netPlEl.classList.toggle("profit", totalProfit > 0);
  netPlEl.classList.toggle("loss", totalProfit < 0);
  // Calculate maximum drawdown.
let runningPL = 0;
let peakPL = 0;
let maxDrawdown = 0;

trades.forEach((trade) => {
  runningPL += Number(trade.profitLoss || 0);

  if (runningPL > peakPL) {
    peakPL = runningPL;
  }

  const drawdown = peakPL - runningPL;

  if (drawdown > maxDrawdown) {
    maxDrawdown = drawdown;
  }
});
maxDrawdownEl.textContent =
  `${maxDrawdown > 0 ? "-" : ""}$${maxDrawdown.toFixed(2)}`;

  const winningTrades = trades.filter((trade) => {
    return trade.profitLoss > 0;
  });
  // Calculate average profit per winning trade.
const totalWins = winningTrades.reduce((total, trade) => {
  return total + trade.profitLoss;
}, 0);

const averageWin = winningTrades.length > 0
  ? totalWins / winningTrades.length
  : 0;

// Calculate average loss per losing trade.
const losingTrades = trades.filter((trade) => {
  return trade.profitLoss < 0;
});

const totalLosses = losingTrades.reduce((total, trade) => {
  return total + Math.abs(trade.profitLoss);
}, 0);
// Calculate profit factor.
const profitFactor = totalLosses > 0
  ? totalWins / totalLosses
  : totalWins > 0
    ? Infinity
    : 0;

profitFactorEl.textContent = profitFactor === Infinity
  ? "∞"
  : profitFactor.toFixed(2);

const averageLoss = losingTrades.length > 0
  ? totalLosses / losingTrades.length
  : 0;

  winningTradesEl.textContent = winningTrades.length;

  const winRate = trades.length > 0
    ? (winningTrades.length / trades.length) * 100
    : 0;

  winRateEl.textContent = `${winRate.toFixed(2)}%`;
  averageWinEl.textContent = `$${averageWin.toFixed(2)}`;
averageLossEl.textContent =
  `${averageLoss > 0 ? "-" : ""}$${averageLoss.toFixed(2)}`;
}

// Respond to search and filter changes.
if (searchInput) {
  searchInput.addEventListener("input", displayTrades);
}

if (sideFilter) {
  sideFilter.addEventListener("change", displayTrades);
}

// Initial dashboard render.
displayTrades();

function exportTradesToCSV() {
  if (trades.length === 0) {
    alert("No trades available to export.");
    return;
  }

  const headers = [
  "Token",
  "Chain",
  "Side",
  "Strategy",
  "Notes",
  "Entry Price",
  "Exit Price",
  "Quantity",
  "Fees",
  "Net P/L",
  "Created At"
];

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = trades.map((trade) => [
  trade.token,
  trade.chain,
  trade.side,
  trade.strategy || "Other",
  trade.notes || "",
  trade.entryPrice,
  trade.exitPrice,
  trade.quantity,
  trade.fees,
  trade.profitLoss,
  trade.createdAt
]);
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(","))
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "tradevault-trades.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  showToast("Trades exported to CSV successfully!");
}

exportTradesBtn.addEventListener("click", exportTradesToCSV);


const exportPdfBtn = document.getElementById("export-pdf-btn");


function exportTradesToPDF() {
  if (trades.length === 0) {
    alert("No trades available to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const money = (value) =>
    `${value < 0 ? "-" : ""}$${Math.abs(value).toFixed(2)}`;

  const totalProfit = trades.reduce(
    (total, trade) => total + Number(trade.profitLoss || 0),
    0
  );

  const winningTrades = trades.filter(
    (trade) => Number(trade.profitLoss) > 0
  ).length;

  const winRate = (winningTrades / trades.length) * 100;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TradeVault", margin, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("TRADING PERFORMANCE REPORT", margin, 25);
  doc.text(
    `Generated ${new Date().toLocaleDateString()}`,
    pageWidth - margin,
    25,
    { align: "right" }
  );

  // Summary cards
  const cardY = 48;
  const cardGap = 4;
  const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
  const cardHeight = 25;

  const cards = [
    ["TOTAL TRADES", String(trades.length)],
    ["WINNING TRADES", String(winningTrades)],
    ["WIN RATE", `${winRate.toFixed(1)}%`],
    ["NET P/L", money(totalProfit)]
  ];

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "F");

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(card[0], x + 3, cardY + 8);

    doc.setTextColor(
      index === 3 && totalProfit > 0 ? 22 : 30,
      index === 3 && totalProfit > 0 ? 163 : 41,
      index === 3 && totalProfit > 0 ? 74 : 59
    );

    if (index === 3 && totalProfit < 0) {
      doc.setTextColor(220, 38, 38);
    }

    doc.setFontSize(11);
    doc.text(card[1], x + 3, cardY + 18);
  });

  // Trade history
  let y = 86;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Trade History", margin, y);

  y += 7;

  const columns = [
    { title: "Token / Chain", width: 30 },
    { title: "Side", width: 15 },
    { title: "Strategy", width: 25 },
    { title: "Entry", width: 22 },
    { title: "Exit", width: 22 },
    { title: "Quantity", width: 20 },
    { title: "Fees", width: 17 },
    { title: "Net P/L", width: 29 }
  ];

  const tableWidth = columns.reduce(
    (sum, column) => sum + column.width,
    0
  );

  function drawHeader() {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, tableWidth, 9, "F");

    let x = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    columns.forEach((column) => {
      doc.text(column.title, x + 2, y + 5.8);
      x += column.width;
    });

    y += 9;
  }

  function drawFooter() {
    const pageCount = doc.internal.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      doc.setDrawColor(226, 232, 240);
      doc.line(
        margin,
        pageHeight - 12,
        pageWidth - margin,
        pageHeight - 12
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("TradeVault | Personal trading journal", margin, pageHeight - 7);
      doc.text(
        `Page ${page} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: "right" }
      );
    }
  }

  drawHeader();

  trades.forEach((trade, index) => {
    const profitLoss = Number(trade.profitLoss || 0);

    const values = [
      `${trade.token || ""} / ${trade.chain || ""}`,
      trade.side || "",
      trade.strategy || "Other",
      String(trade.entryPrice ?? ""),
      String(trade.exitPrice ?? ""),
      String(trade.quantity ?? ""),
      `$${Number(trade.fees || 0).toFixed(2)}`,
      money(profitLoss)
    ];

    const wrappedValues = values.map((value, columnIndex) =>
      doc.splitTextToSize(
        value,
        columns[columnIndex].width - 4
      )
    );

    const rowHeight = Math.max(
      10,
      ...wrappedValues.map((lines) => lines.length * 3.5 + 4)
    );

    if (y + rowHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      drawHeader();
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    let x = margin;

    values.forEach((value, columnIndex) => {
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, y, columns[columnIndex].width, rowHeight);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      if (columnIndex === 7) {
        doc.setTextColor(
          profitLoss > 0 ? 22 : profitLoss < 0 ? 220 : 71,
          profitLoss > 0 ? 163 : profitLoss < 0 ? 38 : 85,
          profitLoss > 0 ? 74 : profitLoss < 0 ? 38 : 105
        );
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(51, 65, 85);
      }

      doc.text(
        wrappedValues[columnIndex],
        x + 2,
        y + 4
      );

      x += columns[columnIndex].width;
    });

    y += rowHeight;

    // Notes appear below each trade when present.
    if (trade.notes) {
      const noteLines = doc.splitTextToSize(
        `Notes: ${trade.notes}`,
        tableWidth - 6
      );

      const noteHeight = noteLines.length * 3.5 + 5;

      if (y + noteHeight > pageHeight - 18) {
        doc.addPage();
        y = 18;
        drawHeader();
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(noteLines, margin + 3, y + 4);
      y += noteHeight;
    }
  });

  // Calculate cumulative profit/loss for each trade.
const cumulativePL = [];
let runningTotal = 0;

trades.forEach((trade) => {
  runningTotal += Number(trade.profitLoss || 0);
  cumulativePL.push(runningTotal);
});

if (cumulativePL.length > 0) {
  // Start the chart on a new PDF page.
  doc.addPage();

  const chartX = 25;
  const chartY = 45;
  const chartWidth = 155;
  const chartHeight = 90;

  const minValue = Math.min(0, ...cumulativePL);
  const maxValue = Math.max(0, ...cumulativePL);
  const valueRange = maxValue - minValue || 1;

  // Chart title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("Cumulative Profit / Loss", 14, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Performance across recorded trades", 14, 32);

  // Chart axes
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(
    chartX,
    chartY,
    chartX,
    chartY + chartHeight
  );
  doc.line(
    chartX,
    chartY + chartHeight,
    chartX + chartWidth,
    chartY + chartHeight
  );

  // Zero-profit reference line
  const zeroY =
    chartY + chartHeight -
    ((0 - minValue) / valueRange) * chartHeight;

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(chartX, zeroY, chartX + chartWidth, zeroY);
  doc.setLineDashPattern([], 0);

  // Value labels
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`$${maxValue.toFixed(2)}`, chartX - 3, chartY - 4, {
    align: "right"
  });
  doc.text(`$${minValue.toFixed(2)}`, chartX - 3, chartY + chartHeight, {
    align: "right"
  });

  // Plot cumulative P/L
  const points = cumulativePL.map((value, index) => ({
    x: chartX + (
      cumulativePL.length === 1
        ? chartWidth / 2
        : (index / (cumulativePL.length - 1)) * chartWidth
    ),
    y: chartY + chartHeight -
      ((value - minValue) / valueRange) * chartHeight
  }));

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);

  for (let i = 1; i < points.length; i++) {
    doc.line(
      points[i - 1].x,
      points[i - 1].y,
      points[i].x,
      points[i].y
    );
  }

  // Mark each trade's cumulative result
  points.forEach((point, index) => {
    doc.setFillColor(37, 99, 235);
    doc.circle(point.x, point.y, 1.5, "F");

    if (points.length <= 12) {
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `T${index + 1}`,
        point.x,
        chartY + chartHeight + 7,
        { align: "center" }
      );
    }
  });

  // Final cumulative result
  const finalPL = cumulativePL[cumulativePL.length - 1];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    finalPL > 0 ? 22 : finalPL < 0 ? 220 : 71,
    finalPL > 0 ? 163 : finalPL < 0 ? 38 : 85,
    finalPL > 0 ? 74 : finalPL < 0 ? 38 : 105
  );

  doc.text(
    `Final cumulative P/L: ${
      finalPL < 0 ? "-" : ""
    }$${Math.abs(finalPL).toFixed(2)}`,
    14,
    chartY + chartHeight + 22
  );
}

drawFooter();
doc.save("tradevault-report.pdf");
}


exportPdfBtn.addEventListener("click", exportTradesToPDF);
const themeToggle = document.getElementById("theme-toggle");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);

  themeToggle.textContent = isDark
    ? "☀️ Light mode"
    : "🌙 Dark mode";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
}

// Start with the system's current setting.
applyTheme(systemPrefersDark.matches);

// Follow system changes while the user has not manually overridden them.
systemPrefersDark.addEventListener("change", (event) => {
  applyTheme(event.matches);
});

// Allow manual switching.
themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark-theme");
  applyTheme(isDark);
});

