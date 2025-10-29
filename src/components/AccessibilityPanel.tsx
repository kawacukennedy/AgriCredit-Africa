'use client';

import { useState } from 'react';
import { useAccessibility, AccessibilitySettings } from '@/hooks/useAccessibility';

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, speak, stopSpeaking } = useAccessibility();

  const handleSpeak = (text: string) => {
    if (settings.textToSpeech) {
      speak(text);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      handleVoiceCommand(command);
    };

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
    };

    recognition.start();
  };

  const handleVoiceCommand = (command: string) => {
    if (command.includes('open dashboard')) {
      window.location.href = '/dashboard';
    } else if (command.includes('open marketplace')) {
      window.location.href = '/marketplace';
    } else if (command.includes('open loan application')) {
      window.location.href = '/loan-application';
    } else if (command.includes('toggle high contrast')) {
      updateSettings({ highContrast: !settings.highContrast });
      speak('High contrast mode toggled');
    } else if (command.includes('increase font size')) {
      const sizes = ['small', 'medium', 'large'] as const;
      const currentIndex = sizes.indexOf(settings.fontSize);
      if (currentIndex < sizes.length - 1) {
        updateSettings({ fontSize: sizes[currentIndex + 1] });
        speak('Font size increased');
      }
    } else {
      speak('Command not recognized. Try saying "open dashboard", "open marketplace", "toggle high contrast", or "increase font size"');
    }
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Accessibility options"
        onMouseEnter={() => handleSpeak("Accessibility options")}
      >
        ♿
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-64">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Accessibility Settings
          </h3>

          {/* Text-to-Speech */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.textToSpeech}
                onChange={(e) => updateSettings({ textToSpeech: e.target.checked })}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">Text-to-Speech</span>
            </label>
            {settings.textToSpeech && (
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => speak("This is a test of the text-to-speech feature")}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Test Speech
                </button>
                <button
                  onClick={stopSpeaking}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Stop
                </button>
                <button
                  onClick={startVoiceRecognition}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  🎤 Voice Commands
                </button>
              </div>
            )}
          </div>

          {/* Color Blind Mode */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Color Blind Mode
            </label>
            <select
              value={settings.colorBlindMode}
              onChange={(e) => updateSettings({ colorBlindMode: e.target.value as AccessibilitySettings['colorBlindMode'] })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
            </select>
          </div>

          {/* High Contrast */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">High Contrast</span>
            </label>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Font Size
            </label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSettings({ fontSize: size })}
                  className={`px-3 py-1 rounded text-sm ${
                    settings.fontSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value="en"
              onChange={(e) => {
                // In a real app, this would change the i18n language
                console.log('Language change not implemented yet:', e.target.value);
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="sw">Kiswahili</option>
              <option value="ha">Hausa</option>
            </select>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}