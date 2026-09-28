/// <reference types="vite/client" />

interface LemonSqueezyEvent {
  event: string;
  data?: any;
}

interface LemonSqueezyInstance {
  Url: {
    Open: (url: string) => void;
    Close: () => void;
  };
  Setup: (options: {
    eventHandler?: (event: LemonSqueezyEvent) => void;
  }) => void;
  Refresh: () => void;
}

interface Window {
  createLemonSqueezy?: () => void;
  LemonSqueezy?: LemonSqueezyInstance;
}
