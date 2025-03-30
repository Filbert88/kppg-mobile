import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {DRAWING_COLORS} from '../../constants/drawing';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPicker({
  selectedColor,
  onColorSelect,
  onClose,
}: ColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Color</Text>

      <View style={styles.colorsContainer}>
        {DRAWING_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              selectedColor === color ? styles.selectedColorButton : null,
            ]}
            onPress={() => onColorSelect(color)}>
            <View style={[styles.colorSwatch, {backgroundColor: color}]} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorButton: {
    margin: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorButton: {
    borderColor: '#10b981', // Emerald-500
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
