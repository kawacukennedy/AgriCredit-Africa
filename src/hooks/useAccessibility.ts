'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AccessibilitySettings {
  textToSpeech: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    textToSpeech: false,
    colorBlindMode: 'none',
    highContrast: false,
    fontSize: 'medium',
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const speak = useCallback((text: string) => {
    if (!settings.textToSpeech || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, [settings.textToSpeech]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const getColorBlindStyles = useCallback(() => {
    const styles: Record<string, string> = {};

    switch (settings.colorBlindMode) {
      case 'protanopia':
        // Red-blind: enhance red/green distinctions
        styles.filter = 'contrast(1.2) saturate(1.5)';
        break;
      case 'deuteranopia':
        // Green-blind: enhance blue/yellow distinctions
        styles.filter = 'contrast(1.1) hue-rotate(90deg)';
        break;
      case 'tritanopia':
        // Blue-blind: enhance red/green distinctions
        styles.filter = 'contrast(1.3) saturate(2)';
        break;
      default:
        styles.filter = 'none';
    }

    if (settings.highContrast) {
      styles.filter += ' contrast(1.5)';
    }

    return styles;
  }, [settings.colorBlindMode, settings.highContrast]);

  const getFontSizeClass = useCallback(() => {
    switch (settings.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  }, [settings.fontSize]);

  return {
    settings,
    updateSettings,
    speak,
    stopSpeaking,
    getColorBlindStyles,
    getFontSizeClass,
  };
}