import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Upload, CheckCircle2, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CARIBBEAN_COUNTRIES, GLOBAL_COUNTRIES } from '../../data/countries';

export const KycView: React.FC = () => {
  const { user, submitKyc, showToast } = useApp();

  const [idType, setIdType] = useState('Passport');
  const [docNumber, setDocNumber] = useState('');
  const [issueCountry, setIssueCountry] = useState(user.country || 'Jamaica');
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      submitKyc('tier2', {
        idType,
        docNumber,
        issueCountry
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-extrabold text-white">Identity Verification (KYC)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Regulatory compliance under FINRA, SEC, and CFTC broker-dealer verification directives.
        </p>
      </div>

      {/* Current Status Card */}
      <div className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              user.isKycVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {user.isKycVerified ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Account Compliance Status</div>
            <div className="text-lg font-extrabold text-white">{user.kycTier}</div>
            <div className="text-xs text-slate-400">
              {user.isKycVerified
                ? 'Your account has full institutional clearance and unlimited withdrawal capabilities.'
                : user.kycTier === 'Pending Verification'
                ? 'Your documents have been submitted to compliance and are under active review by the admin desk.'
                : 'Complete document submission below to lift daily withdrawal caps.'}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Form */}
      {!user.isKycVerified && (
        <form onSubmit={handleSubmit} className="bg-[#0a1020] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Submit Legal Documents
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Passport">International Passport</option>
                <option value="DriversLicense">Driver's License</option>
                <option value="NationalID">Government National ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Identification Number
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. A98234112"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Issuing Country / Territory
              </label>
              <select
                value={issueCountry}
                onChange={(e) => setIssueCountry(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white cursor-pointer"
              >
                <optgroup label="🌴 Caribbean Countries & Territories">
                  {CARIBBEAN_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌍 Global & International">
                  {GLOBAL_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Upload Area for Government ID */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Front Photo of Document
            </label>
            <div
              onClick={() => {
                setFrontUploaded(true);
                showToast('Front ID image uploaded successfully', 'info');
              }}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
                frontUploaded
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 hover:border-blue-500/60 bg-slate-900/60 text-slate-400'
              }`}
            >
              <Upload size={24} className="mx-auto mb-2 text-blue-400" />
              <div className="text-xs font-bold text-white">
                {frontUploaded ? '✓ Document Loaded: passport_scan.pdf' : 'Click to Upload Document Photo'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">PNG, JPG, or PDF up to 25MB</div>
            </div>
          </div>

          {/* Upload Area for Address Verification */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Proof of Address (Utility Bill or Bank Statement &lt; 90 days)
            </label>
            <div
              onClick={() => {
                setProofUploaded(true);
                showToast('Proof of address uploaded successfully', 'info');
              }}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
                proofUploaded
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 hover:border-blue-500/60 bg-slate-900/60 text-slate-400'
              }`}
            >
              <FileText size={24} className="mx-auto mb-2 text-indigo-400" />
              <div className="text-xs font-bold text-white">
                {proofUploaded ? '✓ Document Loaded: utility_statement.pdf' : 'Click to Upload Proof of Address'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Must clearly show your full legal name and address</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Verifying Documents with Compliance...' : 'Submit Verification for Approval'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}
    </div>
  );
};
