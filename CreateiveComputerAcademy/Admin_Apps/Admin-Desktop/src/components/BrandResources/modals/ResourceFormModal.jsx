import React from 'react';
import {
  FiGrid,
  FiPlus,
  FiX,
  FiShuffle,
  FiDroplet,
  FiUploadCloud
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

/**
 * ResourceFormModal Component
 * Add / Edit modal for all brand asset types (Color Hunt Palette Builder, single HEX swatches,
 * Drive templates, fonts, logos and guidelines).
 */
const ResourceFormModal = ({
  modalOpen = false,
  setModalOpen,
  editingItem = null,
  formData = {},
  setFormData,
  paletteColors = [],
  setPaletteColors,
  harmonyTemplates = [],
  generateRandomHarmony,
  isLightColor,
  handlePickColorFromScreen,
  handleFileUpload,
  uploading = false,
  handleSave,
  saving = false
}) => {
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
        formData.category === 'palette' ? 'max-w-4xl' : 'max-w-xl'
      }`}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              formData.category === 'palette' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
            }`}>
              {formData.category === 'palette' ? <FiGrid size={16} /> : <FiPlus size={16} />}
            </span>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {editingItem ? 'Edit Resource' : formData.category === 'palette' ? 'Create Color Palette (Color Hunt Harmony)' : 'Add New Brand Resource'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {formData.category === 'palette' ? 'Create harmonious 4-5 color palettes for banners and digital graphics' : 'Store official academy branding resources'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen && setModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Form with Scrollable Body & Sticky Footer */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Category selector & Title row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resource Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    if (setFormData) {
                      setFormData(prev => ({
                        ...prev,
                        category: cat,
                        value: cat === 'color' && !prev.value.startsWith('#') ? '#3B82F6' : cat === 'palette' ? paletteColors.join(',') : prev.value
                      }));
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="color">🎨 Single Color</option>
                  <option value="palette">🌈 4-Color Palette (Color Hunt Harmony)</option>
                  <option value="logo">🖼️ Official Logo / Stamp</option>
                  <option value="font">🔤 Typography & Fonts</option>
                  <option value="template">📁 Master Templates & Drive</option>
                  <option value="guideline">📜 Design Guidelines & Rules</option>
                </select>
              </div>

              <div className="sm:col-span-7">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {formData.category === 'palette' ? 'Palette Name / Theme *' : 'Title / Asset Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.category === 'palette' ? "e.g. Vintage Earth & Clay, Cyber Neon, CCA Navy Trust" : "e.g. CCA Primary Indigo, Main Vector Logo"}
                  value={formData.title}
                  onChange={(e) => setFormData && setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Main Body */}
            {formData.category === 'palette' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                {/* Left: Presets + Color Inputs */}
                <div className="lg:col-span-7 space-y-3.5">
                  {/* Random Harmony Generator Action Banner */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200/80 dark:border-purple-800/60">
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FiShuffle className="text-purple-600 dark:text-purple-400" />
                        <span>Algorithmic Harmony Generator</span>
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Auto-mix complementary, analogous & trending shades with 1-click
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={generateRandomHarmony}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                    >
                      <FiShuffle size={13} />
                      <span>Roll Random</span>
                    </button>
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                      Select Preset Color Harmony:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {harmonyTemplates.map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (setPaletteColors) setPaletteColors([...t.colors]);
                            if (setFormData) {
                              setFormData(p => ({
                                ...p,
                                ...((!formData.title || harmonyTemplates.some(ht => ht.name === formData.title)) && { title: t.name }),
                                format_tag: t.tag
                              }));
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-700 dark:text-slate-300 hover:text-purple-600 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="flex items-center -space-x-1">
                            {t.colors.map((c, ci) => (
                              <span key={ci} className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: c }} />
                            ))}
                          </span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color list slots */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Select Palette Color Shades:
                    </span>
                    <div className="space-y-2">
                      {paletteColors.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="color"
                            value={col.startsWith('#') ? col : '#3B82F6'}
                            onChange={(e) => {
                              const newCols = [...paletteColors];
                              newCols[idx] = e.target.value.toUpperCase();
                              if (setPaletteColors) setPaletteColors(newCols);
                            }}
                            className="w-9 h-8 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            required
                            value={col}
                            onChange={(e) => {
                              const newCols = [...paletteColors];
                              newCols[idx] = e.target.value.toUpperCase();
                              if (setPaletteColors) setPaletteColors(newCols);
                            }}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline px-1">
                            {idx === 0 ? 'Dominant (60%)' : idx === 1 ? 'Secondary (30%)' : idx === 2 ? 'Accent (10%)' : 'Base/Bg'}
                          </span>
                          {paletteColors.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setPaletteColors && setPaletteColors(paletteColors.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                              title="Remove"
                            >
                              <FiX size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {paletteColors.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setPaletteColors && setPaletteColors([...paletteColors, '#94A3B8'])}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <FiPlus size={13} /> + Add 5th Color
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Real Color Hunt Live Preview Card */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <HiSparkles className="text-amber-500" /> Color Hunt Preview
                      </span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                        Live Preview
                      </span>
                    </div>

                    {/* Color Hunt Card */}
                    <div className="w-full h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                      {paletteColors.map((hex, i) => {
                        const isLight = isLightColor ? isLightColor(hex) : false;
                        return (
                          <div
                            key={i}
                            className="w-full flex-1 flex items-center justify-between px-3 text-[11px] font-mono font-bold transition-all"
                            style={{ backgroundColor: hex }}
                          >
                            <span className={`px-2 py-0.5 rounded-md backdrop-blur-md shadow-2xs ${
                              isLight ? 'bg-black/20 text-slate-900' : 'bg-white/30 text-white'
                            }`}>
                              {hex}
                            </span>
                            <span className={`text-[10px] font-bold opacity-80 ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {i === 0 ? '60%' : i === 1 ? '30%' : i === 2 ? '10%' : 'Base'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Roll Button */}
                    <button
                      type="button"
                      onClick={generateRandomHarmony}
                      className="w-full mt-3 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl border border-purple-200 dark:border-purple-800/80 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-2xs"
                    >
                      <FiShuffle size={13} className="text-purple-500" />
                      <span>Generate Another Random Harmony</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    💡 This combination will appear as an interactive Color Hunt card in the Staff Portal.
                  </div>
                </div>
              </div>
            ) : (
              /* Single color / Guideline / File link */
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {formData.category === 'color' ? 'HEX Color Code *' :
                   formData.category === 'guideline' ? 'Guideline Description *' : 'Value / Asset URL / Drive Link *'}
                </label>

                {formData.category === 'color' ? (
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={formData.value?.startsWith('#') ? formData.value : '#3B82F6'}
                      onChange={(e) => setFormData && setFormData(prev => ({ ...prev, value: e.target.value.toUpperCase() }))}
                      className="w-11 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      required
                      placeholder="#1E3A8A"
                      value={formData.value}
                      onChange={(e) => setFormData && setFormData(prev => ({ ...prev, value: e.target.value.toUpperCase() }))}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handlePickColorFromScreen}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Pick color from screen (EyeDropper)"
                    >
                      <FiDroplet size={14} className="text-blue-500" />
                      <span>Pick</span>
                    </button>
                  </div>
                ) : formData.category === 'guideline' ? (
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter guidelines or design rules in detail..."
                    value={formData.value}
                    onChange={(e) => setFormData && setFormData(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="https://drive.google.com/... or paste asset link"
                      value={formData.value}
                      onChange={(e) => setFormData && setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />

                    {/* Quick File Uploader Button for Logos/Assets */}
                    {(formData.category === 'logo' || formData.category === 'template') && (
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                          <FiUploadCloud size={14} className="text-blue-500" />
                          <span>{uploading ? 'Uploading...' : 'Upload File from Computer'}</span>
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Subtitle & Format Tag Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle / Usage Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Posters, Social Media, Certificates, Web Banners"
                  value={formData.subtitle}
                  onChange={(e) => setFormData && setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Format / Category Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Social Media, Poster, Marketing, UI"
                  value={formData.format_tag}
                  onChange={(e) => setFormData && setFormData(prev => ({ ...prev, format_tag: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Sort Order, Approval Status & Active Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData && setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Approval Status
                </label>
                <select
                  value={formData.approval_status || 'approved'}
                  onChange={(e) => setFormData && setFormData(prev => ({ ...prev, approval_status: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Active Status
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData && setFormData(prev => ({ ...prev, is_active: parseInt(e.target.value) }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Actions (Sticky at bottom, ALWAYS VISIBLE) */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/95 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formData.category === 'palette' ? (
                <span>Total <strong className="text-purple-600 dark:text-purple-400">{paletteColors.length}</strong> color shades</span>
              ) : (
                <span>Category: <strong className="text-blue-600 dark:text-blue-400 capitalize">{formData.category}</strong></span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen && setModalOpen(false)}
                className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Resource'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceFormModal;
