import { initialPromptSpec } from './initialSpec.js';

class Store {
  constructor() {
    this.currentSpec = JSON.parse(JSON.stringify(initialPromptSpec));
    this.appMode = 'preview'; // 'preview' | 'edit'
    this.showGuides = false;
    this.currentZoom = 0.72;
    this.listeners = new Set();
    this.dragMode = false;
    this.snapGrid = true;
    this.selectedElementKey = null;
  }

  getAppMode() {
    return this.appMode;
  }

  setAppMode(mode) {
    this.appMode = mode;
    if (mode === 'preview') {
      this.dragMode = false;
      this.showGuides = false;
      this.selectedElementKey = null;
    } else {
      this.dragMode = true;
      this.showGuides = true;
      this.snapGrid = true;
    }
    this.notify();
  }

  getSpec() {
    return this.currentSpec;
  }

  setSpec(newSpec, notify = true) {
    this.currentSpec = newSpec;
    if (notify) this.notify();
  }

  resetSpec() {
    this.currentSpec = JSON.parse(JSON.stringify(initialPromptSpec));
    this.notify();
  }

  updateElementPosition(key, x, y, notify = true) {
    if (!this.currentSpec.positions) {
      this.currentSpec.positions = {};
    }
    this.currentSpec.positions[key] = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    if (notify) this.notify();
  }

  resetPositions() {
    if (this.currentSpec && initialPromptSpec.positions) {
      this.currentSpec.positions = JSON.parse(JSON.stringify(initialPromptSpec.positions));
    } else {
      delete this.currentSpec.positions;
    }
    this.notify();
  }

  getDragMode() {
    return this.dragMode;
  }

  setDragMode(val) {
    this.dragMode = val;
    this.notify();
  }

  toggleDragMode() {
    this.dragMode = !this.dragMode;
    this.notify();
    return this.dragMode;
  }

  getSnapGrid() {
    return this.snapGrid;
  }

  setSnapGrid(val) {
    this.snapGrid = val;
    this.notify();
  }

  toggleSnapGrid() {
    this.snapGrid = !this.snapGrid;
    this.notify();
    return this.snapGrid;
  }

  getSelectedElement() {
    return this.selectedElementKey;
  }

  setSelectedElement(key) {
    this.selectedElementKey = key;
    this.notify();
  }

  getShowGuides() {
    return this.showGuides;
  }

  setShowGuides(val) {
    this.showGuides = val;
    this.notify();
  }

  toggleGuides() {
    this.showGuides = !this.showGuides;
    this.notify();
    return this.showGuides;
  }

  getZoom() {
    return this.currentZoom;
  }

  setZoom(val) {
    this.currentZoom = Math.min(Math.max(0.3, val), 1.6);
    this.notify();
  }

  adjustZoom(delta) {
    this.setZoom(this.currentZoom + delta);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentSpec, this);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }
}

export const store = new Store();
