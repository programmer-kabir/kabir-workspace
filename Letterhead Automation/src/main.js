import './styles/index.css';
import { store } from './state/store.js';
import { setupFormController } from './ui/formController.js';
import { setupJsonController } from './ui/jsonController.js';
import { setupThemesController } from './ui/themesController.js';
import { setupCanvasController } from './ui/canvasController.js';
import { setupHeaderActions } from './ui/headerActions.js';
import { setupAiController } from './ui/aiController.js';
import { setupDragController } from './ui/dragController.js';
import { setupCanvaController } from './ui/canvaController.js';

document.addEventListener('DOMContentLoaded', () => {
  let formCtrl;
  let jsonCtrl;

  // Initialize Canvas
  const canvasCtrl = setupCanvasController();

  // Initialize Form
  formCtrl = setupFormController();

  // Initialize JSON Editor
  jsonCtrl = setupJsonController(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
  });

  // Initialize Interactive Drag & Drop Controller
  setupDragController(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
    if (jsonCtrl) jsonCtrl.syncSpecToJson();
  });

  // Initialize Canva Visual Properties & In-line Editor
  setupCanvaController(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
    if (jsonCtrl) jsonCtrl.syncSpecToJson();
  });

  // Initialize Themes
  setupThemesController(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
    if (jsonCtrl) jsonCtrl.syncSpecToJson();
  });

  // Initialize AI Design Studio
  setupAiController(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
    if (jsonCtrl) jsonCtrl.syncSpecToJson();
  });

  // Initialize Header Actions & Tabs
  setupHeaderActions(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
    if (jsonCtrl) jsonCtrl.syncSpecToJson();
  });

  // Global automatic spec sync for Undo, Redo, Themes & AI
  store.subscribe(() => {
    if (formCtrl) formCtrl.syncSpecToForm();
    if (jsonCtrl) jsonCtrl.syncSpecToJson();
  });
});
