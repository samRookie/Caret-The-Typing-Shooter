import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MenuScreen, BeforeInstallPromptEvent } from '@/ui/components/MenuScreen';

describe('PWA & Desktop Installation Specification', () => {
  const rootDir = path.resolve(__dirname, '../../');

  it('validates public/manifest.webmanifest schema and parameters', () => {
    const manifestPath = path.join(rootDir, 'public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('Caret: Space typing simulator');
    expect(manifest.short_name).toBe('Caret');
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('landscape');
    expect(manifest.theme_color).toBe('#07090c');
    expect(manifest.background_color).toBe('#07090c');
    expect(manifest.icons).toHaveLength(3);

    const icon192 = manifest.icons.find((i: { sizes: string; purpose: string }) => i.sizes === '192x192');
    expect(icon192).toBeDefined();
    expect(icon192.src).toBe('icons/icon-192.png');
    expect(icon192.purpose).toBe('any');

    const icon512 = manifest.icons.find(
      (i: { sizes: string; purpose: string }) => i.sizes === '512x512' && i.purpose === 'any'
    );
    expect(icon512).toBeDefined();
    expect(icon512.src).toBe('icons/icon-512.png');

    const iconMaskable = manifest.icons.find(
      (i: { sizes: string; purpose: string }) => i.sizes === '512x512' && i.purpose === 'maskable'
    );
    expect(iconMaskable).toBeDefined();
    expect(iconMaskable.src).toBe('icons/icon-512-maskable.png');
  });

  it('validates index.html title and manifest link elements', () => {
    const htmlPath = path.join(rootDir, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    expect(html).toContain('<title>Caret: Space typing simulator</title>');
    expect(html).toContain('<link rel="manifest" href="manifest.webmanifest" />');
    expect(html).toContain('<meta name="theme-color" content="#07090c" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="icons/icon-192.png" />');
  });

  it('validates public/sw.js offline service worker caching structure', () => {
    const swPath = path.join(rootDir, 'public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain("const BUILD_ID = '__BUILD_ID__';");
    expect(swContent).toContain('const CACHE_NAME = `caret-${BUILD_ID}`;');
    expect(swContent).toContain("request.mode === 'navigate'");
    expect(swContent).toContain("url.pathname.includes('/assets/')");
    expect(swContent).toContain('self.skipWaiting()');
    expect(swContent).toContain('self.clients.claim()');
  });

  it('validates vercel.json caching headers and Content-Security-Policy', () => {
    const vercelPath = path.join(rootDir, 'vercel.json');
    expect(fs.existsSync(vercelPath)).toBe(true);

    const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    const swRule = vercelConfig.headers.find((h: { source: string }) => h.source === '/sw.js');
    expect(swRule).toBeDefined();
    expect(swRule.headers.some((header: { key: string; value: string }) => header.key === 'Cache-Control' && header.value.includes('no-cache'))).toBe(true);

    const manifestRule = vercelConfig.headers.find((h: { source: string }) => h.source === '/manifest.webmanifest');
    expect(manifestRule).toBeDefined();
    expect(manifestRule.headers.some((header: { key: string; value: string }) => header.key === 'Cache-Control' && header.value.includes('no-cache'))).toBe(true);

    const globalRule = vercelConfig.headers.find((h: { source: string }) => h.source === '/(.*)');
    expect(globalRule).toBeDefined();
    const cspHeader = globalRule.headers.find((header: { key: string }) => header.key === 'Content-Security-Policy');
    expect(cspHeader).toBeDefined();
    expect(cspHeader.value).toContain("worker-src 'self'");
    expect(cspHeader.value).toContain("manifest-src 'self'");
  });

  describe('MenuScreen Install Button Integration', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders INSTALL CARET button upon beforeinstallprompt event and triggers prompt() on click', async () => {
      const onPlay = vi.fn();
      render(<MenuScreen onPlay={onPlay} />);

      // Initially no install button
      expect(screen.queryByRole('button', { name: /INSTALL CARET/i })).toBeNull();

      // Dispatch mock beforeinstallprompt event
      const promptMock = vi.fn().mockResolvedValue(undefined);
      const userChoicePromise = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

      const fakeEvent = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent;
      fakeEvent.prompt = promptMock;
      fakeEvent.userChoice = userChoicePromise;

      act(() => {
        window.dispatchEvent(fakeEvent);
      });

      // Button should now appear
      const installBtn = screen.getByRole('button', { name: /INSTALL CARET/i });
      expect(installBtn).toBeInTheDocument();

      // Clicking install invokes prompt
      await act(async () => {
        fireEvent.click(installBtn);
      });

      expect(promptMock).toHaveBeenCalledTimes(1);

      // Once choice is resolved, button is removed from screen
      expect(screen.queryByRole('button', { name: /INSTALL CARET/i })).toBeNull();
    });
  });
});
