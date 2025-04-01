import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

const colors = [
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#000000',
  '#FFFFFF',
  '#FFFF00',
  '#FFA500',
  '#800080',
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelect,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Color</Text>
      <View style={styles.colorsContainer}>
        {colors.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              {backgroundColor: color},
              selectedColor === color && styles.selected,
            ]}
            onPress={() => onSelect(color)}
          />
        ))}
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ColorPicker;

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorButton: {width: 40, height: 40, margin: 5, borderRadius: 20},
  selected: {borderWidth: 2, borderColor: '#000'},
  closeButton: {marginTop: 20, alignItems: 'center'},
});
