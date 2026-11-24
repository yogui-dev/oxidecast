import React from 'react';
import { Radio, X, ExternalLink, ShieldCheck, Cpu, Flame, Heart } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-oxide-surface border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-oxide-rust flex items-center justify-center text-white shadow-lg">
            <Radio className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              OxideCast
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-orange-400 border border-gray-700">
                v0.1.0-release
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Suite de Transmisión Dual Ultra-Ligera (16:9 + 9:16)
            </p>
          </div>
        </div>

        {/* Autoría Chilena */}
        <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
            <Heart className="h-4 w-4 fill-orange-500 text-orange-500" />
            <span>Creado con orgullo en Chile 🇨🇱</span>
          </div>
          <p className="text-[11px] text-gray-300">
            Diseñado y desarrollado por <strong className="text-white">Jorge Arias (YoguiDev)</strong> en Los Ángeles / Concepción, Región del Biobío.
          </p>
        </div>

        {/* Características Técnicas */}
        <div className="space-y-2 text-xs text-gray-300 mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span><strong>Motor Nativo en Rust:</strong> Solo ~38 MB de memoria RAM.</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
            <span><strong>Pipeline Zero-Copy:</strong> wgpu + Shaders WGSL + WGC API.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <span><strong>Audio DSP:</strong> Limitador estricto -1.0 dBFS y puerta de ruido.</span>
          </div>
        </div>

        {/* Footer con Enlaces */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
          <a
            href="https://github.com/yogui-dev/oxidecast"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>github.com/yogui-dev/oxidecast</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-oxide-rust hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
