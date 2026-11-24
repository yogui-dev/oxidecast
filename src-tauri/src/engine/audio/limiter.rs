//! Limitador estricto de picos (Peak Limiter).
//! Garantiza que ninguna muestra de audio supere el techo de seguridad (por defecto -1.0 dBFS).

/// Limitador de picos digital para búferes de audio PCM flotante (`f32`).
#[derive(Debug, Clone, PartialEq)]
pub struct PeakLimiter {
    /// Techo en dBFS (ej. -1.0 dBFS).
    ceiling_db: f32,
    /// Techo lineal precalculado (ej. 10^(-1/20) ~ 0.89125).
    linear_ceiling: f32,
}

impl PeakLimiter {
    /// Crea una nueva instancia de `PeakLimiter` dado un techo en dBFS.
    pub fn new(ceiling_db: f32) -> Self {
        let linear_ceiling = 10.0f32.powf(ceiling_db / 20.0);
        Self {
            ceiling_db,
            linear_ceiling,
        }
    }

    /// Retorna el techo configurado en dBFS.
    pub fn ceiling_db(&self) -> f32 {
        self.ceiling_db
    }

    /// Retorna el techo lineal equivalente.
    pub fn linear_ceiling(&self) -> f32 {
        self.linear_ceiling
    }

    /// Actualiza el techo en dBFS recalculando el valor lineal.
    pub fn set_ceiling_db(&mut self, ceiling_db: f32) {
        self.ceiling_db = ceiling_db;
        self.linear_ceiling = 10.0f32.powf(ceiling_db / 20.0);
    }

    /// Procesa un búfer de audio in-place aplicando el clampeo estricto de picos.
    ///
    /// Cualquier muestra que supere `linear_ceiling` se clampa a dicho valor.
    /// Muestras por debajo de `-linear_ceiling` se clampan a `-linear_ceiling`.
    #[inline]
    pub fn process(&mut self, buffer: &mut [f32]) {
        let limit = self.linear_ceiling;
        for sample in buffer.iter_mut() {
            if *sample > limit {
                *sample = limit;
            } else if *sample < -limit {
                *sample = -limit;
            }
        }
    }
}

impl Default for PeakLimiter {
    /// Techo de seguridad estándar de -1.0 dBFS recomendado para emisión y streaming.
    fn default() -> Self {
        Self::new(-1.0)
    }
}
