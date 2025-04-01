import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

interface LineThicknessPickerProps {
  selectedThickness: number;
  onSelect: (thickness: number) => void;
  onClose: () => void;
}

const thicknessOptions = [2, 4, 6, 8, 10];

const LineThicknessPicker: React.FC<LineThicknessPickerProps> = ({
  selectedThickness,
  onSelect,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Line Thickness</Text>
      <View style={styles.options}>
        {thicknessOptions.map(thickness => (
          <TouchableOpacity
            key={thickness.toString()}
            style={[
              styles.option,
              selectedThickness === thickness && styles.selected,
            ]}
            onPress={() => onSelect(thickness)}>
            <View
              style={{height: thickness, width: 40, backgroundColor: '#000'}}
            />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LineThicknessPicker;

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  option: {padding: 10},
  selected: {borderColor: '#000', borderWidth: 1},
  closeButton: {marginTop: 20, alignItems: 'center'},
});
