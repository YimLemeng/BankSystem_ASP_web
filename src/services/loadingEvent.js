// Lightweight event bus for Axios to communicate with LoadingContext
class LoadingEventEmitter {
  constructor() {
    this.handlers = [];
  }

  subscribe(handler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  emit(type, payload = {}) {
    this.handlers.forEach((h) => h(type, payload));
  }
}

export const loadingEvent = new LoadingEventEmitter();
