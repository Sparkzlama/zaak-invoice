import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/invoices/${id}`)
      .then(({ data }) => setInvoice(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    const content = invoiceRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Invoice ${invoice?.invoiceNo}</title>
      <style>
        @page { margin: 0; }
        body { margin: 20px; font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 8px; text-align: left; border: 1px solid #ddd; }
        .no-border td, .no-border th { border: none; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`Invoice_${invoice.invoiceNo}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>;
  if (!invoice) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="btn-secondary text-sm">&larr; Back to Dashboard</button>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary text-sm py-1.5 px-3">Print</button>
          <button onClick={handleDownloadPDF} className="btn-primary text-sm py-1.5 px-3">Download PDF</button>
        </div>
      </div>

      <div ref={invoiceRef} className="bg-white shadow-lg rounded-xl overflow-hidden" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="bg-gradient-to-r from-brand-700 to-brand-900 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-16 w-16 rounded-lg bg-white p-1" onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <h1 className="text-2xl font-bold">ZAAK CONSTRUCTION</h1>
                <p className="text-blue-200 text-sm mt-1">Building Dreams, Delivering Quality</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">TAX INVOICE</h2>
          <p className="text-brand-700 font-semibold">{invoice.invoiceNo}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">From</p>
            <p className="font-bold text-gray-800">ZAAK CONSTRUCTION</p>
            <p className="text-sm text-gray-600">15/H, Miajan Ostagar Lane</p>
            <p className="text-sm text-gray-600">Kolkata - 700017</p>
            <p className="text-sm text-gray-600">zaakconstructionindia@gmail.com</p>
            <p className="text-sm text-gray-600">+91 - 9123749064</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-bold text-gray-800">{invoice.clientName}</p>
            {invoice.clientAddress && <p className="text-sm text-gray-600">{invoice.clientAddress}</p>}
            {invoice.clientEmail && <p className="text-sm text-gray-600">{invoice.clientEmail}</p>}
            {invoice.clientMobile && <p className="text-sm text-gray-600">{invoice.clientMobile}</p>}
          </div>
        </div>

        <div className="flex justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm">
          <span><strong>Date:</strong> {invoice.date}</span>
          <span>{invoice.dueDate ? <><strong>Due Date:</strong> {invoice.dueDate} &nbsp;|&nbsp; </> : ''}<strong>Invoice No:</strong> {invoice.invoiceNo}</span>
        </div>

        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-700 text-white">
                <th className="py-2.5 px-3 text-left">#</th>
                <th className="py-2.5 px-3 text-left">Description</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate (&#8377;)</th>
                <th className="py-2.5 px-3 text-right">Amount (&#8377;)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2.5 px-3">{i + 1}</td>
                  <td className="py-2.5 px-3">{item.description}</td>
                  <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{item.price.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-6 px-6 pb-6">
          <div>
            <div className="border border-gray-200 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2 text-gray-700">Amount in Words</p>
              <p className="text-gray-600 italic">{invoice.totalInWords}</p>
            </div>
          </div>
          <div>
            <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
              <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">&#8377;{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-gray-500">SGST @ {invoice.sgstPercent}%</span>
                <span className="font-medium">&#8377;{invoice.sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-gray-500">CGST @ {invoice.cgstPercent}%</span>
                <span className="font-medium">&#8377;{invoice.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-brand-700 text-white font-bold text-base">
                <span>Total</span>
                <span>&#8377;{invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-6 mb-6 border border-gray-200 rounded-lg p-4">
          <p className="font-semibold text-gray-700 mb-1 text-sm">Terms & Conditions</p>
          {invoice.terms ? invoice.terms.split('\n').map((line, i) => (
            <p key={i} className="text-xs text-gray-500">{line}</p>
          )) : (
            <p className="text-xs text-gray-500">1. All disputes subject to Kolkata jurisdiction.</p>
          )}
        </div>

        <div className="flex justify-between items-end px-6 pb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Authorized Signature</p>
            <img src="/signature.png" alt="Signature" className="h-12 mx-auto" onError={(e) => { e.target.style.display = 'none'; }} />
            <p className="text-xs text-gray-400 mt-1">For ZAAK CONSTRUCTION</p>
          </div>
          <div className="text-center">
            <img src="/seal.png" alt="Company Seal" className="h-16 mx-auto" onError={(e) => { e.target.style.display = 'none'; }} />
            <p className="text-xs text-gray-400 mt-1">Company Seal</p>
          </div>
        </div>

        <div className="bg-gray-100 text-center py-3 text-xs text-gray-500">
          <p>ZAAK CONSTRUCTION | 15/H, Miajan Ostagar Lane, Kolkata - 700017</p>
          <p>Email: zaakconstructionindia@gmail.com | Mobile: +91 - 9123749064</p>
        </div>
      </div>
    </div>
  );
}
