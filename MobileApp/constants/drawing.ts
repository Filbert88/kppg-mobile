import {Dimensions} from 'react-native';

export const COLORS = {
  primary: '#10b981', // Emerald-500
  secondary: '#f472b6', // Pink-400
  background: '#f9fafb', // Gray-50
  surface: '#ffffff',
  error: '#ef4444', // Red-500
  text: '#1f2937', // Gray-800
  border: '#e5e7eb', // Gray-200
  overlay: 'rgba(0, 0, 0, 0.5)',
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

export const LINE_THICKNESSES = [2, 4, 6, 8, 10];

export const SHAPES = [
  {id: 'rect', name: 'Rectangle', icon: 'crop-square'},
  {id: 'circle', name: 'Circle', icon: 'circle'},
  {id: 'triangle', name: 'Triangle', icon: 'change-history'},
];

export const TOOLS = [
  {id: 'draw', name: 'Draw', icon: 'edit'},
  {id: 'erase', name: 'Erase', icon: 'delete'},
  {id: 'shape', name: 'Shape', icon: 'crop-square'},
  {id: 'line', name: 'Line', icon: 'remove'},
  {id: 'paint', name: 'Fill', icon: 'format-color-fill'},
  {id: 'crop', name: 'Crop', icon: 'crop'},
];

export const CONSTANTS = {
  PAGE_PADDING: 16,
  ERASE_THRESHOLD: 15,
  HANDLE_SIZE: 15,
  CLOSE_THRESHOLD: 15,
  CONNECT_THRESHOLD: 20,
  CROP_HANDLE_SIZE: 20,
  MIN_CROP_SIZE: 50,
  RESIZE_SENSITIVITY: 0.2,
  CORNER_THRESHOLD: 24,
  TOOLBAR_HEIGHT: 56,
  MODAL_WIDTH: '80%',
  FILL_TOLERANCE: 32,
};

export const SCREEN = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};
