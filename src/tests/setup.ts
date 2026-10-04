import '@testing-library/jest-dom';

// Minimal canvas mock for JSDOM
HTMLCanvasElement.prototype.getContext = () => null;
