import { useState } from 'react';

export default function SettingsPanel({ 
  uploadedMenu, 
  setUploadedMenu, 
  accessibility, 
  setAccessibility, 
  allergenMeta, 
  allergens, 
  setAllergens,
  onSaveSettings 
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleAccessibilityToggle = (key) => {
    setAccessibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAllergenToggle = (key) => {
    setAllergens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedMenu(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSaveSettings) return;
    
    setIsSaving(true);
    try {
      await onSaveSettings();
    } catch (err) {
      console.error("Settings save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* PERSISTENCE ACTION BAR */}
      <div className="bg-[#171E26] p-4 rounded-2xl border border-[#232D3A] shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Database Sync Status</p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">Save changes to update live filtering indexes across user apps.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-950 transition-all shadow-md ${
            isSaving 
              ? 'bg-slate-600 opacity-50 cursor-not-allowed text-slate-300' 
              : 'bg-[#33e1cc] hover:bg-[#2bc2b0] active:scale-[0.99]'
          }`}
        >
          {isSaving ? '⏳ Syncing DB...' : '💾 Save Changes'}
        </button>
      </div>

      {/* SECTION 1: MENU DIGITIZATION */}
      <div className="bg-[#171E26] p-6 rounded-2xl border border-[#232D3A] shadow-xl space-y-4">
        <div className="border-b border-[#232D3A] pb-3">
          <h3 className="text-xl font-serif font-bold text-slate-100">Upload Your Menu Here</h3>
          <p className="text-slate-400 text-xs font-mono mt-1">Upload a PDF, JPEG or PNG of your menu.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-[#0E1318]/60 rounded-xl border border-dashed border-[#232D3A]">
          <label className="cursor-pointer bg-[#11161D] hover:bg-[#0E1318] border border-[#232D3A] px-5 py-3 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-[#e29c36] transition-all shadow-md">
            📂 Choose File
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
          </label>
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-slate-300">
              {uploadedMenu ? `Selected: ${uploadedMenu}` : "No file uploaded"}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: PHYSICAL ACCESSIBILITY REGISTRY */}
      <div className="bg-[#171E26] p-6 rounded-2xl border border-[#232D3A] shadow-xl space-y-4">
        <h3 className="text-xl font-serif font-bold text-slate-100">Physical Accessibility Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(accessibility).map((key) => (
            <div 
              key={key} 
              onClick={() => handleAccessibilityToggle(key)}
              className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer transition-all ${
                accessibility[key] ? 'bg-purple-950/20 border-purple-500/40' : 'bg-[#0E1318] border-[#232D3A]'
              }`}
            >
              <p className="text-sm font-bold text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-all ${accessibility[key] ? 'bg-purple-500 justify-end' : 'bg-[#11161D] justify-start'}`}>
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SYSTEMIC ALLERGEN MATRIX */}
      <div className="bg-[#171E26] p-6 rounded-2xl border border-[#232D3A] shadow-xl space-y-4">
        <h3 className="text-xl font-serif font-bold text-slate-100">Allergen Safety Profile</h3>
        <div className="space-y-4">
          {allergenMeta.map((allergen) => (
            <div 
              key={allergen.key}
              onClick={() => handleAllergenToggle(allergen.key)}
              className={`flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all ${
                allergens[allergen.key] ? 'bg-[#e29c36]/10 border-[#e29c36]/40' : 'bg-[#0E1318] border-[#232D3A]'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{allergen.icon}</span>
                <h4 className="text-sm font-bold text-slate-200">{allergen.label}</h4>
              </div>
              <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${allergens[allergen.key] ? 'bg-[#e29c36] justify-end' : 'bg-[#11161D] justify-start'}`}>
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}