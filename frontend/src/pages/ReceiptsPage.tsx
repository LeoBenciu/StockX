import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { receiptsApi } from '../services/api';
import { Upload, Receipt, Trash2, Loader } from 'lucide-react';
import { format } from 'date-fns';

interface Receipt {
  id: string;
  fileName: string;
  fileUrl: string;
  receiptDate?: string;
  totalAmount?: number;
  status: string;
  createdAt: string;
  items: any[];
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await receiptsApi.getAll();
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      await receiptsApi.create(acceptedFiles[0]);
      await loadReceipts();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      alert('Eroare la încărcarea bonului');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest bon?')) return;

    try {
      await receiptsApi.delete(id);
      await loadReceipts();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Eroare la ștergerea bonului');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Se încarcă...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bonuri</h1>
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
            <p className="text-gray-600">Se încarcă bonul...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {isDragActive ? 'Lasă bonul aici' : 'Trage și lasă un bon aici sau fă clic pentru a selecta'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Fișiere PDF sau imagini</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{receipt.fileName}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      {receipt.receiptDate && (
                        <span>Data: {format(new Date(receipt.receiptDate), 'dd MMM yyyy')}</span>
                      )}
                      {receipt.totalAmount && (
                        <span className="ml-4">Total: {receipt.totalAmount.toFixed(2)} RON</span>
                      )}
                      <span className="ml-4">
                        Status:{' '}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            receipt.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : receipt.status === 'PROCESSING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : receipt.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {receipt.status === 'COMPLETED' ? 'Finalizat' : 
                           receipt.status === 'PROCESSING' ? 'În procesare' :
                           receipt.status === 'FAILED' ? 'Eșuat' : 'În așteptare'}
                        </span>
                      </span>
                    </div>
                    {receipt.items && receipt.items.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {receipt.items.length} produs(e) vândut(e)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={receipt.fileUrl.startsWith('http') ? receipt.fileUrl : `http://localhost:3000${receipt.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Vezi
                  </a>
                  <button
                    onClick={() => handleDelete(receipt.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {receipts.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nu au fost încărcate bonuri</div>
        )}
      </div>
    </div>
  );
}

