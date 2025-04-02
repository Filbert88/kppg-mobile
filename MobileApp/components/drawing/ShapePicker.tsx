import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

interface ShapePickerProps {
  onSelect: (shapeType: string) => void;
  onClose: () => void;
}

const shapes = [
  {id: 'rect', label: 'Rectangle'},
  {id: 'circle', label: 'Circle'},
  // Add more shapes as needed.
];

const ShapePicker: React.FC<ShapePickerProps> = ({onSelect, onClose}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Shape</Text>
      <View style={styles.shapesContainer}>
        {shapes.map(shape => (
          <TouchableOpacity
            key={shape.id}
            style={styles.shapeButton}
            onPress={() => onSelect(shape.id)}>
            <Text>{shape.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ShapePicker;

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  shapesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  shapeButton: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    margin: 5,
  },
  closeButton: {marginTop: 20, alignItems: 'center'},
});
