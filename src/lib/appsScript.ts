export const appsScriptCode = `function doPost(e) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('每日消費');
  const d = JSON.parse(e.postData.contents);

  sheet.appendRow([
    d.date, d.category, d.amount,
    d.paymentMethod, d.note
  ]);
  // 強制日期欄位為純文字，防止 Sheets 自動轉型
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('@');

  const lastRow = sheet.getLastRow();
  const numCols = 5;
  const COLOR_A = '#f1f5f9';
  const COLOR_B = '#eff6ff';
  let color = COLOR_A;
  if (lastRow > 2) {
    const prevDate = sheet.getRange(lastRow - 1, 1).getDisplayValue();
    const prevColor = sheet.getRange(lastRow - 1, 1).getBackground();
    color = prevDate === d.date
      ? prevColor
      : (prevColor === COLOR_A ? COLOR_B : COLOR_A);
  }
  sheet.getRange(lastRow, 1, 1, numCols).setBackground(color);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('每日消費');
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const data = sheet.getRange(1, 1, lastRow, 5).getValues();
  const rows = data.map(function(row) {
    var d = row[0];
    var dateStr;
    if (d && typeof d.getMonth === 'function') {
      dateStr = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    } else {
      dateStr = String(d);
    }
    return {
      date: dateStr,
      category: String(row[1]),
      amount: Number(row[2]),
      paymentMethod: String(row[3]),
      note: String(row[4])
    };
  }).filter(function(r) {
    return r.date && r.date !== '日期' && r.category && r.category !== '類別' && !isNaN(r.amount);
  });

  const type = e.parameter.type;
  if (type === 'today') {
    const date = e.parameter.date;
    return ContentService
      .createTextOutput(JSON.stringify(rows.filter(function(r) { return r.date === date; })))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (type === 'month') {
    const month = e.parameter.month;
    return ContentService
      .createTextOutput(JSON.stringify(rows.filter(function(r) { return r.date.startsWith(month); })))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function settleMonth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataSheet = ss.getSheetByName('每日消費');
  var tz = ss.getSpreadsheetTimeZone();

  // 取得上個月份
  var now = new Date();
  var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var month = lastMonth.getMonth() + 1;
  var monthStr = lastMonth.getFullYear() + '-' + ('0' + month).slice(-2);
  var sheetName = month + '月';

  // 讀取上個月的資料
  var lastRow = dataSheet.getLastRow();
  if (lastRow < 1) return;
  var data = dataSheet.getRange(1, 1, lastRow, 5).getValues();

  var categoryMap = {};
  var total = 0;
  data.forEach(function(row) {
    var d = row[0];
    var dateStr = (d && typeof d.getMonth === 'function')
      ? Utilities.formatDate(d, tz, 'yyyy-MM-dd')
      : String(d);
    if (!dateStr.startsWith(monthStr)) return;
    var category = String(row[1]);
    var amount = Number(row[2]);
    if (!category || category === '類別' || isNaN(amount)) return;
    categoryMap[category] = (categoryMap[category] || 0) + amount;
    total += amount;
  });

  if (Object.keys(categoryMap).length === 0) return;

  // 找到現有的月份 sheet（如「4月」），找不到才建立
  var monthSheet = ss.getSheetByName(sheetName);
  if (!monthSheet) monthSheet = ss.insertSheet(sheetName);

  // 找到 sheet 最後一列，往下空兩列再寫入
  var existingLastRow = monthSheet.getLastRow();
  var startRow = existingLastRow > 0 ? existingLastRow + 3 : 1;

  // 寫入標題與資料
  monthSheet.getRange(startRow, 1).setValue(sheetName + ' 消費總結');
  monthSheet.getRange(startRow, 1).setFontSize(12).setFontWeight('bold');
  monthSheet.getRange(startRow + 1, 1, 1, 2).setValues([['類別', '金額']]);
  monthSheet.getRange(startRow + 1, 1, 1, 2).setFontWeight('bold');

  var categories = Object.keys(categoryMap);
  var tableData = categories.map(function(cat) { return [cat, categoryMap[cat]]; });
  monthSheet.getRange(startRow + 2, 1, tableData.length, 2).setValues(tableData);
  var totalRow = startRow + 2 + tableData.length;
  monthSheet.getRange(totalRow, 1, 1, 2).setValues([['總計', total]]);
  monthSheet.getRange(totalRow, 1, 1, 2).setFontWeight('bold');

  // 插入圓餅圖（放在資料右側）
  var chartRange = monthSheet.getRange(startRow + 1, 1, tableData.length + 1, 2);
  var chart = monthSheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(chartRange)
    .setPosition(startRow, 4, 0, 0)
    .setOption('title', sheetName + ' 消費分佈')
    .setOption('pieHole', 0.4)
    .setOption('width', 420)
    .setOption('height', 320)
    .build();
  monthSheet.insertChart(chart);

  // 刪除每日消費中上個月的資料列（從最後一列往前刪，避免索引偏移）
  var rowsToDelete = [];
  for (var i = lastRow; i >= 1; i--) {
    var d = data[i - 1][0];
    var dateStr = (d && typeof d.getMonth === 'function')
      ? Utilities.formatDate(d, tz, 'yyyy-MM-dd')
      : String(d);
    if (dateStr.startsWith(monthStr)) rowsToDelete.push(i);
  }
  rowsToDelete.forEach(function(r) { dataSheet.deleteRow(r); });
}`
