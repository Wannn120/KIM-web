declare global {
  interface Window {
    Snap?: {
      pay: (token: string, options?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export {};
