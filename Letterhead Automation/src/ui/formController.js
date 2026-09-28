import { store } from '../state/store.js';

export function setupFormController() {
  const inputs = {
    brandName: document.getElementById('inputBrandName'),
    brandTagline: document.getElementById('inputBrandTagline'),
    recipientLabel: document.getElementById('inputRecipientLabel'),
    recipientName: document.getElementById('inputRecipientName'),
    recipientTitle: document.getElementById('inputRecipientTitle'),
    letterDate: document.getElementById('inputLetterDate'),
    recipientAddress: document.getElementById('inputRecipientAddress'),
    recipientEmailWeb: document.getElementById('inputRecipientEmailWeb'),
    recipientPhone: document.getElementById('inputRecipientPhone'),
    subject: document.getElementById('inputSubject'),
    salutation: document.getElementById('inputSalutation'),
    bodyText: document.getElementById('inputBodyText'),
    closing: document.getElementById('inputClosing'),
    senderName: document.getElementById('inputSenderName'),
    senderTitle: document.getElementById('inputSenderTitle'),
    contactPhone: document.getElementById('inputContactPhone'),
    contactEmail: document.getElementById('inputContactEmail'),
    contactWeb: document.getElementById('inputContactWeb'),
    contactAddress: document.getElementById('inputContactAddress')
  };

  function syncSpecToForm() {
    const spec = store.getSpec();
    const c = spec.content || {};

    if (inputs.brandName) inputs.brandName.value = c.company?.name || '';
    if (inputs.brandTagline) inputs.brandTagline.value = c.company?.tagline || '';
    if (inputs.recipientLabel) inputs.recipientLabel.value = c.recipient?.label || '';
    if (inputs.recipientName) inputs.recipientName.value = c.recipient?.name || '';
    if (inputs.recipientTitle) inputs.recipientTitle.value = c.recipient?.title || '';
    if (inputs.letterDate) inputs.letterDate.value = c.date || '';
    if (inputs.recipientAddress) inputs.recipientAddress.value = c.recipient?.address || '';
    if (inputs.recipientEmailWeb) inputs.recipientEmailWeb.value = c.recipient?.email_web || '';
    if (inputs.recipientPhone) inputs.recipientPhone.value = c.recipient?.phone || '';
    if (inputs.subject) inputs.subject.value = c.subject || '';
    if (inputs.salutation) inputs.salutation.value = c.salutation || '';
    
    if (inputs.bodyText) {
      if (Array.isArray(c.body?.paragraphs)) {
        inputs.bodyText.value = c.body.paragraphs.join('\n\n');
      } else {
        inputs.bodyText.value = c.body?.text || '';
      }
    }

    if (inputs.closing) inputs.closing.value = c.closing || '';
    if (inputs.senderName) inputs.senderName.value = c.sender?.name || '';
    if (inputs.senderTitle) inputs.senderTitle.value = c.sender?.title || '';

    if (inputs.contactPhone) inputs.contactPhone.value = (c.contact?.phone || []).join(', ');
    if (inputs.contactEmail) inputs.contactEmail.value = c.contact?.email || '';
    if (inputs.contactWeb) inputs.contactWeb.value = c.contact?.web || '';
    if (inputs.contactAddress) inputs.contactAddress.value = (c.contact?.address || []).join(', ');
  }

  function syncFormToSpec() {
    const spec = store.getSpec();
    const c = spec.content = spec.content || {};
    c.company = c.company || {};
    c.recipient = c.recipient || {};
    c.body = c.body || {};
    c.sender = c.sender || {};
    c.contact = c.contact || {};

    if (inputs.brandName) c.company.name = inputs.brandName.value;
    if (inputs.brandTagline) c.company.tagline = inputs.brandTagline.value;
    if (inputs.recipientLabel) c.recipient.label = inputs.recipientLabel.value;
    if (inputs.recipientName) c.recipient.name = inputs.recipientName.value;
    if (inputs.recipientTitle) c.recipient.title = inputs.recipientTitle.value;
    if (inputs.letterDate) c.date = inputs.letterDate.value;
    if (inputs.recipientAddress) c.recipient.address = inputs.recipientAddress.value;
    if (inputs.recipientEmailWeb) c.recipient.email_web = inputs.recipientEmailWeb.value;
    if (inputs.recipientPhone) c.recipient.phone = inputs.recipientPhone.value;
    if (inputs.subject) c.subject = inputs.subject.value;
    if (inputs.salutation) c.salutation = inputs.salutation.value;

    if (inputs.bodyText) {
      const bodyRaw = inputs.bodyText.value;
      c.body.paragraphs = bodyRaw.split('\n\n').filter(p => p.trim().length > 0);
    }

    if (inputs.closing) c.closing = inputs.closing.value;
    if (inputs.senderName) c.sender.name = inputs.senderName.value;
    if (inputs.senderTitle) c.sender.title = inputs.senderTitle.value;

    if (inputs.contactPhone) {
      c.contact.phone = inputs.contactPhone.value.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (inputs.contactEmail) c.contact.email = inputs.contactEmail.value;
    if (inputs.contactWeb) c.contact.web = inputs.contactWeb.value;
    if (inputs.contactAddress) {
      c.contact.address = inputs.contactAddress.value.split(',').map(s => s.trim()).filter(Boolean);
    }

    store.setSpec(spec);
  }

  const formContainer = document.getElementById('tabContentForm');
  if (formContainer) {
    const allFormInputs = formContainer.querySelectorAll('input, textarea');
    allFormInputs.forEach(input => {
      input.addEventListener('input', syncFormToSpec);
    });
  }

  syncSpecToForm();

  return { syncSpecToForm, syncFormToSpec };
}
