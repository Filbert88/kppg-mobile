// EraseThicknessPicker.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface EraseThicknessPickerProps {
  selectedThickness: number;
  onSelect: (thickness: number) => void;
  onClose: () => void;
}

// Some example sizes
const thicknessOptions = [4, 8, 12, 16, 20, 30];

const EraseThicknessPicker: React.FC<EraseThicknessPickerProps> = ({
  selectedThickness,
  onSelect,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Eraser Size</Text>
      <View style={styles.optionsContainer}>
        {thicknessOptions.map(size => (
          <TouchableOpacity
            key={size}
            style={[
              styles.optionButton,
              selectedThickness === size && styles.selectedOption,
            ]}
            onPress={() => {
              onSelect(size);
            }}>
            <Text style={styles.optionText}>{size}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EraseThicknessPicker;

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionButton: {
    margin: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  selectedOption: {
    backgroundColor: '#aaa',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
});
