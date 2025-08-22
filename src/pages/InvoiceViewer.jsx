// InvoiceViewer.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

// ✅ Category Mapping
const categoryMap = {
  1: "Surya Medical",
  2: "Surya Optical",
};

function formatIST(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function InvoiceViewer() {
  const { orderId } = useParams();
  const { axios } = useAppContext();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}/invoice`);
        setInvoice(response.data.invoice);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [orderId, axios]);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>Hospital Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; margin: 0; color: #000; background: white; }
              .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .logo { font-size: 48px; font-weight: bold; color: #2563eb; }
              .invoice-title { text-align: right; }
              .invoice-title h1 { font-size: 24px; margin: 0; color: #333; }
              .invoice-details { text-align: right; font-size: 12px; color: #666; margin-top: 10px; }
              .company-info { display: flex; justify-content: space-between; margin: 30px 0; }
              .from-section, .bill-to-section { flex: 1; margin-right: 20px; }
              .section-title { font-weight: bold; color: #333; margin-bottom: 10px; }
              .company-name { font-weight: bold; color: #333; }
              .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              .items-table th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 12px; }
              .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
              .items-table .text-right { text-align: right; }
              .items-table .text-center { text-align: center; }
              .totals-section { margin-top: 30px; display: flex; justify-content: space-between; }
              .payment-info { flex: 1; margin-right: 40px; }
              .totals { flex: 1; max-width: 300px; }
              .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total-row.final { font-weight: bold; font-size: 16px; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; }
              .notes { margin-top: 30px; }
              .signature { text-align: right; margin-top: 50px; }
              .signature-line { border-bottom: 1px solid #333; width: 200px; margin-left: auto; margin-bottom: 5px; }
              .qr-code { width: 80px; height: 80px; background: #000; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; margin-top: 8px; }
            </style>
          </head>
          <body>${printContents}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  };

  const handleDownload = () => {
    if (printRef.current) {
      const element = document.createElement("a");
      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Hospital Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; margin: 0; color: #000; background: white; }
              .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .logo { font-size: 48px; font-weight: bold; color: #2563eb; }
              .invoice-title { text-align: right; }
              .invoice-title h1 { font-size: 24px; margin: 0; color: #333; }
              .invoice-details { text-align: right; font-size: 12px; color: #666; margin-top: 10px; }
              .company-info { display: flex; justify-content: space-between; margin: 30px 0; }
              .from-section, .bill-to-section { flex: 1; margin-right: 20px; }
              .section-title { font-weight: bold; color: #333; margin-bottom: 10px; }
              .company-name { font-weight: bold; color: #333; }
              .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              .items-table th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 12px; }
              .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
              .items-table .text-right { text-align: right; }
              .items-table .text-center { text-align: center; }
              .totals-section { margin-top: 30px; display: flex; justify-content: space-between; }
              .payment-info { flex: 1; margin-right: 40px; }
              .totals { flex: 1; max-width: 300px; }
              .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total-row.final { font-weight: bold; font-size: 16px; border-top: 1px solid #333; padding-top: 10px; margin-top: 10px; }
              .notes { margin-top: 30px; }
              .signature { text-align: right; margin-top: 50px; }
              .signature-line { border-bottom: 1px solid #333; width: 200px; margin-left: auto; margin-bottom: 5px; }
              .qr-code { width: 80px; height: 80px; background: #000; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; margin-top: 8px; }
            </style>
          </head>
          <body>${printRef.current.innerHTML}</body>
        </html>
      `;
      const blob = new Blob([html], { type: "text/html" });
      element.href = URL.createObjectURL(blob);
      element.download = `hospital-invoice-${invoice.invoiceNumber || orderId}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleSend = () => {
    if (!invoice) return;
    const subject = `Hospital Invoice #${invoice.invoiceNumber}`;
    let body = `Hospital Invoice%0D%0A%0D%0AInvoice Number: ${invoice.invoiceNumber}%0D%0APatient: ${invoice.customerName}%0D%0APhone: ${invoice.customerPhone}%0D%0ADate: ${formatIST(invoice.date)}%0D%0A%0D%0APrescribed Items:%0D%0A`;
    invoice.items?.forEach((item, idx) => {
      body += `${idx + 1}. ${item.itemName} x${item.quantity} @ ₹${item.unitPrice} = ₹${item.totalPrice}%0D%0A`;
    });
    body += `%0D%0ATotal Amount: ₹${invoice.grandTotal || invoice.total || invoice.totalAmount || "N/A"}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${body}`);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading invoice...</div>;
  if (!invoice) return <div className="flex justify-center items-center min-h-screen text-red-600">Invoice not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            🖨️ Print
          </button>
          <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            📥 Download
          </button>
          <button onClick={handleSend} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            📧 Send
          </button>
        </div>

        {/* Invoice */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div ref={printRef} className="p-8">
          {/* Header */}
<div className="invoice-header flex justify-between items-start mb-8">
  <div className="logo text-5xl font-bold text-blue-600">SA</div>
  <div className="invoice-title text-right">
    <h1 className="text-2xl font-bold text-gray-800 mb-2">Hospital Invoice</h1>
    
    <div className="invoice-details text-sm text-gray-600 mt-4">
      <div>Invoice no.: {invoice.invoiceNumber}</div>
      <div>Invoice date: {formatIST(invoice.date)}</div>
      <div>Due: {formatIST(invoice.date)}</div>
    </div>
  </div>
</div>
{/* Company Info */}
            <div className="company-info flex justify-between mb-8">
              <div className="from-section flex-1 mr-8">
                <div className="company-name font-bold text-gray-800">Surya Medical And Optical</div>
                <div className="text-sm text-gray-600">
                  <div>Dr. Chaturvedi</div>
                  <div>suryamedical.com</div>
                  <div>9234679597</div>
                </div>
              </div>
              
              <div className="bill-to-section ml-auto">
                <div className="section-title font-bold text-gray-800 mb-2">Bill to</div>
                <div className="company-name font-bold text-gray-800">{invoice.customerName}</div>
                <div className="text-sm text-gray-600">
                  <div>{invoice.customerPhone}</div>
                </div>
              </div>
            </div>
            {/* Items Table */}
            <table className="items-table w-full border-collapse mb-8">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left text-xs uppercase">Description</th>
                  <th className="p-3 text-center text-xs uppercase">Rate</th>
                  <th className="p-3 text-center text-xs uppercase">QTY</th>
                  <th className="p-3 text-center text-xs uppercase">Tax</th>
                  <th className="p-3 text-center text-xs uppercase">Discount</th>
                  <th className="p-3 text-right text-xs uppercase">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-sm text-gray-600">
                        {categoryMap[item.category] || categoryMap[Number(item.category)] || item.category || "Medical Item"}
                      </div>
                    </td>
                    <td className="p-3 text-center">₹{item.unitPrice}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
<td className="p-3 text-center">{invoice.taxPercentage || invoice.tax || 0}%</td>
<td className="p-3 text-center">{invoice.discountpercentage || invoice.discount || 0}%</td>

                    <td className="p-3 text-right font-medium">₹{Number(invoice.grandTotal || invoice.total || invoice.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="totals-section flex justify-between">
              <div className="payment-info flex-1 mr-10">
                <div className="section-title font-bold text-gray-800 mb-2">Payment instruction</div>
                <div className="text-sm text-gray-600 mb-4">
                  <div>Scan QR Code for Payment</div>
                  <div className="mt-2 p-4 border border-gray-300 inline-block">
                    <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-xs">
                      QR CODE
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <div>UPI ID: suryaapps@paytm</div>
                  <div>Account: 1234567890</div>
                  <div>Branch:HDFC Bank</div>
                  <div>IFSC CODE:HDFC0001678</div>
                </div>
              </div>

              <div className="totals flex-1 max-w-xs">
                <div className="total-row flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="total-row flex justify-between text-sm">
                  <span>Discount ({invoice.discountpercentage||invoice.discount }%):</span>
                  <span>₹{Number(invoice.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className="total-row flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{Number(invoice.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="total-row final flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>₹{Number(invoice.grandTotal || invoice.total || invoice.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="notes mt-8">
              <div className="section-title font-bold text-gray-800 mb-2">Notes</div>
              <div className="text-sm text-gray-600">
                Thank you for choosing our medical services. For any queries, please contact us at the above details.
              </div>
            </div>

            {/* Signature */}
            <div className="signature text-right mt-12">
              <div className="signature-line border-b border-gray-400 w-48 ml-auto mb-2"></div>
              <div className="text-sm text-gray-600">Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
