import React, { useState } from 'react';
import { Radio, Monitor, Sliders, Play, Square, Layers, Activity } from 'lucide-react';
import { DualCanvas } from './components/DualCanvas';

export const App: React.FC = () => {
  const [isLive, setIsLive] = useState(false);

  const toggleBroadcast = () => {
    setIsLive((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-oxide-canvas text-gray-200 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-14 border-b border-gray-800 bg-oxide-surface px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-oxide-rust flex items-center justify-center text-white shadow-md">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              OxideCast
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-orange-400 font-mono font-medium border border-gray-700">
                v0.1.0-mvp
              </span>
            </h1>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded text-xs font-mono">
            <Activity className={`h-3.5 w-3.5 ${isLive ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
            <span className={isLive ? 'text-green-400 font-semibold' : 'text-gray-400'}>
              {isLive ? 'EN VIVO' : 'STANDBY'}
            </span>
          </div>

          <button
            onClick={toggleBroadcast}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-sm transition-all duration-150 shadow-md ${
              isLive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-oxide-rust hover:bg-orange-600 text-white active:scale-95'
            }`}
          >
            {isLive ? (
              <>
                <Square className="h-4 w-4 fill-current" />
                Detener Emisión
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Iniciar Emisión Dual
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Canvas & Stream Preview */}
        <section className="col-span-8 flex flex-col gap-4 overflow-y-auto">
          <DualCanvas />

          {/* Scenes & Sources Dock */}
          <div className="h-44 grid grid-cols-2 gap-4">
            <div className="bg-oxide-surface border border-gray-800 rounded-lg p-3 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                <Layers className="h-3.5 w-3.5 text-oxide-rust" />
                Escenas
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                <div className="px-2.5 py-1.5 rounded bg-gray-800/80 border border-gray-700 text-xs text-white font-medium cursor-pointer">
                  Escena 1 - Pantalla Completa + Cam
                </div>
                <div className="px-2.5 py-1.5 rounded hover:bg-gray-800/40 text-xs text-gray-400 cursor-pointer">
                  Escena 2 - Solo Cámara
                </div>
                <div className="px-2.5 py-1.5 rounded hover:bg-gray-800/40 text-xs text-gray-400 cursor-pointer">
                  Escena 3 - Intermedio / Pausa
                </div>
              </div>
            </div>

            <div className="bg-oxide-surface border border-gray-800 rounded-lg p-3 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                <Monitor className="h-3.5 w-3.5 text-oxide-rust" />
                Fuentes
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-800/40 text-xs text-gray-300">
                  <span>Captura de Pantalla 1</span>
                  <span className="text-[10px] text-gray-500 font-mono">DXGI</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gray-800/40 text-xs text-gray-300">
                  <span>Cámara Web HD</span>
                  <span className="text-[10px] text-gray-500 font-mono">MediaFoundation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Audio & Stream Telemetry */}
        <aside className="col-span-4 flex flex-col gap-4">
          {/* Audio Mixer */}
          <div className="flex-1 bg-oxide-surface border border-gray-800 rounded-lg p-3 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              <Sliders className="h-3.5 w-3.5 text-oxide-rust" />
              Mezclador de Audio
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Audio del Escritorio (WASAPI)</span>
                  <span className="text-gray-500 font-mono">-6.0 dB</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div className="h-full bg-green-500 rounded-full w-[70%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Micrófono Principal</span>
                  <span className="text-gray-500 font-mono">-12.0 dB</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div className="h-full bg-green-500 rounded-full w-[55%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry / Status */}
          <div className="h-44 bg-oxide-surface border border-gray-800 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Activity className="h-3.5 w-3.5 text-oxide-rust" />
              Telemetría de Red y Hardware
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[10px]">CPU</span>
                <span className="text-gray-200 font-semibold">1.8%</span>
              </div>
              <div className="p-2 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[10px]">RAM</span>
                <span className="text-gray-200 font-semibold">142 MB</span>
              </div>
              <div className="p-2 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[10px]">FPS</span>
                <span className="text-gray-200 font-semibold">60.0</span>
              </div>
              <div className="p-2 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[10px]">CUADROS PERDIDOS</span>
                <span className="text-gray-200 font-semibold">0 (0.0%)</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-gray-800 bg-oxide-surface px-4 flex items-center justify-between text-[11px] font-mono text-gray-400">
        <div className="flex items-center gap-4">
          <span>Motor: <span className="text-gray-200 font-semibold">Rust / Tokio</span></span>
          <span>Audio: <span className="text-gray-200 font-semibold">WASAPI Baja Latencia</span></span>
          <span className="text-orange-400 font-semibold">Creado con orgullo en Chile 🇨🇱</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Tauri v2 IPC Conectado
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
