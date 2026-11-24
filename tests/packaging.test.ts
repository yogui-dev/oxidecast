import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Configuración de Empaquetado y CI/CD de OxideCast', () => {
  const rootDir = path.resolve(__dirname, '..');
  const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const releaseWorkflowPath = path.join(rootDir, '.github', 'workflows', 'release.yml');
  const readmePath = path.join(rootDir, 'README.md');

  it('debe validar la configuración del bundle en tauri.conf.json para Windows (NSIS)', () => {
    expect(fs.existsSync(tauriConfPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));

    expect(config.productName).toBe('OxideCast');
    expect(config.identifier).toBe('com.yoguidev.oxidecast');
    expect(config.bundle).toBeDefined();
    expect(config.bundle.active).toBe(true);

    // Targets debe incluir "nsis"
    const targets = Array.isArray(config.bundle.targets)
      ? config.bundle.targets
      : [config.bundle.targets];
    expect(targets).toContain('nsis');

    // Windows NSIS installMode debe ser currentUser
    expect(config.bundle.windows).toBeDefined();
    expect(config.bundle.windows.nsis).toBeDefined();
    expect(config.bundle.windows.nsis.installMode).toBe('currentUser');

    // Validación de la ventana principal
    expect(config.app).toBeDefined();
    expect(config.app.windows).toBeDefined();
    expect(config.app.windows.length).toBeGreaterThan(0);
    expect(config.app.windows[0].label).toBe('main');
    expect(config.app.windows[0].visible).toBe(true);
  });

  it('debe validar la existencia y estructura del pipeline de CI/CD en GitHub Actions (.github/workflows/release.yml)', () => {
    expect(fs.existsSync(releaseWorkflowPath)).toBe(true);
    const content = fs.readFileSync(releaseWorkflowPath, 'utf-8');

    // Verificación de pasos de checkout, pnpm, rust y tauri action
    expect(content).toContain('actions/checkout');
    expect(content).toMatch(/pnpm\/action-setup|setup-node/);
    expect(content).toMatch(/actions-rust-lang\/setup-rust-toolchain|rust-toolchain/);
    expect(content).toContain('tauri-apps/tauri-action');
    expect(content).toContain('windows-latest');
    expect(content).toContain('pnpm test');
    expect(content).toContain('cargo test');
  });

  it('debe validar que el README.md contiene las secciones de requisitos, comandos pnpm y el distintivo chileno', () => {
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf-8');

    expect(content).toContain('🇨🇱');
    expect(content).toContain('pnpm');
    expect(content).toContain('NVIDIA');
    expect(content).toContain('NVENC');
    expect(content).toContain('Jorge Arias');
    expect(content).toContain('YoguiDev');
    expect(content.toLowerCase()).toMatch(/instalador|nsis|portable/i);
  });
});
