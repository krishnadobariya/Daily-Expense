import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateMonthlyReport = (user, data, customPeriod = null) => {
  const doc = new jsPDF();
  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  const primaryColor = [14, 165, 233]; // #0ea5e9
  const accentColor = [51, 65, 85];    // Slate 700

  // 1. Modern Header Design
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ExpenseLeak AI', 15, 25);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('PROFESSIONAL FINANCIAL ANALYTICS', 15, 33);
  
  // Right-aligned Report Meta
  doc.setFontSize(10);
  doc.text(`REPORT ID: EL-${Date.now().toString().slice(-6)}`, 195, 15, { align: 'right' });
  doc.text(`DATE: ${today.toLocaleDateString()}`, 195, 22, { align: 'right' });
  doc.text(`USER: ${user.name.toUpperCase()}`, 195, 29, { align: 'right' });

  // 2. Report Focus Title
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 15, 65);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(15, 68, 45, 68);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporting Period: ${customPeriod || `${monthName} ${year}`}`, 15, 75);

  // 3. Stat Boxes (The "Dashboard" in PDF)
  const sortedTransactions = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Draw Stat Grid
  const drawStat = (label, value, x, y, isPositive = null) => {
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(x, y, 43, 25, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label, x + 5, y + 8);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    if (isPositive === true) doc.setTextColor(16, 185, 129); // Emerald 500
    if (isPositive === false) doc.setTextColor(244, 63, 94);  // Rose 500
    doc.text(value, x + 5, y + 18); // Use more padding (y+18)
    doc.setFont('helvetica', 'normal');
  };

  drawStat('TOTAL INCOME', `Rs. ${totalIncome.toLocaleString()}`, 15, 85);
  drawStat('TOTAL EXPENSE', `Rs. ${totalExpense.toLocaleString()}`, 61, 85);
  drawStat('NET BALANCE', `Rs. ${balance.toLocaleString()}`, 107, 85, balance >= 0);
  drawStat('SAVINGS RATE', `${savingsRate}%`, 153, 85, savingsRate >= 20);

  // 4. Leak Analysis (Priority section)
  if (data.insights.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Intelligence Insights', 15, 125);
    
    let yPos = 135;
    data.insights.slice(0, 3).forEach((insight, index) => {
      doc.setFillColor(insight.severity === 'high' ? 244 : 245, insight.severity === 'high' ? 63 : 158, insight.severity === 'high' ? 94 : 11);
      doc.circle(18, yPos - 1, 1.5, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(insight.message, 24, yPos);
      yPos += 8;
    });
  }

  // 5. Category Breakdown (Professional Table)
  const categories = {};
  data.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

  const distData = Object.keys(categories).map(cat => [
    cat.charAt(0).toUpperCase() + cat.slice(1),
    `Rs. ${categories[cat].toLocaleString()}`,
    `${Math.round((categories[cat] / (totalExpense || 1)) * 100)}%`,
    categories[cat] > (totalIncome * 0.3) ? 'HIGH' : 'NORMAL'
  ]);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Expense Distribution', 15, 165);

  autoTable(doc, {
    startY: 172,
    head: [['Category', 'Amount', 'Allocation', 'Status']],
    body: distData,
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'center' },
      3: { halign: 'center' }
    },
    styles: { fontSize: 10, cellPadding: 4 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (d) => {
       if (d.section === 'body' && d.column.index === 3 && d.cell.raw === 'HIGH') {
          d.cell.styles.textColor = [225, 29, 72];
       }
    }
  });

  // 6. Detailed Transaction History (New Section)
  const historyData = sortedTransactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.note || '-',
    t.category.toUpperCase(),
    t.type.toUpperCase(),
    `Rs. ${t.amount.toLocaleString()}`
  ]);

  doc.addPage();
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Transaction History', 15, 20);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.line(15, 23, 45, 23);

  autoTable(doc, {
    startY: 32,
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: historyData,
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' }
    },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 3) {
        if (d.cell.raw === 'INCOME') d.cell.styles.textColor = [16, 185, 129];
        if (d.cell.raw === 'EXPENSE') d.cell.styles.textColor = [244, 63, 94];
      }
    }
  });

  // 7. Footer Layout
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 280, 195, 280);
    
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('expenseleak.ai', 15, 287);
    doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
    doc.text('CONFIDENTIAL FINANCIAL DOCUMENT', 105, 287, { align: 'center' });
  }

  const fileName = customPeriod ? `ExpenseLeak_Custom_${customPeriod.replace(/\s+/g, '_')}.pdf` : `ExpenseLeak_Report_${monthName}_${year}.pdf`;
  doc.save(fileName);
};
