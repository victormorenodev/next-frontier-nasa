// Shared resource drawings used by indicators and card effects.
globalThis.ResourceIcons = {
    health: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    oxygen: '<path d="M12 3v8"/><path d="M12 11c-1.5 0-3-1-4-3-2 1-4 4-4 8 0 3 1 5 3 5s3-2 3-4v-6"/><path d="M12 11c1.5 0 3-1 4-3 2 1 4 4 4 8 0 3-1 5-3 5s-3-2-3-4v-6"/>',
    water: '<path d="M12 3c3.5 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.5 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
    shield: '<path d="m12 2 8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><circle cx="12" cy="9" r="3"/><path d="M10.5 9h3M8 17a4 4 0 0 1 8 0"/>',
    energy: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    food: '<path d="M12 7c-2-2-7-1.5-7 4 0 5 3 9 5 9 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-9 0-5.5-5-6-7-4z"/><path d="M12 7c0-2 1-4 3-4"/>'
  };

// Ending illustrations share the HUD's line style, with distinct failure symbols.
globalThis.EndingIcons = {
  'life-support': '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/><path d="m3 12 4-2 3 5 4-7 3 4h4"/>',
  oxygen: '<path d="M12 3v7M12 10 9 8M12 10l3-2M9 8C6 7 3 12 3 17c0 3 2 4 4 4s3-2 3-4v-4M15 8c3-1 6 4 6 9 0 3-2 4-4 4s-3-2-3-4v-4"/><path d="m3 3 18 18"/>',
  water: '<path d="M12 3c3 4 6 8 6 11a6 6 0 0 1-12 0c0-3 3-7 6-11z"/><path d="m13 8-3 5 4 1-3 5"/>',
  shield: '<path d="m10 3-6 3v6c0 5 4 8 8 9 4-1 8-4 8-9V6l-6-3"/><path d="m13 3-3 6 4 3-4 4 2 5"/>',
  energy: '<path d="m13 2-9 10h6l-1 3M14 9l-1 4h6l-9 9 1-6"/><path d="m3 16 3 1M18 6l3 1"/>',
  food: '<path d="M3 6h18v15H3zM2 3h20v3M7 11l10 6M17 11l-10 6"/>',
  complete: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  quit: '<path d="M10 3H4v18h6M13 7l5 5-5 5M8 12h13"/>'
};
