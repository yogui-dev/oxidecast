//! Puerta de ruido configurable (Noise Gate).
//! Silencia o atenúa señales por debajo de un umbral en dBFS para eliminar ruido de fondo.

/// Puerta de ruido para búferes de audio PCM flotante (`f32`).
#[derive(Debug, Clone, PartialEq)]
pub struct NoiseGate {
    /// Umbral en dBFS (ej. -45.0 dBFS).
    threshold_db: f32,
    /// Umbral lineal precalculado (ej. 10^(-45/20) ~ 0.00562).
    linear_threshold: f32,
}

impl NoiseGate {
    /// Crea una nueva instancia de `NoiseGate` dado un umbral en dBFS.
    pub fn new(threshold_db: f32) -> Self {
        let linear_threshold = 10.0f32.powf(threshold_db / 20.0);
        Self {
            threshold_db,
            linear_threshold,
        }
    }

    /// Retorna el umbral configurado en dBFS.
    pub fn threshold_db(&self) -> f32 {
        self.threshold_db
    }

    /// Retorna el umbral lineal equivalente.
    pub fn linear_threshold(&self) -> f32 {
        self.linear_threshold
    }

    /// Actualiza el umbral en dBFS recalculando el valor lineal.
    pub fn set_threshold_db(&mut self, threshold_db: f32) {
        self.threshold_db = threshold_db;
        self.linear_threshold = 10.0f32.powf(threshold_db / 20.0);
    }

    /// Procesa un búfer de audio in-place silenciando las muestras cuyo nivel absoluto
    /// caiga estrictamente por debajo del umbral lineal.
    #[inline]
    pub fn process(&mut self, buffer: &mut [f32]) {
        let threshold = self.linear_threshold;
        for sample in buffer.iter_mut() {
            if sample.abs() < threshold {
                *sample = 0.0;
            }
        }
    }
}

impl Default for NoiseGate {
    /// Umbral predeterminado de -45.0 dBFS para eliminación de ruido ambiental.
    fn default() -> Self {
        Self::new(-45.0)
    }
}
