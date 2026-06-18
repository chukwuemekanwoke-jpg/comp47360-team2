import React from 'react';

export default function SettingsPanel({ 
  uploadedMenu, 
  setUploadedMenu, 
  accessibility, 
  setAccessibility, 
  allergenMeta, 
  allergens, 
  setAllergens 
}) {

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

  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* SECTION 1: MENU DIGITIZATION */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 shadow-xl space-y-4">
        <div className="border-b border-zinc-800 pb-3">
          <h3 className="text-xl font-serif font-bold text-zinc-100">Upload Your Menu Here</h3>
          <p className="text-zinc-400 text-xs font-mono mt-1">Upload a PDF, JPEG or PNG of your menu.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-zinc-950/60 rounded-xl border border-dashed border-zinc-800">
          <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-5 py-3 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-amber-400 transition-all shadow-md">
            📂 Choose File
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
          </label>
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-zinc-300">
              {uploadedMenu ? `Selected: ${uploadedMenu}` : "No file uploaded"}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: PHYSICAL ACCESSIBILITY REGISTRY */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 shadow-xl space-y-4">
        <h3 className="text-xl font-serif font-bold text-zinc-100">Physical Accessibility Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(accessibility).map((key) => (
            <div 
              key={key} 
              onClick={() => handleAccessibilityToggle(key)}
              className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer ${
                accessibility[key] ? 'bg-purple-950/20 border-purple-500/40' : 'bg-zinc-950/40 border-zinc-850'
              }`}
            >
              <p className="text-sm font-bold text-zinc-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <div className={`w-10 h-6 flex items-center rounded-full p-1 ${accessibility[key] ? 'bg-purple-500 justify-end' : 'bg-zinc-800 justify-start'}`}>
                <div className="bg-white w-4 h-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SYSTEMIC ALLERGEN MATRIX */}
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80 shadow-xl space-y-4">
        <h3 className="text-xl font-serif font-bold text-zinc-100">Allergen Safety Profile</h3>
        <div className="space-y-4">
          {allergenMeta.map((allergen) => (
            <div 
              key={allergen.key}
              onClick={() => handleAllergenToggle(allergen.key)}
              className={`flex items-center justify-between p-5 rounded-xl border cursor-pointer ${
                allergens[allergen.key] ? 'bg-amber-950/10 border-amber-500/30' : 'bg-zinc-950/40 border-zinc-850'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{allergen.icon}</span>
                <h4 className="text-sm font-bold text-zinc-200">{allergen.label}</h4>
              </div>
              <div className={`w-12 h-6 flex items-center rounded-full p-1 ${allergens[allergen.key] ? 'bg-amber-500 justify-end' : 'bg-zinc-800 justify-start'}`}>
                <div className="bg-white w-4 h-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}