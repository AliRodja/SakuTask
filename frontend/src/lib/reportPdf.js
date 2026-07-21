import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from './format';

export function generateReportPdf({ userName, rangeLabel, report, monthlyTrend }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 27, 75);
  doc.text('Laporan SakuTask', marginX, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${userName} - Periode: ${rangeLabel}`, marginX, y);
  y += 14;
  doc.text(`Dibuat pada ${new Date().toLocaleString('id-ID')}`, marginX, y);

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text('Ringkasan Keuangan', marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Item', 'Jumlah']],
    body: [
      ['Total Pemasukan', formatRupiah(report.totalIncome)],
      ['Total Pengeluaran', formatRupiah(report.totalExpense)],
      ['Saldo Bersih', formatRupiah(report.net)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  y = doc.lastAutoTable.finalY + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Pengeluaran per Kategori', marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Kategori', 'Jumlah', '%']],
    body: report.categoryTotals.length
      ? report.categoryTotals.map(([cat, amt]) => [
          cat,
          formatRupiah(amt),
          report.totalExpense > 0 ? `${((amt / report.totalExpense) * 100).toFixed(1)}%` : '0%',
        ])
      : [['Tidak ada data', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  y = doc.lastAutoTable.finalY + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ringkasan Tugas', marginX, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Item', 'Nilai']],
    body: [
      ['Total Tugas', String(report.todoTotal)],
      ['Tugas Selesai', String(report.todoCompleted)],
      ['Tingkat Penyelesaian', `${report.completionRate.toFixed(0)}%`],
      ['Reminder WhatsApp Terkirim', String(report.waSent)],
      ['Reminder WhatsApp Gagal', String(report.waFailed)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  if (monthlyTrend?.length) {
    y = doc.lastAutoTable.finalY + 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Tren 6 Bulan Terakhir', marginX, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Bulan', 'Pemasukan', 'Pengeluaran']],
      body: monthlyTrend.map((m) => [m.label, formatRupiah(m.income), formatRupiah(m.expense)]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    });
  }

  doc.save(`Laporan-SakuTask-${new Date().toISOString().slice(0, 10)}.pdf`);
}
