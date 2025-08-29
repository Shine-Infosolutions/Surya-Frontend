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
        const response = await axios.get(`/api/orders/${orderId}`);
        const orderData = response.data.data || response.data;
        setInvoice(orderData);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        toast.error("Failed to load invoice");
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [orderId, axios]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create PDF-friendly HTML with inline styles only
      const pdfContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="font-size: 48px; font-weight: bold; color: #2563eb;">SA</div>
            <div style="text-align: right;">
              <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">Hospital Invoice</h1>
              <div style="font-size: 14px; color: #4b5563;">
                <div>Invoice no.: ${invoice.orderNumber || invoice._id}</div>
                <div>Invoice date: ${formatIST(invoice.createdAt || invoice.date)}</div>
                <div>Due: ${formatIST(invoice.createdAt || invoice.date)}</div>
              </div>
            </div>
          </div>
          
          <!-- Company Info -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <div style="font-weight: bold; color: #1f2937;">Surya Medical And Optical</div>
              <div style="font-size: 14px; color: #4b5563;">
                <div>Dr. Chaturvedi</div>
                <div>suryamedical.com</div>
                <div>9234679597</div>
              </div>
            </div>
            <div>
              <div style="font-weight: bold; color: #1f2937; margin-bottom: 10px;">Bill to</div>
              <div style="font-weight: bold; color: #1f2937;">${invoice.customerName}</div>
              <div style="font-size: 14px; color: #4b5563;">${invoice.customerPhone}</div>
            </div>
          </div>
          
          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">S.No</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Item Description</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center;">Unit Type</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center;">Rate (₹)</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center;">Quantity</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map((item, idx) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    <div style="font-weight: bold;">${item.itemName}</div>
                    <div style="font-size: 12px; color: #4b5563;">${categoryMap[item.category] || categoryMap[Number(item.category)] || "Medical Item"}</div>
                  </td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.unitType || "N/A"}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">₹${Number(item.unitPrice || 0).toFixed(2)}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.quantity}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">₹${Number(item.totalPrice || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div>
              <div style="font-weight: bold; color: #1f2937; margin-bottom: 10px;">Payment instruction</div>
              <div style="font-size: 14px; color: #4b5563;">
                <div>UPI ID: suryaapps@paytm</div>
                <div>Account: 1234567890</div>
                <div>Branch: HDFC Bank</div>
                <div>IFSC CODE: HDFC0001678</div>
              </div>
            </div>
            <div style="max-width: 300px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
                <span>Subtotal:</span>
                <span>₹${Number(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
                <span>Discount (${invoice.discount || 0}%):</span>
                <span>-₹${Number((invoice.subtotal * (invoice.discount || 0)) / 100 || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px;">
                <span>Tax (${invoice.tax || 0}%):</span>
                <span>+₹${Number(((invoice.subtotal - (invoice.subtotal * (invoice.discount || 0)) / 100) * (invoice.tax || 0)) / 100 || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid #000; padding-top: 10px;">
                <span>Grand Total</span>
                <span>₹${Number(invoice.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <!-- Notes -->
          <div style="margin-top: 30px;">
            <div style="font-weight: bold; color: #1f2937; margin-bottom: 10px;">Notes</div>
            <div style="font-size: 14px; color: #4b5563;">
              Thank you for choosing our medical services. For any queries, please contact us at the above details.
            </div>
          </div>
          
          <!-- Signature -->
          <div style="text-align: right; margin-top: 50px;">
            <div style="border-bottom: 1px solid #000; width: 200px; margin-left: auto; margin-bottom: 10px;"></div>
            <div style="font-size: 14px; color: #4b5563;">Authorized Signature</div>
          </div>
        </div>
      `;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = pdfContent;
      document.body.appendChild(tempDiv);
      
      const options = {
        margin: 10,
        filename: `invoice-${invoice.orderNumber || orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(options).from(tempDiv).save();
      document.body.removeChild(tempDiv);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download PDF: ' + error.message);
    }
  };

  const handleSend = () => {
    if (!invoice || !invoice.customerPhone) {
      toast.error('Customer phone number not found!');
      return;
    }
    
    let message = `🏥 *Hospital Invoice*\n\n`;
    message += `📋 Invoice No: ${invoice.orderNumber || invoice._id}\n`;
    message += `👤 Patient: ${invoice.customerName}\n`;
    message += `📅 Date: ${formatIST(invoice.createdAt)}\n\n`;
    message += `💊 *Prescribed Items:*\n`;
    
    invoice.items?.forEach((item, idx) => {
      message += `${idx + 1}. ${item.itemName} x${item.quantity} @ ₹${item.unitPrice} = ₹${item.totalPrice}\n`;
    });
    
    message += `\n💰 *Total Amount: ₹${invoice.totalAmount || "N/A"}*\n\n`;
    message += `Thank you for choosing Surya Medical & Optical! 🙏`;
    
    const phoneNumber = invoice.customerPhone.startsWith('+91') ? invoice.customerPhone : `+91${invoice.customerPhone}`;
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading invoice...</div>;
  if (!invoice) return <div className="flex justify-center items-center min-h-screen text-red-600">Invoice not found.</div>;

  return (
    <>
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            font-size: 12px !important;
          }
          th {
            background-color: #2563eb !important;
            color: white !important;
            font-weight: bold !important;
          }
          .bg-blue-600 {
            background-color: #2563eb !important;
            color: white !important;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start no-print">
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              🖨️ Print
            </button>
            <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              📥 Download
            </button>
            <button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              📱 Send WhatsApp
            </button>
          </div>

          {/* Invoice */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden print-area">
            <div ref={printRef} className="p-8">
              {/* Header */}
              <div className="invoice-header flex justify-between items-start mb-8">
                <div className="logo text-5xl font-bold text-blue-600">SA</div>
                <div className="invoice-title text-right">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Hospital Invoice</h1>
                  
                  <div className="invoice-details text-sm text-gray-600 mt-4">
                    <div>Invoice no.: {invoice.orderNumber || invoice._id}</div>
                    <div>Invoice date: {formatIST(invoice.createdAt || invoice.date)}</div>
                    <div>Due: {formatIST(invoice.createdAt || invoice.date)}</div>
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
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 p-3 text-left text-xs uppercase font-semibold">S.No</th>
                      <th className="border border-gray-300 p-3 text-left text-xs uppercase font-semibold">Item Description</th>
                      <th className="border border-gray-300 p-3 text-center text-xs uppercase font-semibold">Unit Type</th>
                      <th className="border border-gray-300 p-3 text-center text-xs uppercase font-semibold">Rate (₹)</th>
                      <th className="border border-gray-300 p-3 text-center text-xs uppercase font-semibold">Quantity</th>
                      <th className="border border-gray-300 p-3 text-right text-xs uppercase font-semibold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="border border-gray-300 p-3 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 p-3">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-gray-600">
                            {categoryMap[item.category] || categoryMap[Number(item.category)] || "Medical Item"}
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">{item.unitType || "N/A"}</td>
                        <td className="border border-gray-300 p-3 text-center">₹{Number(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 p-3 text-right font-medium">₹{Number(item.totalPrice || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                    <span>Discount ({invoice.discount || 0}%):</span>
                    <span>-₹{Number((invoice.subtotal * (invoice.discount || 0)) / 100 || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row flex justify-between text-sm">
                    <span>Tax ({invoice.tax || 0}%):</span>
                    <span>+₹{Number(((invoice.subtotal - (invoice.subtotal * (invoice.discount || 0)) / 100) * (invoice.tax || 0)) / 100 || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row final flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Grand Total</span>
                    <span>₹{Number(invoice.totalAmount || 0).toFixed(2)}</span>
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
    </>
  );
}
