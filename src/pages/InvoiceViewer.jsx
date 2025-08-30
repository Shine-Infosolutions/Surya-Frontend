// InvoiceViewer.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import html2pdf from 'html2pdf.js';

console.log('html2pdf imported:', html2pdf);


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
    console.log('Download button clicked');
    
    if (!printRef.current) {
      console.error('printRef.current is null');
      toast.error('Invoice content not found');
      return;
    }
    
    console.log('printRef.current found:', printRef.current);
    
    try {
      console.log('Starting PDF generation...');
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `hospital-invoice-${invoice.invoiceNumber || invoice.orderNumber || orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      console.log('PDF options:', options);
      await html2pdf().set(options).from(printRef.current).save();
      console.log('PDF generated successfully');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF: ' + error.message);
    }
  };

  const handleSend = async () => {
    if (!invoice || !invoice.customerPhone) {
      toast.error('Customer phone number not found');
      return;
    }
    
    const phoneNumber = invoice.customerPhone.replace(/[^0-9]/g, '');
    if (phoneNumber.length !== 10) {
      toast.error('Invalid phone number');
      return;
    }
    
    try {
      // Generate PDF first
      if (!printRef.current) {
        toast.error('Invoice content not found');
        return;
      }
      
      toast.info('Generating PDF and opening WhatsApp...');
      
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `invoice-${invoice.invoiceNumber || invoice.orderNumber || orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      // Generate and download PDF
      await html2pdf().set(options).from(printRef.current).save();
      
      // Create WhatsApp message
      let message = `🏥 *Hospital Invoice*%0A%0A`;
      message += `📋 Invoice No: ${invoice.invoiceNumber || invoice.orderNumber || invoice._id}%0A`;
      message += `👤 Patient: ${invoice.customerName}%0A`;
      message += `📅 Date: ${formatIST(invoice.createdAt)}%0A`;
      message += `💰 Total: ₹${invoice.totalAmount || "N/A"}%0A%0A`;
      message += `📄 *Invoice PDF downloaded to your device.*%0A`;
      message += `Please attach the PDF file to this chat.%0A%0A`;
      message += `🏥 Surya Medical And Optical%0A`;
      message += `📞 9234679597`;
      
      const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${message}`;
      
      // Small delay to ensure PDF download starts
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        toast.success('PDF downloaded! Please attach it in WhatsApp chat.');
      }, 1000);
      
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading invoice...</div>;
  if (!invoice) return <div className="flex justify-center items-center min-h-screen text-red-600">Invoice not found.</div>;

  return (
    <>
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .invoice-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            margin-bottom: 30px !important;
          }
          .logo {
            font-size: 48px !important;
            font-weight: bold !important;
            color: #2563eb !important;
          }
          .invoice-title {
            text-align: right !important;
          }
          .invoice-title h1 {
            font-size: 24px !important;
            margin: 0 !important;
            color: #333 !important;
          }
          .company-info {
            display: flex !important;
            justify-content: space-between !important;
            margin: 30px 0 !important;
          }
          .items-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 30px 0 !important;
          }
          .items-table th {
            background: #2563eb !important;
            color: white !important;
            padding: 12px !important;
            text-align: left !important;
            font-size: 12px !important;
          }
          .items-table td {
            padding: 12px !important;
            border-bottom: 1px solid #eee !important;
          }
          .totals-section {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 30px !important;
          }
          .total-row {
            display: flex !important;
            justify-content: space-between !important;
            margin: 5px 0 !important;
          }
          .total-row.final {
            font-weight: bold !important;
            font-size: 16px !important;
            border-top: 1px solid #333 !important;
            padding-top: 10px !important;
            margin-top: 10px !important;
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
              📥 Download PDF
            </button>
            <button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              📱 Download & Send WhatsApp
            </button>
          </div>

          {/* Invoice */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden print-area">
            <div ref={printRef} className="p-8">
              {/* Header */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px'}}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: '#2563eb'}}>SA</div>
                <div style={{textAlign: 'right'}}>
                  <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>Hospital Invoice</h1>
                  
                  <div style={{fontSize: '14px', color: '#4b5563', marginTop: '16px'}}>
                    <div>Invoice no.: {invoice.invoiceNumber || invoice.orderNumber || invoice._id}</div>
                    <div>Invoice date: {formatIST(invoice.createdAt || invoice.date)}</div>
                    <div>Due: {formatIST(invoice.createdAt || invoice.date)}</div>
                  </div>
                </div>
              </div>
              {/* Company Info */}
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '32px'}}>
                <div style={{flex: '1', marginRight: '32px'}}>
                  <div style={{fontWeight: 'bold', color: '#1f2937'}}>Surya Medical And Optical</div>
                  <div style={{fontSize: '14px', color: '#4b5563'}}>
                    <div>Dr. Chaturvedi</div>
                    <div>suryamedical.com</div>
                    <div>9234679597</div>
                  </div>
                </div>
                
                <div style={{marginLeft: 'auto'}}>
                  <div style={{fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>Bill to</div>
                  <div style={{fontWeight: 'bold', color: '#1f2937'}}>{invoice.customerName}</div>
                  <div style={{fontSize: '14px', color: '#4b5563'}}>
                    <div>{invoice.customerPhone}</div>
                  </div>
                </div>
              </div>
              {/* Items Table */}
              <table className="items-table w-full mb-8" style={{borderCollapse: 'collapse', border: '1px solid #ddd'}}>
                <thead>
                  <tr>
                    <th style={{border: '1px solid #ddd', background: '#2563eb', color: 'white', padding: '12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase'}}>Description</th>
                    <th style={{border: '1px solid #ddd', background: '#2563eb', color: 'white', padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase'}}>Unit</th>
                    <th style={{border: '1px solid #ddd', background: '#2563eb', color: 'white', padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase'}}>Rate</th>
                    <th style={{border: '1px solid #ddd', background: '#2563eb', color: 'white', padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase'}}>QTY</th>
                    <th style={{border: '1px solid #ddd', background: '#2563eb', color: 'white', padding: '12px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase'}}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{border: '1px solid #ddd', padding: '12px'}}>
                        <div style={{fontWeight: '500'}}>{item.itemName}</div>
                        <div style={{fontSize: '14px', color: '#4b5563'}}>
                          {categoryMap[item.category] || categoryMap[Number(item.category)] || item.category || "Medical Item"}
                        </div>
                      </td>
                      <td style={{border: '1px solid #ddd', padding: '12px', textAlign: 'center'}}>{item.unitType || 'piece'}</td>
                      <td style={{border: '1px solid #ddd', padding: '12px', textAlign: 'center'}}>₹{item.unitPrice}</td>
                      <td style={{border: '1px solid #ddd', padding: '12px', textAlign: 'center'}}>{item.quantity}</td>
                      <td style={{border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: '500'}}>₹{Number(item.totalPrice || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '32px'}}>
                <div style={{flex: '1', marginRight: '40px'}}>
                  <div style={{fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>Payment instruction</div>
                  <div style={{fontSize: '14px', color: '#4b5563', marginBottom: '16px'}}>
                    <div>Scan QR Code for Payment</div>
                    <div style={{marginTop: '8px', padding: '16px', border: '1px solid #d1d5db', display: 'inline-block'}}>
                      <div style={{width: '80px', height: '80px', background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}>
                        QR CODE
                      </div>
                    </div>
                  </div>
                  <div style={{fontSize: '14px', color: '#4b5563'}}>
                    <div>UPI ID: suryaapps@paytm</div>
                    <div>Account: 1234567890</div>
                    <div>Branch:HDFC Bank</div>
                    <div>IFSC CODE:HDFC0001678</div>
                  </div>
                </div>

                <div style={{flex: '1', maxWidth: '300px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '5px 0'}}>
                    <span>Subtotal:</span>
                    <span>₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '5px 0'}}>
                    <span>Discount ({invoice.discount || 0}%):</span>
                    <span>-₹{Number((invoice.subtotal * (invoice.discount || 0)) / 100 || 0).toFixed(2)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '5px 0'}}>
                    <span>Tax ({invoice.tax || 0}%):</span>
                    <span>+₹{Number(((invoice.subtotal - (invoice.subtotal * (invoice.discount || 0)) / 100) * (invoice.tax || 0)) / 100 || 0).toFixed(2)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px'}}>
                    <span>Grand Total</span>
                    <span>₹{Number(invoice.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{marginTop: '32px'}}>
                <div style={{fontWeight: 'bold', color: '#1f2937', marginBottom: '8px'}}>Notes</div>
                <div style={{fontSize: '14px', color: '#4b5563'}}>
                  Thank you for choosing our medical services. For any queries, please contact us at the above details.
                </div>
              </div>

              {/* Signature */}
              <div style={{textAlign: 'right', marginTop: '48px'}}>
                <div style={{borderBottom: '1px solid #9ca3af', width: '200px', marginLeft: 'auto', marginBottom: '8px'}}></div>
                <div style={{fontSize: '14px', color: '#4b5563'}}>Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
