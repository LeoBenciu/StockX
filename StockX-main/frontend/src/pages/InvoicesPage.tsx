import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { invoicesApi } from '../services/api';
import { Upload, FileText, Trash2, Loader, Package } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  fileName: string;
  fileUrl: string;
  supplierName?: string;
  invoiceDate?: string;
  totalAmount?: number;
  status: string;
  createdAt: string;
  items: any[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoicesApi.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      console.log('Uploading invoice:', acceptedFiles[0].name);
      const invoice = await invoicesApi.create(acceptedFiles[0]);
      console.log('Invoice uploaded:', invoice);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload invoices to see updated status
      await loadInvoices();
      
      // Show success message
      if (invoice.items && invoice.items.length > 0) {
        alert(`Factură procesată cu succes! ${invoice.items.length} articol(e) extrase și adăugate în inventar.`);
      } else {
        alert('Factură încărcată, dar nu au fost extrase articole. Verifică logurile backend-ului.');
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      alert('Eroare la încărcarea facturii: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
  });

  const handleAddToInventory = async (id: string) => {
    try {
      await invoicesApi.addToInventory(id);
      alert('Articolele au fost adăugate în inventar');
      await loadInvoices();
    } catch (error) {
      console.error('Error adding to inventory:', error);
      alert('Eroare la adăugarea în inventar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această factură?')) return;

    try {
      await invoicesApi.delete(id);
      await loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Eroare la ștergerea facturii');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Se încarcă...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Facturi</h1>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Se încarcă factura...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {isDragActive ? 'Lasă factura aici' : 'Trage și lasă o factură aici sau fă clic pentru a selecta'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Fișiere PDF sau imagini</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{invoice.fileName}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      {invoice.supplierName && <span>Furnizor: {invoice.supplierName}</span>}
                      {invoice.invoiceDate && (
                        <span className="ml-4">
                          Data: {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                        </span>
                      )}
                      {invoice.totalAmount && (
                        <span className="ml-4">Total: {invoice.totalAmount.toFixed(2)} RON</span>
                      )}
                      <span className="ml-4">
                        Status:{' '}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'PROCESSING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : invoice.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {invoice.status === 'COMPLETED' ? 'Finalizat' : 
                           invoice.status === 'PROCESSING' ? 'În procesare' :
                           invoice.status === 'FAILED' ? 'Eșuat' : 'În așteptare'}
                        </span>
                      </span>
                    </div>
                    {invoice.items && invoice.items.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-600 mb-1">
                          {invoice.items.length} articol(e) extras(e)
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.items.map((item: any, idx: number) => (
                            <span key={idx}>
                              {item.itemName} ({item.quantity} {item.unit})
                              {idx < invoice.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={invoice.fileUrl.startsWith('http') ? invoice.fileUrl : `http://localhost:3000${invoice.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Vezi
                  </a>
                  {invoice.items && invoice.items.length > 0 && (
                    <button
                      onClick={() => handleAddToInventory(invoice.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Adaugă articolele în inventar"
                    >
                      <Package className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nu au fost încărcate facturi</div>
        )}
      </div>
    </div>
  );
}

