
import React, { useState, useEffect } from 'react';
import { AppState, CaptureImage, Object3DParams, StoredModel } from './types';
import { reconstructFromImages } from './services/geminiService';
import CaptureUI from './components/CaptureUI';
import SpatialViewer from './components/SpatialViewer';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [library, setLibrary] = useState<StoredModel[]>([]);
  const [currentParams, setCurrentParams] = useState<Object3DParams | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initializing...');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('xenoar_spatial_v1');
    if (saved) {
      try { setLibrary(JSON.parse(saved)); } catch (e) { console.error(e); }
    }

    if (appState === AppState.WELCOME) {
      const timer = setTimeout(() => setAppState(AppState.HOME), 3500);
      return () => clearTimeout(timer);
    }

    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => {
    localStorage.setItem('xenoar_spatial_v1', JSON.stringify(library));
  }, [library]);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    }
  };

  const handleCaptureComplete = async (images: CaptureImage[]) => {
    setAppState(AppState.SCAN_PROCESSING);
    setLoadingMsg("EXTRACTING SPATIAL DATA...");

    try {
      setTimeout(() => setLoadingMsg("MAPPING GEOMETRIC PRIMITIVES..."), 2000);
      setTimeout(() => setLoadingMsg("SYNTHESIZING DIGITAL TWIN..."), 4000);

      const params = await reconstructFromImages(images);
      setCurrentParams(params);
      setAppState(AppState.VIEWER);
    } catch (err: any) {
      alert("Error: " + err.message);
      setAppState(AppState.HOME);
    }
  };

  const saveToLibrary = () => {
    if (!currentParams) return;
    const newModel: StoredModel = {
      id: Math.random().toString(36).substr(2, 9),
      name: currentParams.name,
      timestamp: Date.now(),
      params: currentParams
    };
    setLibrary(prev => [newModel, ...prev]);
    setAppState(AppState.LIBRARY);
  };

  if (appState === AppState.WELCOME) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-10 animate-in fade-in duration-1000">
        <div className="relative mb-8">
          <div className="w-32 h-32 border-2 border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full blur-2xl animate-pulse opacity-20" />
            <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.09-.36.14-.57.14s-.41-.05-.57-.14l-7.9-4.44c-.31-.17-.53-.51-.53-.88V7.5c0-.38.21-.71.53-.88l7.9-4.44c.16-.09.36-.14.57-.14s.41.05.57.14l7.9 4.44c.31.17.53.51.53.88v9z" />
            </svg>
          </div>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter mb-2">XENO<span className="text-blue-500">AR</span></h1>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500 animate-loading w-1/3"></div>
        </div>
        <p className="mt-4 text-[10px] text-blue-500/40 mono tracking-[0.5em] uppercase">NEURAL SPATIAL LINK</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 max-w-xl mx-auto flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex justify-between items-center mb-10 pt-4">
        <div onClick={() => setAppState(AppState.HOME)} className="cursor-pointer">
          <h1 className="text-xl font-black text-white">XENO<span className="text-blue-500">AR</span></h1>
          <p className="text-[8px] text-gray-700 mono tracking-widest uppercase">System v2.5</p>
        </div>
        <div className="flex gap-2">
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
            >
              Install App
            </button>
          )}
          <button
            onClick={() => setAppState(AppState.LIBRARY)}
            className="p-3 glass rounded-2xl text-gray-500 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {appState === AppState.HOME && (
          <div className="flex-1 flex flex-col justify-center gap-6 animate-in slide-in-from-bottom-8 duration-500">
            <div
              onClick={() => setAppState(AppState.SCAN_CAPTURE)}
              className="glass p-10 rounded-[3rem] border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer active:scale-95 shadow-2xl"
            >
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Capture Object</h2>
              <p className="text-gray-500 text-sm leading-relaxed">Synthesize high-fidelity 3D twins of physical objects using AI vision.</p>
            </div>

            <div
              onClick={() => setAppState(AppState.LIBRARY)}
              className="glass p-10 rounded-[3rem] border border-white/5 hover:border-white/10 transition-all group cursor-pointer active:scale-95 shadow-lg"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Spatial Library</h2>
              <p className="text-gray-500 text-sm leading-relaxed">Access and deploy your saved digital assets into augmented reality.</p>
              {library.length > 0 && <span className="mt-4 inline-block text-[10px] font-bold text-blue-500 mono bg-blue-500/10 px-3 py-1 rounded-full">{library.length} ASSETS READY</span>}
            </div>
          </div>
        )}

        {appState === AppState.SCAN_CAPTURE && (
          <CaptureUI onComplete={handleCaptureComplete} onCancel={() => setAppState(AppState.HOME)} />
        )}

        {appState === AppState.SCAN_PROCESSING && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
            <div className="relative mb-12">
              <div className="w-24 h-24 border-4 border-blue-500/20 rounded-3xl animate-[spin_4s_ease-in-out_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-500 rounded-lg blur-xl animate-pulse" />
              </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2 tracking-tight">Reconstructing Topology</h3>
            <p className="text-gray-500 text-[10px] mono tracking-[0.4em] uppercase animate-pulse">{loadingMsg}</p>
          </div>
        )}

        {appState === AppState.VIEWER && currentParams && (
          <SpatialViewer params={currentParams} onSave={saveToLibrary} onBack={() => setAppState(AppState.HOME)} />
        )}

        {appState === AppState.LIBRARY && (
          <div className="animate-in slide-in-from-bottom-8 flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setAppState(AppState.HOME)} className="text-gray-600 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <h2 className="text-2xl font-black text-white">Registry</h2>
            </div>

            {library.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 glass rounded-[2rem] border-dashed border-white/5 opacity-50">
                <p className="text-gray-500 italic">Core database is empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {library.map(model => (
                  <div
                    key={model.id}
                    onClick={() => { setCurrentParams(model.params); setAppState(AppState.VIEWER); }}
                    className="glass p-6 rounded-3xl border border-white/5 hover:border-blue-500/20 transition-all flex items-center gap-6 group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-8 h-8 rounded-full border-2 border-blue-500/40" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold">{model.name}</h4>
                      <p className="text-[10px] text-gray-500 mono uppercase">{new Date(model.timestamp).toLocaleDateString()} // {model.params.shapeType}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLibrary(l => l.filter(m => m.id !== model.id)); }}
                      className="text-gray-700 hover:text-red-500 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-10 py-6 text-center border-t border-white/5">
        <p className="text-[10px] mono text-gray-800 tracking-[0.6em] uppercase">Xeno Spatial Technologies // Unified Core</p>
      </footer>
    </div>
  );
};

export default App;
