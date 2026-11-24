//! Subsistema de procesamiento de señal digital (DSP) de audio.
//! Provee componentes de control dinámico y una cadena unificada de procesamiento.

pub mod gate;
pub mod limiter;

pub use gate::NoiseGate;
pub use limiter::PeakLimiter;

/// Cadena de procesamiento DSP que encadena Puerta de Ruido y Limitador de Picos.
#[derive(Debug, Clone, PartialEq)]
pub struct AudioDspProcessor {
    pub gate: NoiseGate,
    pub limiter: PeakLimiter,
}

impl AudioDspProcessor {
    /// Crea una nueva cadena de procesamiento con componentes específicos.
    pub fn new(gate: NoiseGate, limiter: PeakLimiter) -> Self {
        Self { gate, limiter }
    }

    /// Procesa un búfer in-place a través de la cadena secuencial:
    /// 1. `NoiseGate` (silencia ruido de fondo).
    /// 2. `PeakLimiter` (previene saturación y distorsión cortando en el techo de seguridad).
    #[inline]
    pub fn process(&mut self, buffer: &mut [f32]) {
        self.gate.process(buffer);
        self.limiter.process(buffer);
    }
}

impl Default for AudioDspProcessor {
    /// Pipeline predeterminado con puerta a -45.0 dBFS y limitador a -1.0 dBFS.
    fn default() -> Self {
        Self::new(NoiseGate::default(), PeakLimiter::default())
    }
}
