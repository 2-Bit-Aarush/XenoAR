
import React from 'react';
import { StoredModel } from '../types';

interface LibraryProps {
  models: StoredModel[];
  onSelect: (model: StoredModel) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const Library: React.FC<LibraryProps> = ({ models, onSelect, onDelete, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-bold text-white">Object Library</h2>
        <div className="w-10"></div>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl border border-dashed border-white/10">
          <p className="text-gray-500 italic">Your library is empty. Start a scan to create 3D objects.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => (
            <div key={model.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{model.name}</h3>
                  <p className="text-xs text-gray-500 mono uppercase">{new Date(model.timestamp).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => onDelete(model.id)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => onSelect(model)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-900/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View in AR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
