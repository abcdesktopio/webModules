/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

/**
 * @name keyboardSettings
 * @module
 * @desc Renders a collapsible "Keyboard" accordion with layout/variant/model
 *       dropdowns in the #keyboardSettings div on the login screen, pre-filled
 *       with the values auto-detected by keyboardLayout.js, and lets the user
 *       override them (persisted via setManualKeyboardLayout /
 *       setManualKeyboardModel, read back by launcher.js on the next desktop
 *       launch). Uses Bootstrap's native accordion/collapse behavior.
 */

import {
  detectKeyboardLayout,
  detectKeyboardModel,
  setManualKeyboardLayout,
  setManualKeyboardModel,
  getManualKeyboardLayoutOverride,
  getManualKeyboardModelOverride,
  KNOWN_XKB_LAYOUTS,
  KNOWN_XKB_VARIANTS,
  KNOWN_XKB_MODELS,
} from './keyboardLayout.js';

const AUTO_VALUE = '';

function buildSelect(id, labelText, options, selectedValue, detectedValue) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group-keyboard keyboard-settings-field flex-fill';

  const label = document.createElement('label');
  label.className = 'form-label login-brand__secondary-title';
  label.setAttribute('for', id);
  label.textContent = labelText;

  const select = document.createElement('select');
  select.id = id;
  select.className = 'form-control-keyboard';

  const autoOption = document.createElement('option');
  autoOption.value = AUTO_VALUE;
  autoOption.textContent = detectedValue || 'none';
  select.appendChild(autoOption);

  for (const value of options) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }

  select.value = selectedValue || AUTO_VALUE;

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  return { wrapper, select };
}

function updateAutoOption(select, detectedValue) {
  const autoOption = select.querySelector(`option[value="${AUTO_VALUE}"]`);
  if (autoOption) autoOption.textContent = detectedValue || 'none';
  select.value = AUTO_VALUE;
}

function persistOverride(layoutSelect, variantSelect, modelSelect) {
  setManualKeyboardLayout(layoutSelect.value || null, variantSelect.value);
  setManualKeyboardModel(modelSelect.value || null);
}

/**
 * @function init
 * @global
 * @desc Build the keyboard layout/variant/model dropdowns and wire their change handlers.
 */
export async function init() {
  const container = document.getElementById('keyboardSettings');
  if (!container) return;

  const layoutOverride = getManualKeyboardLayoutOverride();
  const modelOverride = getManualKeyboardModelOverride();
  const detectedLayout = await detectKeyboardLayout();
  const detectedModel = await detectKeyboardModel();

  const { wrapper: layoutWrapper, select: layoutSelect } = buildSelect(
    'keyboard-settings-layout', 'layout',
    KNOWN_XKB_LAYOUTS, layoutOverride ? layoutOverride.xkbLayout : AUTO_VALUE,
    detectedLayout.xkbLayout,
  );
  const { wrapper: variantWrapper, select: variantSelect } = buildSelect(
    'keyboard-settings-variant', 'variant',
    KNOWN_XKB_VARIANTS, layoutOverride ? layoutOverride.xkbVariant : AUTO_VALUE,
    detectedLayout.xkbVariant,
  );
  const { wrapper: modelWrapper, select: modelSelect } = buildSelect(
    'keyboard-settings-model', 'model',
    KNOWN_XKB_MODELS, modelOverride || AUTO_VALUE,
    detectedModel,
  );

  const groupWrapper = document.createElement('div');
  groupWrapper.className = 'accordion keyboard-settings-group';
  groupWrapper.id = 'keyboard-settings-group';

  const accordionItem = document.createElement('div');
  accordionItem.className = 'accordion-item';

  const accordionHeader = document.createElement('h2');
  accordionHeader.className = 'accordion-header';

  const accordionButton = document.createElement('button');
  accordionButton.type = 'button';
  accordionButton.className = 'accordion-button collapsed';
  accordionButton.id = 'keyboard-settings-group-label';
  accordionButton.setAttribute('data-bs-toggle', 'collapse');
  accordionButton.setAttribute('data-bs-target', '#keyboard-settings-collapse');
  accordionButton.setAttribute('aria-expanded', 'false');
  accordionButton.setAttribute('aria-controls', 'keyboard-settings-collapse');
  accordionButton.textContent = 'Keyboard';

  const accordionCollapse = document.createElement('div');
  accordionCollapse.id = 'keyboard-settings-collapse';
  accordionCollapse.className = 'accordion-collapse collapse';
  accordionCollapse.setAttribute('aria-labelledby', 'keyboard-settings-group-label');

  const accordionBody = document.createElement('div');
  accordionBody.className = 'accordion-body';

  const fieldsWrapper = document.createElement('div');
  fieldsWrapper.className = 'keyboard-settings-fields d-flex gap-2 flex-wrap';
  fieldsWrapper.appendChild(layoutWrapper);
  fieldsWrapper.appendChild(variantWrapper);
  fieldsWrapper.appendChild(modelWrapper);

  const hint = document.createElement('p');
  hint.className = 'form-comment';
  hint.id = 'keyboard-settings-hint';
  const detectedVariantSuffix = detectedLayout.xkbVariant ? `(${detectedLayout.xkbVariant})` : '';
  hint.textContent = `Detected: ${detectedLayout.xkbLayout}${detectedVariantSuffix} / ${detectedModel}`;

  const runDetectionButton = document.createElement('button');
  runDetectionButton.type = 'button';
  runDetectionButton.id = 'keyboard-settings-run-detection';
  runDetectionButton.className = 'btn btn-sm btn-secondary';
  runDetectionButton.textContent = 'Run detection';

  accordionBody.appendChild(fieldsWrapper);
  accordionBody.appendChild(hint);
  accordionBody.appendChild(runDetectionButton);
  accordionHeader.appendChild(accordionButton);
  accordionCollapse.appendChild(accordionBody);
  accordionItem.appendChild(accordionHeader);
  accordionItem.appendChild(accordionCollapse);
  groupWrapper.appendChild(accordionItem);

  container.appendChild(groupWrapper);

  const onChange = () => persistOverride(layoutSelect, variantSelect, modelSelect);
  layoutSelect.addEventListener('change', onChange);
  variantSelect.addEventListener('change', onChange);
  modelSelect.addEventListener('change', onChange);

  // Clear any override and reassign the three fields to the freshly detected values.
  runDetectionButton.addEventListener('click', async () => {
    setManualKeyboardLayout(null);
    setManualKeyboardModel(null);
    const freshLayout = await detectKeyboardLayout();
    const freshModel = await detectKeyboardModel();
    updateAutoOption(layoutSelect, freshLayout.xkbLayout);
    updateAutoOption(variantSelect, freshLayout.xkbVariant);
    updateAutoOption(modelSelect, freshModel);
    const freshVariantSuffix = freshLayout.xkbVariant ? `(${freshLayout.xkbVariant})` : '';
    hint.textContent = `Detected: ${freshLayout.xkbLayout}${freshVariantSuffix} / ${freshModel}`;
  });
}
