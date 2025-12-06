
import React, { useState, useRef } from 'react';
import { Upload, Search, Download, AlertCircle, FileText, CheckCircle2, Lock, Table } from 'lucide-react';
import { BulkLookupResult } from '../types';
import { processBulkLookupBatch } from '../services/db';
import { useAuth } from '../services/authContext';
import { Link, useNavigate } from 'react-router-dom';

export const BulkLookupPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<'TEXT' | 'CSV'>('TEXT');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkLookupResult[] | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const isCsvAllowed = user?.plan && user.plan !== 'FREE';

  const processBatch = async (ids: string[]) => {
    if (!user) return;
    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    // 1. Normalize and Deduplicate upfront
    // This ensures frontend credit calculation matches backend exactly.
    const cleanIds = ids.map(id => 
        id.replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim()
    ).filter(Boolean);
    
    const uniqueIds = [...new Set(cleanIds)];

    const finalResults: BulkLookupResult[] = [];
    let currentBalance = user.lookupBalance || 0;
    
    // Chunk size 50 is safe for Firestore Batches (limit 500 operations total)
    const CHUNK_SIZE = 50; 
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        chunks.push(uniqueIds.slice(i, i + CHUNK_SIZE));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
        // Calculate how many items we can afford in this chunk
        // Since list is unique, 1 item = 1 credit cost
        const affordableCount = Math.min(currentBalance, chunk.length);
        
        // Split the chunk: what we can process vs what we must skip
        const idsToProcess = chunk.slice(0, affordableCount);
        const idsExceeded = chunk.slice(affordableCount);

        // 2. Process the affordable portion
        if (idsToProcess.length > 0) {
            try {
                // Backend also deduplicates, but since we are sending unique list, 
                // cost should match exactly: idsToProcess.length
                const batchResults = await processBulkLookupBatch(user.id, idsToProcess);
                finalResults.push(...batchResults);
                
                // Update local tracking
                currentBalance -= idsToProcess.length;
            } catch (e: any) {
                console.error("Batch failed", e);
                // Mark these specific IDs as failed/invalid if the DB call crashes
                idsToProcess.forEach(id => {
                    finalResults.push({ shortId: id, email: null, status: 'INVALID' });
                });
            }
        }

        // 3. Mark the rest as Quota Exceeded immediately
        idsExceeded.forEach(id => {
             finalResults.push({ shortId: id, email: null, status: 'QUOTA_EXCEEDED' });
        });

        // Update Progress
        processedCount += chunk.length;
        setProgress(Math.round((processedCount / uniqueIds.length) * 100));
        
        // Update results incrementally in UI
        setResults([...finalResults]); 
    }

    // Refresh user profile to sync the new balance from DB
    await refreshUserProfile();

    setResults(finalResults);
    setIsProcessing(false);
  };

  const handleLookup = async () => {
    const idsToLookup = textInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (idsToLookup.length === 0) return;
    await processBatch(idsToLookup);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        // Parse CSV
        const lines = text.split(/\r?\n/);
        const ids = lines.map(line => {
            const parts = line.split(',');
            return parts[0]?.trim(); 
        }).filter(id => {
            if (!id) return false;
            const lower = id.toLowerCase();
            return lower !== 'id' && lower !== 'short id' && lower !== 'shortid' && lower !== 'ezid';
        });

        if (ids.length > 0) {
            await processBatch(ids);
        } else {
            alert("No valid Short IDs found in the CSV. Please ensure IDs are in the first column.");
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
      if (!results) return;
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Short ID,Email,Status\n"
          + results.map(r => `${r.shortId},${r.email || ''},${r.status}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ezid_lookup_results_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const hasQuotaError = results?.some(r => r.status === 'QUOTA_EXCEEDED');
  const hasExpiryError = results?.some(r => r.status === 'EXPIRED');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bulk Lookup</h1>
        <p className="text-slate-500">Convert lists of Short IDs into verified email addresses.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="border-b border-slate-200 flex">
           <button 
             onClick={() => setInputMode('TEXT')}
             className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${inputMode === 'TEXT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
           >
             <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Paste List
             </div>
           </button>
           <button 
             onClick={() => setInputMode('CSV')}
             className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${inputMode === 'CSV' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
           >
             <div className="flex items-center justify-center gap-2">
                <Table className="w-4 h-4" />
                Upload CSV
                {!isCsvAllowed && <Lock className="w-3 h-3 text-orange-500" />}
             </div>
           </button>
        </div>

        <div className="p-6">
           {inputMode === 'TEXT' ? (
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Enter EZIDs (one per line or comma separated)</label>
                <textarea 
                  className="w-full h-40 border border-slate-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`rahul23\npriya_art\nezid.in/acme_sales`}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                ></textarea>
                <p className="mt-2 text-xs text-slate-500 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Real-time DB Lookup Active. Costs 1 Credit per lookup.
                </p>
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleLookup}
                        disabled={isProcessing || !textInput}
                        className={`flex items-center px-6 py-2 rounded-lg text-white font-medium transition-colors ${isProcessing || !textInput ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isProcessing ? 'Processing...' : (
                        <>
                            <Search className="w-4 h-4 mr-2" />
                            Start Lookup
                        </>
                        )}
                    </button>
                </div>
             </div>
           ) : (
             <>
                {!isCsvAllowed ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Premium Feature</h3>
                        <p className="text-slate-500 max-w-sm mb-6 text-sm">
                            Bulk CSV processing is available on <strong>Edu Pack</strong> and <strong>Business Pro</strong>. Upgrade to process thousands of IDs instantly.
                        </p>
                        <Link 
                            to="/pricing"
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            View Upgrade Options
                        </Link>
                    </div>
                ) : (
                    <>
                        <input 
                            type="file" 
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div 
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                            className={`border-2 border-dashed border-slate-300 rounded-lg h-40 flex flex-col items-center justify-center bg-slate-50 transition-colors ${isProcessing ? 'opacity-50 cursor-wait' : 'hover:bg-slate-100 cursor-pointer'}`}
                        >
                            {isProcessing ? (
                                <div className="text-center w-full max-w-xs">
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">Processing... {progress}%</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 font-medium">Click to upload CSV</p>
                                    <p className="text-xs text-slate-400 mt-1">First column should contain Short IDs</p>
                                </>
                            )}
                        </div>
                    </>
                )}
             </>
           )}
        </div>
      </div>

      {(hasQuotaError || hasExpiryError) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
           <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
           <div className="flex-1">
             <h3 className="text-red-900 font-bold text-sm">Lookup Failed</h3>
             <p className="text-red-700 text-sm mt-1">
               {hasExpiryError 
                ? "Your plan has expired. Please buy a new pass." 
                : "You ran out of credits. Some IDs were skipped."}
             </p>
           </div>
           <Link to="/pricing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 whitespace-nowrap shadow-sm">
             Buy Credits
           </Link>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
           <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                Results Ready ({results.length})
              </h3>
              {isCsvAllowed ? (
                  <button onClick={handleExportCSV} className="text-indigo-600 text-sm font-medium hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </button>
              ) : (
                  <Link to="/pricing" className="text-orange-500 text-sm font-medium hover:text-orange-700 flex items-center bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors">
                    <Lock className="w-3 h-3 mr-1" />
                    Unlock Export
                  </Link>
              )}
           </div>
           <div className="max-h-96 overflow-y-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 shadow-sm">
                 <tr>
                   <th className="px-6 py-3 font-medium">Input ID</th>
                   <th className="px-6 py-3 font-medium">Status</th>
                   <th className="px-6 py-3 font-medium">Resulting Email</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                 {results.map((res, idx) => (
                   <tr key={idx} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-mono text-slate-700">{res.shortId}</td>
                     <td className="px-6 py-4">
                       {res.status === 'FOUND' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Found
                         </span>
                       )}
                       {res.status === 'NOT_FOUND' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           Not Found
                         </span>
                       )}
                       {res.status === 'INVALID' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                           Invalid
                         </span>
                       )}
                       {res.status === 'QUOTA_EXCEEDED' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                           No Credits
                         </span>
                       )}
                       {res.status === 'EXPIRED' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                           Plan Expired
                         </span>
                       )}
                     </td>
                     <td className="px-6 py-4 font-mono text-slate-600">
                       {res.email || <span className="text-slate-300 italic">N/A</span>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};
