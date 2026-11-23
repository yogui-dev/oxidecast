import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('OxideCast Core UI Scaffolding', () => {
  it('debe renderizar el título "OxideCast"', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: /OxideCast/i });
    expect(heading).toBeInTheDocument();
  });

  it('debe renderizar el botón "Iniciar Emisión Dual"', () => {
    render(<App />);
    const startButton = screen.getByRole('button', { name: /Iniciar Emisión Dual/i });
    expect(startButton).toBeInTheDocument();
  });

  it('debe mostrar el distintivo "Creado con orgullo en Chile 🇨🇱"', () => {
    render(<App />);
    expect(screen.getByText(/Creado con orgullo en Chile 🇨🇱/i)).toBeInTheDocument();
  });
});
