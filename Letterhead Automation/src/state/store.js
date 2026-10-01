import { initialPromptSpec } from './initialSpec.js';

class Store {
  constructor() {
    this.currentSpec = JSON.parse(JSON.stringify(initialPromptSpec));
    this.appMode = 'preview'; // 'preview' | 'edit'
    this.showGuides = false;
    this.currentZoom = 0.72;
    this.listeners = new Set();
    this.dragMode = false;
    this.snapGrid = false;
    this.selectedElementKey = null;

    // History stack for Undo / Redo
    this.undoStack = [];
    this.redoStack = [];
    this.MAX_HISTORY = 40;
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
      this.snapGrid = false;
    }
    this.notify();
  }

  pushHistory() {
    try {
      this.undoStack.push(JSON.parse(JSON.stringify(this.currentSpec)));
      if (this.undoStack.length > this.MAX_HISTORY) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    } catch (e) {
      console.warn('Failed to push history snapshot:', e);
    }
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return false;
    try {
      const prev = this.undoStack.pop();
      this.redoStack.push(JSON.parse(JSON.stringify(this.currentSpec)));
      this.currentSpec = prev;
      this.notify();
      return true;
    } catch (e) {
      console.error('Undo error:', e);
      return false;
    }
  }

  redo() {
    if (!this.canRedo()) return false;
    try {
      const next = this.redoStack.pop();
      this.undoStack.push(JSON.parse(JSON.stringify(this.currentSpec)));
      this.currentSpec = next;
      this.notify();
      return true;
    } catch (e) {
      console.error('Redo error:', e);
      return false;
    }
  }

  getSpec() {
    return this.currentSpec;
  }

  setSpec(newSpec, notify = true, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    this.currentSpec = newSpec;
    if (notify) this.notify();
  }

  resetSpec(recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    this.currentSpec = JSON.parse(JSON.stringify(initialPromptSpec));
    this.notify();
  }

  setElementTransform(key, transformObj, notify = true, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.positions) {
      this.currentSpec.positions = {};
    }
    const current = this.currentSpec.positions[key] || {};
    this.currentSpec.positions[key] = {
      ...current,
      ...transformObj
    };
    if (notify) this.notify();
  }

  deleteElement(key, notify = true, recordHistory = true) {
    if (!key) return;
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.hiddenElements) {
      this.currentSpec.hiddenElements = [];
    }
    if (!this.currentSpec.hiddenElements.includes(key)) {
      this.currentSpec.hiddenElements.push(key);
    }
    if (this.selectedElementKey === key) {
      this.selectedElementKey = null;
    }
    if (notify) this.notify();
  }

  restoreElement(key, notify = true, recordHistory = true) {
    if (!key || !this.currentSpec.hiddenElements) return;
    if (recordHistory) {
      this.pushHistory();
    }
    this.currentSpec.hiddenElements = this.currentSpec.hiddenElements.filter(k => k !== key);
    if (notify) this.notify();
  }

  isElementDeleted(key) {
    return Array.isArray(this.currentSpec.hiddenElements) && this.currentSpec.hiddenElements.includes(key);
  }

  updateElementPosition(key, x, y, notify = true, recordHistory = false) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.positions) {
      this.currentSpec.positions = {};
    }
    const currentPos = this.currentSpec.positions[key] || {};
    this.currentSpec.positions[key] = {
      ...currentPos,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    };
    if (notify) this.notify();
  }

  updateElementRotation(key, rotate, notify = true, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.positions) {
      this.currentSpec.positions = {};
    }
    const currentPos = this.currentSpec.positions[key] || {};
    this.currentSpec.positions[key] = {
      ...currentPos,
      rotate: Math.round(((rotate % 360) + 360) % 360)
    };
    if (notify) this.notify();
  }

  nudgeElementPosition(key, dx, dy, notify = true, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.positions) {
      this.currentSpec.positions = {};
    }
    const currentPos = this.currentSpec.positions[key] || { x: 0, y: 0 };
    this.currentSpec.positions[key] = {
      ...currentPos,
      x: Math.round(((currentPos.x ?? 0) + dx) * 10) / 10,
      y: Math.round(((currentPos.y ?? 0) + dy) * 10) / 10
    };
    if (notify) this.notify();
  }

  updateElementWidth(key, width, notify = true, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.positions) {
      this.currentSpec.positions = {};
    }
    const currentPos = this.currentSpec.positions[key] || {};
    this.currentSpec.positions[key] = {
      ...currentPos,
      width: Math.max(20, Math.round(width * 10) / 10)
    };
    if (notify) this.notify();
  }

  resetPositions(recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (this.currentSpec && initialPromptSpec.positions) {
      this.currentSpec.positions = JSON.parse(JSON.stringify(initialPromptSpec.positions));
    } else {
      delete this.currentSpec.positions;
    }
    this.notify();
  }

  updateTypographyScale(key, prop, value, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.typography) {
      this.currentSpec.typography = { scale: {} };
    }
    if (!this.currentSpec.typography.scale) {
      this.currentSpec.typography.scale = {};
    }
    if (!this.currentSpec.typography.scale[key]) {
      this.currentSpec.typography.scale[key] = {};
    }
    this.currentSpec.typography.scale[key][prop] = value;
    this.notify();
  }

  updateElementContent(key, value, recordHistory = true, notify = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.content) {
      this.currentSpec.content = {};
    }
    const c = this.currentSpec.content;

    if (key === 'branding' || key === 'brand_name') {
      if (!c.company) c.company = {};
      c.company.name = value;
    } else if (key === 'tagline') {
      if (!c.company) c.company = {};
      c.company.tagline = value;
    } else if (key === 'recipient' || key === 'recipient_name') {
      if (!c.recipient) c.recipient = {};
      c.recipient.name = value;
    } else if (key === 'recipient_title') {
      if (!c.recipient) c.recipient = {};
      c.recipient.title = value;
    } else if (key === 'recipient_address') {
      if (!c.recipient) c.recipient = {};
      c.recipient.address = value;
    } else if (key === 'subject') {
      c.subject = value;
    } else if (key === 'date') {
      c.date = value;
    } else if (key === 'salutation') {
      c.salutation = value;
    } else if (key === 'body') {
      if (typeof value === 'string') {
        // Split on newlines, but preserve line structure
        const paras = value.split('\n\n');
        c.body = { paragraphs: paras.length > 0 ? paras : [value] };
      } else if (Array.isArray(value)) {
        c.body = { paragraphs: value };
      }
    } else if (key === 'signature' || key === 'signature_name') {
      if (!c.sender) c.sender = {};
      c.sender.name = value;
    } else if (key === 'sender_title' || key === 'signature_title') {
      if (!c.sender) c.sender = {};
      c.sender.title = value;
    } else if (key === 'closing') {
      c.closing = value;
    } else if (key === 'contact_phone') {
      if (!c.contact) c.contact = {};
      c.contact.phone = [value];
    } else if (key === 'contact_email') {
      if (!c.contact) c.contact = {};
      c.contact.email = value;
    } else if (key === 'contact_web') {
      if (!c.contact) c.contact = {};
      c.contact.web = value;
    } else if (key === 'contact_address') {
      if (!c.contact) c.contact = {};
      c.contact.address = Array.isArray(value) ? value : [value];
    }
    if (notify) this.notify();
  }

  clearElementContent(key, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.content) return;
    const c = this.currentSpec.content;

    if (key === 'branding') {
      if (c.company) {
        c.company.name = '';
        c.company.tagline = '';
      }
    } else if (key === 'recipient') {
      if (c.recipient) {
        c.recipient.name = '';
        c.recipient.title = '';
        c.recipient.address = '';
      }
    } else if (key === 'subject') {
      c.subject = '';
    } else if (key === 'date') {
      c.date = '';
    } else if (key === 'body') {
      c.salutation = '';
      c.body = { paragraphs: [''] };
    } else if (key === 'signature') {
      c.closing = '';
      if (c.sender) {
        c.sender.name = '';
        c.sender.title = '';
      }
    } else if (key === 'contact') {
      c.contact = { phone: [''], email: '', web: '', address: [''] };
    }
    this.notify();
  }

  updateCustomColor(colorKey, hexColor, recordHistory = true) {
    if (recordHistory) {
      this.pushHistory();
    }
    if (!this.currentSpec.palette) {
      this.currentSpec.palette = {};
    }
    this.currentSpec.palette[colorKey] = hexColor;
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
