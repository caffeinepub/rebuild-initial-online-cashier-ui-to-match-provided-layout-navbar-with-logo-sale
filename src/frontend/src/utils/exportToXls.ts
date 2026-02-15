interface LineItem {
  saleId: number;
  transactionDate: Date;
  paymentMethod: string;
  productName: string;
  quantity: number;
  cogs: number;
  unitPrice: number;
  lineTotal: number;
}

export function exportSalesReportToXls(lineItems: LineItem[]): void {
  // Create HTML table for Excel
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan Penjualan</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; font-weight: bold; }
        .number { text-align: right; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            <th>ID Transaksi</th>
            <th>Tanggal & Jam</th>
            <th>Metode Pembayaran</th>
            <th>Produk</th>
            <th class="number">Qty</th>
            <th class="number">HPP</th>
            <th class="number">Harga Jual</th>
            <th class="number">Harga Total</th>
          </tr>
        </thead>
        <tbody>
  `;

  lineItems.forEach((item) => {
    const dateStr = new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(item.transactionDate);

    html += `
      <tr>
        <td>${item.saleId}</td>
        <td>${dateStr}</td>
        <td>${item.paymentMethod}</td>
        <td>${item.productName}</td>
        <td class="number">${item.quantity}</td>
        <td class="number">${item.cogs}</td>
        <td class="number">${item.unitPrice}</td>
        <td class="number">${item.lineTotal}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `Laporan_Penjualan_${timestamp}.xls`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
