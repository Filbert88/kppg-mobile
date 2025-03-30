import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SHAPES} from '../../constants/drawing';

interface ShapePickerProps {
  selectedShape: string | null;
  onShapeSelect: (shapeType: string) => void;
  onClose: () => void;
}

export default function ShapePicker({
  selectedShape,
  onShapeSelect,
  onClose,
}: ShapePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Shape</Text>

      <View style={styles.shapesContainer}>
        {SHAPES.map(shape => (
          <TouchableOpacity
            key={shape.id}
            style={[
              styles.shapeButton,
              selectedShape === shape.id ? styles.selectedShapeButton : null,
            ]}
            onPress={() => onShapeSelect(shape.id)}>
            <Icon name={shape.icon} size={32} color="#333" />
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
  shapesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  shapeButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedShapeButton: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
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
