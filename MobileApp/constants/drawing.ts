export const COLORS = {
  primary: '#10b981', // Emerald 500
  text: '#333333',
  shapeStroke: '#000000',
  error: '#ef4444',
};

export const DRAWING_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#000000', // Black
  '#ffffff', // White
];

export const LINE_THICKNESSES = [2, 4, 6];

export const CONSTANTS = {
  CLOSE_THRESHOLD: 15, // Maximum distance between first and last point to consider a stroke closed
  CONNECT_THRESHOLD: 20, // Maximum distance between stroke endpoints to merge them
  CROP_HANDLE_SIZE: 20, // Size (diameter) of crop corner handles
  CROP_HANDLE_HIT_SIZE: 30, // Larger hit area for detecting crop handle touches
  MIN_CROP_SIZE: 50, // Minimum crop rectangle width/height
  MIN_SHAPE_SIZE: 30, // Minimum shape size when resizing
  HANDLE_SIZE: 15, // Size of shape resizing handles
};

export const SHAPES = [
  {id: 'rect', icon: 'crop-square'},
  {id: 'circle', icon: 'radio-button-unchecked'},
  {id: 'triangle', icon: 'change-history'},
];

export const TOOLS = [
  {id: 'draw', icon: 'edit'},
  {id: 'erase', icon: 'backspace'},
  {id: 'line', icon: 'show-chart'},
  {id: 'shape', icon: 'crop-square'},
  {id: 'paint', icon: 'format-color-fill'},
  {id: 'crop', icon: 'crop'},
];
