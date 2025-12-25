import React from 'react';
import { Tutorial } from '../types';
import { PlayCircle } from 'lucide-react';

interface TutorialModuleProps {
  tutorials: Tutorial[];
  isDarkMode: boolean;
}

export const TutorialModule: React.FC<TutorialModuleProps> = ({ tutorials, isDarkMode }) => {
  return (
    <div className="space-y-6 animate-fade-in">
        <header className="mb-8 border-b border-slate-700 pb-4">
          <h2 className={`text-3xl font-serif ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Central de Aprendizado</h2>
          <p className="text-slate-400">Domine todas as funcionalidades do seu Alfred.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map(tut => (
                <div key={tut.id} className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center group cursor-pointer">
                        <iframe 
                            src={tut.videoUrl} 
                            title={tut.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="p-4">
                        <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{tut.title}</h3>
                        <p className="text-xs text-slate-500">{tut.description}</p>
                    </div>
                </div>
            ))}
        </div>
        {tutorials.length === 0 && (
            <div className="text-center py-20 text-slate-500">Nenhum tutorial disponível no momento.</div>
        )}
    </div>
  );
};