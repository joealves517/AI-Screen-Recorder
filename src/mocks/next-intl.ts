import React from 'react';
import en from '../messages/en.json';
import es from '../messages/es.json';
import ru from '../messages/ru.json';

const messagesMap: Record<string, any> = { en, es, ru };

// Helper to replace {key} placeholders in translation strings
function replacePlaceholders(text: string, values?: Record<string, any>): string {
  if (!values || typeof text !== 'string') return text;
  let result = text;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function useLocale() {
  return 'en';
}

export function useTranslations(namespace?: string) {
  const locale = useLocale();
  const messages = messagesMap[locale] || en;

  // Helper to fetch value from nested JSON structure
  const getValue = (key: string): any => {
    let current: any = messages;
    if (namespace) {
      const parts = namespace.split('.');
      for (const part of parts) {
        current = current?.[part];
      }
    }
    if (key) {
      const keyParts = key.split('.');
      for (const part of keyParts) {
        current = current?.[part];
      }
    }
    return current;
  };

  const t = (key: string, values?: Record<string, any>) => {
    const val = getValue(key);
    if (typeof val === 'string') {
      return replacePlaceholders(val, values);
    }
    return val !== undefined ? String(val) : key;
  };

  // Rich formatting function for rendering inline React elements
  t.rich = (key: string, values?: Record<string, any>) => {
    const text = t(key, values);
    if (typeof text !== 'string') return text;
    if (!values) return text;

    const regex = /<(\w+)>(.*?)<\/\1>/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const tagName = match[1];
      const content = match[2];
      const index = match.index;

      if (index > lastIndex) {
        elements.push(text.substring(lastIndex, index));
      }

      const renderer = values[tagName];
      if (renderer && typeof renderer === 'function') {
        elements.push(React.createElement(React.Fragment, { key: `${tagName}-${index}` }, renderer(content)));
      } else {
        elements.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 
      ? React.createElement(React.Fragment, null, ...elements) 
      : text;
  };

  // Raw formatting function to return raw arrays/objects from JSON
  t.raw = (key: string) => {
    const val = getValue(key);
    return val !== undefined ? val : key;
  };

  return t;
}

// Client Provider Mock
export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return children;
}

// Server Mocks to support offline building & client routing compatibility
export async function getTranslations(namespace?: string) {
  return useTranslations(namespace);
}

export async function getMessages() {
  const locale = useLocale();
  return messagesMap[locale] || en;
}

export function setRequestLocale(locale: string) {
  // No-op for offline client-only extension
}

