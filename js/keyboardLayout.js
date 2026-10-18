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
 * Physical keyboard layout detection for remote desktop sessions (noVNC / wayvnc).
 *
 * The W3C Keyboard API deliberately does NOT expose the OS keyboard layout
 * name (that would be a fingerprinting vector). navigator.keyboard.getLayoutMap()
 * only exposes, for a given *physical* key (KeyboardEvent.code), the character
 * it currently produces. This module rebuilds the XKB layout name by comparing
 * that physical-key -> character map against a table of known layouts and
 * keeping the best match.
 *
 * This intentionally never looks at navigator.language / navigator.languages:
 * the UI/OS display language has no relationship with the physical keyboard
 * in use (e.g. an English-language OS with a French AZERTY keyboard attached).
 *
 * Only available in secure contexts (HTTPS) on Chromium based browsers today.
 * When unavailable (unsupported browser, denied permissions policy, ...) this
 * falls back to a manual override (if set with setManualKeyboardLayout) or to
 * the "us" layout.
 */

const STORAGE_KEY = 'abcdesktop_xkb_layout_override';

// Physical keys (KeyboardEvent.code) used to fingerprint a layout.
// Deliberately excludes "dead key" positions (e.g. grave/circumflex/tilde
// accent keys): browsers disagree on what getLayoutMap() reports for them
// (the composed accent character on some, the literal string "Dead" on
// others), which would make them unreliable probes.
const PROBE_CODES = [
  'Digit1', 'KeyQ', 'KeyW', 'KeyA', 'KeyZ', 'KeyY', 'KeyI', 'KeyM',
  'Semicolon', 'Quote', 'Comma', 'Period', 'Slash',
  'BracketLeft', 'BracketRight', 'Backslash', 'IntlBackslash',
];

/**
 * Known XKB layout signatures: expected character for a subset of
 * PROBE_CODES. Only the codes we are confident about for a given layout are
 * listed; the rest are simply skipped during scoring instead of penalizing
 * the layout. xkbVariant follows the `setxkbmap -variant` / wayvnc
 * `xkb_variant` naming.
 *
 * Coverage: the most common Western layouts, plus the Cyrillic/Greek/Turkish
 * layouts whose physical mapping is well documented and unambiguous.
 * Central/Eastern European QWERTZ layouts (pl, cz, sk, hu, ro, hr, si, bg,
 * lt, lv, ee, ...) are intentionally NOT included here: they are QWERTZ like
 * "de", but their exact secondary punctuation differs and needs validation
 * on real hardware before being added. Until then, those keyboards safely
 * fall back to "us" (see minRatio below) instead of risking a wrong guess.
 * Add more entries below following the same { xkbLayout, xkbVariant, map }
 * shape once verified.
 *
 * Belgian AZERTY ('be') is deliberately NOT listed as its own entry: it is
 * identical to 'fr' on every reliable probe except a single punctuation key,
 * which made auto-detection flip-flop between the two for real French
 * keyboards. 'fr' already covers the vast majority of Belgian keys correctly;
 * Belgian users who need the exact few differing keys can force it with
 * setManualKeyboardLayout('be').
 */
const XKB_SIGNATURES = [
  { xkbLayout: 'us', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: ';', Quote: '\'', Comma: ',', Period: '.', Slash: '/',
    BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  } },
  { xkbLayout: 'gb', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: ';', Quote: '\'', Comma: ',', Period: '.', Slash: '/',
    BracketLeft: '[', BracketRight: ']', Backslash: '#', IntlBackslash: '\\',
  } },
  { xkbLayout: 'ie', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: ';', Quote: '\'', Backslash: '#', IntlBackslash: '\\',
  } },
  { xkbLayout: 'fr', xkbVariant: '', map: {
    Digit1: '&', KeyQ: 'a', KeyW: 'z', KeyA: 'q', KeyZ: 'w', KeyY: 'y', KeyI: 'i', KeyM: ',',
    Semicolon: 'm', Comma: ';', Period: ':', Slash: '!', IntlBackslash: '<',
  } },
  { xkbLayout: 'de', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'y', KeyY: 'z', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ö', Quote: 'ä', BracketLeft: 'ü', IntlBackslash: '<',
  } },
  { xkbLayout: 'ch', xkbVariant: '', map: {
    // Base 'ch' (no variant) is the German-speaking Swiss layout; 'de' is not a
    // valid ch variant (verified via `localectl list-x11-keymap-variants ch`).
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'y', KeyY: 'z', KeyI: 'i', KeyM: 'm',
    Semicolon: 'é', Quote: 'ä', BracketLeft: 'ü', IntlBackslash: '<',
  } },
  { xkbLayout: 'ch', xkbVariant: 'fr', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'y', KeyY: 'z', KeyI: 'i', KeyM: 'm',
    Semicolon: 'é', Quote: 'è', BracketLeft: 'ü', IntlBackslash: '<',
  } },
  { xkbLayout: 'it', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ò', Quote: 'à', BracketLeft: 'è', Comma: ',', Period: '.', IntlBackslash: '<',
  } },
  { xkbLayout: 'es', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ñ', Comma: ',', Period: '.', IntlBackslash: '<',
  } },
  { xkbLayout: 'latam', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ñ', BracketLeft: '\'', IntlBackslash: '<',
  } },
  { xkbLayout: 'pt', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ç', BracketLeft: '+', IntlBackslash: '<',
  } },
  { xkbLayout: 'br', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ç', Comma: ',', Period: '.', IntlBackslash: '<',
  } },
  { xkbLayout: 'se', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ö', Quote: 'ä', BracketLeft: 'å',
  } },
  { xkbLayout: 'fi', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ö', Quote: 'ä', BracketLeft: 'å',
  } },
  { xkbLayout: 'no', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'ø', Quote: 'æ', BracketLeft: 'å',
  } },
  { xkbLayout: 'dk', xkbVariant: '', map: {
    Digit1: '1', KeyQ: 'q', KeyW: 'w', KeyA: 'a', KeyZ: 'z', KeyY: 'y', KeyI: 'i', KeyM: 'm',
    Semicolon: 'æ', Quote: 'ø', BracketLeft: 'å',
  } },
  { xkbLayout: 'tr', xkbVariant: '', map: {
    // Signature feature of the Turkish-Q layout: the "I" key produces the
    // dotless 'ı', not 'i' (capital I / dotted İ are reached with Shift).
    KeyI: 'ı',
  } },
  { xkbLayout: 'gr', xkbVariant: '', map: {
    KeyQ: ';', KeyA: 'α', KeyZ: 'ζ', KeyY: 'υ', KeyM: 'μ',
  } },
  { xkbLayout: 'ru', xkbVariant: '', map: {
    KeyQ: 'й', KeyW: 'ц', KeyA: 'ф', KeyZ: 'я', KeyY: 'н', KeyM: 'ь', Quote: 'э',
  } },
  { xkbLayout: 'ua', xkbVariant: '', map: {
    KeyQ: 'й', KeyW: 'ц', KeyA: 'ф', KeyZ: 'я', KeyY: 'н', KeyM: 'ь', Quote: 'є',
  } },
];

function scoreSignature(detected, signature) {
  let compared = 0;
  let matched = 0;
  for (const code of PROBE_CODES) {
    const expected = signature.map[code];
    const actual = detected[code];
    if (expected === undefined || actual === undefined) continue;
    compared += 1;
    if (actual.toLowerCase() === expected.toLowerCase()) matched += 1;
  }
  return { matched, compared, ratio: compared ? matched / compared : 0 };
}

function getManualOverride() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/**
 * @function setManualKeyboardLayout
 * @global
 * @param {string|null} xkbLayout XKB layout code (e.g. 'fr'), or null/undefined to clear the override
 * @param {string} xkbVariant XKB variant (e.g. 'fr' for the "ch" Swiss-French layout)
 * @desc Force the keyboard layout instead of relying on auto-detection.
 *       Useful as an escape hatch for layouts not covered by XKB_SIGNATURES.
 */
export function setManualKeyboardLayout(xkbLayout, xkbVariant = '') {
  if (!xkbLayout) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ xkbLayout, xkbVariant }));
}

/**
 * @function getManualKeyboardLayoutOverride
 * @global
 * @return {{xkbLayout: string, xkbVariant: string}|null} the current manual override, or null when auto-detection is in effect
 */
export function getManualKeyboardLayoutOverride() {
  return getManualOverride();
}

/**
 * XKB layout codes covered by XKB_SIGNATURES, for building a selection UI.
 */
export const KNOWN_XKB_LAYOUTS = [...new Set(XKB_SIGNATURES.map((signature) => signature.xkbLayout))].sort();

/**
 * XKB variant codes covered by XKB_SIGNATURES (e.g. the Swiss 'ch' fr/de ones),
 * plus the Mac-specific ones applied by withMacVariant below, for building a selection UI.
 */
export const KNOWN_XKB_VARIANTS = [...new Set([
  ...XKB_SIGNATURES.map((signature) => signature.xkbVariant).filter(Boolean),
  'mac', 'macOS', 'de_mac', 'fr_mac',
])].sort();

/**
 * @function toSetxkbmapString
 * @global
 * @param {{xkbLayout: string, xkbVariant: string}} result
 * @return {string} e.g. 'fr' or 'ch(fr)'
 */
export function toSetxkbmapString({ xkbLayout, xkbVariant }) {
  return xkbVariant ? `${xkbLayout}(${xkbVariant})` : xkbLayout;
}

const MODEL_STORAGE_KEY = 'abcdesktop_xkb_model_override';

// Physical keys that only exist on Japanese (JIS) keyboards.
const JIS_PROBE_CODES = ['IntlYen', 'IntlRo', 'Convert', 'NonConvert', 'KanaMode'];

/**
 * Full XKB model list, from `localectl list-x11-keymap-models` (xkeyboard-config).
 * Note: this local database has no 'jp106' entry; detectKeyboardModel() can still
 * return it for JIS keyboards, it just won't appear as a manual selection choice.
 */
export const KNOWN_XKB_MODELS = [
  'a4_rfkb23', 'a4techKB21', 'a4techKBS8', 'acer_c300', 'acer_ferrari4k', 'acer_laptop',
  'airkey', 'apex300', 'apple', 'applealu_ansi', 'applealu_iso', 'applealu_jis',
  'armada', 'asus_laptop', 'azonaRF2300', 'benqx', 'benqx730', 'benqx800', 'brother',
  'btc5090', 'btc5113rf', 'btc5126t', 'btc6301urf', 'btc9000', 'btc9000a', 'btc9001ah',
  'btc9019u', 'btc9116u', 'cherryblue', 'cherrybluea', 'cherryblueb', 'cherrybunlim',
  'cherrycmexpert', 'cherrycyboard', 'chicony', 'chicony0108', 'chicony0420', 'chicony9885',
  'chromebook', 'classmate', 'compalfl90', 'compaqeak8', 'compaqik13', 'compaqik18',
  'compaqik7', 'creativedw7000', 'cymotionlinux', 'dell', 'dell101', 'dellm65',
  'dellsk8125', 'dellsk8135', 'dellusbmm', 'dexxa', 'diamond', 'dtk2000', 'emachines',
  'ennyah_dkb1008', 'everex', 'flexpro', 'fscaa1667g', 'genius', 'geniuscomfy',
  'geniuscomfy2', 'geniuskb19e', 'geniuskkb2050hs', 'gyration', 'hhk', 'honeywell_euroboard',
  'hp250x', 'hp500fa', 'hp5xx', 'hp6000', 'hpdv5', 'hpi6', 'hpmini110', 'hpnx9020',
  'hpxe3gc', 'hpxe3gf', 'hpxt1000', 'hpzt11xx', 'ibm_spacesaver', 'inspiron', 'ipaq',
  'itouch', 'kinesis', 'latitude', 'logiaccess', 'logicd', 'logicd_it', 'logicd_nav',
  'logicd_opt', 'logicda', 'logicink', 'logiclx300', 'logidinovo', 'logidinovoedge',
  'logiex110', 'logii350', 'logiik', 'logiinkse', 'logiinkseusb', 'logiitc', 'logimel',
  'logitech_base', 'logitech_g15', 'logiultrax', 'logiultraxc', 'macbook78', 'macbook79',
  'macintosh', 'macintosh_hhk', 'macintosh_old', 'microsoft', 'microsoft4000', 'microsoft7000',
  'microsoftccurve2k', 'microsoftelite', 'microsoftinet', 'microsoftmult', 'microsoftoffice',
  'microsoftpro', 'microsoftprooem', 'microsoftprose', 'microsoftprousb', 'microsoftsurface',
  'mx1998', 'mx2500', 'mx2750', 'olpc', 'omnikey101', 'oretec', 'pc101', 'pc102', 'pc104',
  'pc104alt', 'pc105', 'pc86', 'pc98', 'ppkb', 'precision_m', 'presario', 'propeller',
  'qtronix', 'rapidaccess', 'rapidaccess2', 'samsung4500', 'samsung4510', 'sanwaskbkg3',
  'scorpius', 'silvercrest', 'sk1300', 'sk2500', 'sk6200', 'sk7100', 'sp_inet',
  'sun_type6_euro_usb', 'sun_type6_jp', 'sun_type6_jp_usb', 'sun_type6_unix_usb',
  'sun_type6_usb', 'sun_type7_euro_usb', 'sun_type7_jp_usb', 'sun_type7_unix_usb',
  'sun_type7_usb', 'sven', 'sven303', 'symplon', 'targa_v811', 'teck227', 'teck229',
  'thinkpad', 'thinkpad60', 'thinkpadz60', 'tm2020', 'tm2030PS2', 'tm2030USB',
  'tm2030USB-102', 'tm2030USB-106', 'toshiba_s3000', 'trust', 'trust_slimline', 'trustda',
  'unitekkb1925', 'vsonku306', 'winbook', 'yahoo',
];

function isMacPlatform() {
  const platform = (navigator.userAgentData && navigator.userAgentData.platform)
    || navigator.platform
    || navigator.userAgent
    || '';
  return platform.toLowerCase().includes('mac');
}

function getManualModelOverride() {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || null;
  } catch (error) {
    return null;
  }
}

/**
 * @function setManualKeyboardModel
 * @global
 * @param {string|null} xkbModel XKB model code (e.g. 'pc105'), or null/undefined to clear the override
 * @desc Force the keyboard model instead of relying on auto-detection.
 */
export function setManualKeyboardModel(xkbModel) {
  if (!xkbModel) {
    localStorage.removeItem(MODEL_STORAGE_KEY);
    return;
  }
  localStorage.setItem(MODEL_STORAGE_KEY, xkbModel);
}

/**
 * @function getManualKeyboardModelOverride
 * @global
 * @return {string|null} the current manual override, or null when auto-detection is in effect
 */
export function getManualKeyboardModelOverride() {
  return getManualModelOverride();
}

/**
 * @function detectKeyboardModel
 * @global
 * @return {Promise<string>} XKB_DEFAULT_MODEL value, e.g. 'pc105', 'pc104', 'jp106',
 *         'applealu_iso', 'applealu_ansi', 'macintosh'
 * @desc Detects the physical keyboard model (hardware form factor), independently of
 *       the layout: Mac keyboards via the OS platform (Apple Aluminum ISO/ANSI, see
 *       below), Japanese (JIS) keyboards via their extra physical keys, then ISO
 *       ('pc105', has the extra key next to the left Shift / Enter) vs ANSI ('pc104',
 *       no extra key) for everything else. Falls back to 'pc105' (the most common
 *       default) when detection isn't possible.
 */
export async function detectKeyboardModel() {
  const override = getManualModelOverride();
  if (override) return override;

  if (isMacPlatform()) {
    if (!navigator.keyboard || typeof navigator.keyboard.getLayoutMap !== 'function') {
      return 'macintosh';
    }
    let macLayoutMap;
    try {
      macLayoutMap = await navigator.keyboard.getLayoutMap();
    } catch (error) {
      return 'macintosh';
    }
    // ISO Apple keyboards have the extra key next to the left Shift (IntlBackslash); 
    // ANSI ones don't.
    // 
    // return has('IntlBackslash') ? 'macbook79' : 'macbook78';
    // macbook78: Apple MacBook with an ANSI / US layout (typically 78 keys)
    // macbook79: Apple MacBook with an ISO / International layout (typically 79 keys)
    // macintosh: Generic Apple Macintosh keyboard layout
    // macintosh_old: Legacy Apple Macintosh layout
    // ibook: Apple iBook laptop keyboard layout
    // powerbook: Apple PowerBook laptop keyboard layout
    return macLayoutMap.has('IntlBackslash') ? 'macbook79' : 'macbook78';
  }

  if (!navigator.keyboard || typeof navigator.keyboard.getLayoutMap !== 'function') {
    return 'pc105';
  }

  let layoutMap;
  try {
    layoutMap = await navigator.keyboard.getLayoutMap();
  } catch (error) {
    return 'pc105';
  }

  if (JIS_PROBE_CODES.some((code) => layoutMap.has(code))) return 'jp106';

  return layoutMap.has('IntlBackslash') ? 'pc105' : 'pc104';
}

// On macOS the Option key produces different special characters than AltGr on the
// same layout, so XKB needs a 'mac'-ish variant to map them correctly. Not every
// layout has one though (verified via `localectl list-x11-keymap-variants <layout>`):
// es, br, tr, gr, ie and latam have none, and ua uses 'macOS' (capitalized), not 'mac'.
const MAC_VARIANT_BY_LAYOUT = {
  us: 'mac', gb: 'mac', fr: 'mac', de: 'mac', it: 'mac', pt: 'mac',
  se: 'mac', fi: 'mac', no: 'mac', dk: 'mac', ru: 'mac',
  ua: 'macOS',
};

// 'ch' has no bare 'mac' variant: it combines with the de/fr sub-variant instead.
const MAC_VARIANT_BY_LAYOUT_VARIANT = {
  ch: { '': 'de_mac', fr: 'fr_mac' },
};

function withMacVariant(result) {
  if (result.source === 'override' || !isMacPlatform()) {
    return result;
  }

  const comboMap = MAC_VARIANT_BY_LAYOUT_VARIANT[result.xkbLayout];
  if (comboMap && Object.prototype.hasOwnProperty.call(comboMap, result.xkbVariant)) {
    return { ...result, xkbVariant: comboMap[result.xkbVariant] };
  }

  if (result.xkbVariant) {
    return result;
  }

  const macVariant = MAC_VARIANT_BY_LAYOUT[result.xkbLayout];
  return macVariant ? { ...result, xkbVariant: macVariant } : result;
}

/**
 * @function detectKeyboardLayout
 * @global
 * @param {object} options
 * @param {number} options.minComparisons minimum number of probes that must be
 *        available to trust a candidate layout (default 4)
 * @param {number} options.minRatio minimum match ratio [0..1] to accept the
 *        best candidate instead of falling back to 'us' (default 0.75)
 * @return {Promise<{xkbLayout: string, xkbVariant: string, source: string, size: number, confidence?: number}>}
 *         size is the number of physical keys reported by getLayoutMap() (KeyboardLayoutMap.size), 0 when no map was obtained.
 *         xkbVariant defaults to 'mac' on macOS when no more specific variant applies.
 * @desc Detects the physical keyboard layout using navigator.keyboard.getLayoutMap()
 *       and matches it against known XKB layouts. Never relies on navigator.language.
 */
export async function detectKeyboardLayout({ minComparisons = 4, minRatio = 0.75 } = {}) {
  const override = getManualOverride();
  if (override && override.xkbLayout) {
    return { xkbLayout: override.xkbLayout, xkbVariant: override.xkbVariant || '', source: 'override', size: 0 };
  }

  if (!navigator.keyboard || typeof navigator.keyboard.getLayoutMap !== 'function') {
    console.warn('[keyboardLayout] navigator.keyboard.getLayoutMap() is not available in this browser, defaulting to "us".');
    return withMacVariant({ xkbLayout: 'us', xkbVariant: '', source: 'unsupported', size: 0 });
  }

  let layoutMap;
  try {
    layoutMap = await navigator.keyboard.getLayoutMap();
  } catch (error) {
    console.warn('[keyboardLayout] getLayoutMap() failed, defaulting to "us":', error);
    return withMacVariant({ xkbLayout: 'us', xkbVariant: '', source: 'error', size: 0 });
  }

  const detected = {};
  for (const code of PROBE_CODES) {
    if (layoutMap.has(code)) detected[code] = layoutMap.get(code);
  }

  // Keep the top two matches: candidates that are nearly identical (e.g. a
  // single differing punctuation key) must win by a clear margin, otherwise
  // one flaky probe could flip the result between two very similar layouts.
  let best = null;
  let runnerUp = null;
  for (const signature of XKB_SIGNATURES) {
    const { matched, compared, ratio } = scoreSignature(detected, signature);
    if (compared < minComparisons) continue;
    const candidate = { xkbLayout: signature.xkbLayout, xkbVariant: signature.xkbVariant, matched, compared, ratio };
    if (!best || matched > best.matched || (matched === best.matched && ratio > best.ratio)) {
      runnerUp = best;
      best = candidate;
    } else if (!runnerUp || matched > runnerUp.matched) {
      runnerUp = candidate;
    }
  }

  if (!best || best.ratio < minRatio) {
    console.warn('[keyboardLayout] could not confidently match a known layout, defaulting to "us".', detected);
    return withMacVariant({ xkbLayout: 'us', xkbVariant: '', source: 'fallback', size: layoutMap.size });
  }

  if (runnerUp && best.matched - runnerUp.matched < 2) {
    console.warn('[keyboardLayout] ambiguous match between candidates, keeping the strongest default.', { best, runnerUp, detected });
  }

  return withMacVariant({ xkbLayout: best.xkbLayout, xkbVariant: best.xkbVariant, source: 'auto', confidence: best.ratio, size: layoutMap.size });
}

/**
 * @function detectKeyboardVariant
 * @global
 * @param {object} options forwarded to detectKeyboardLayout()
 * @return {Promise<string>} XKB_DEFAULT_VARIANT value, e.g. '' or 'fr' for the "ch" Swiss-French layout
 * @desc Standalone accessor for the variant tied to the detected layout (see
 *       detectKeyboardLayout). Prefer destructuring xkbVariant directly from
 *       detectKeyboardLayout() when you also need the layout, to avoid detecting twice.
 */
export async function detectKeyboardVariant(options) {
  const { xkbVariant } = await detectKeyboardLayout(options);
  return xkbVariant;
}
