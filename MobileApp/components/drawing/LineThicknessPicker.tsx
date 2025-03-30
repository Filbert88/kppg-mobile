import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {LINE_THICKNESSES} from '../../constants/drawing';

interface LineThicknessPickerProps {
  selectedThickness: number;
  onThicknessSelect: (thickness: number) => void;
  onClose: () => void;
}

export default function LineThicknessPicker({
  selectedThickness,
  onThicknessSelect,
  onClose,
}: LineThicknessPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Line Thickness</Text>

      <View style={styles.thicknessContainer}>
        {LINE_THICKNESSES.map(thickness => (
          <TouchableOpacity
            key={thickness}
            style={[
              styles.thicknessButton,
              selectedThickness === thickness
                ? styles.selectedThicknessButton
                : null,
            ]}
            onPress={() => onThicknessSelect(thickness)}>
            <View style={[styles.thicknessLine, {height: thickness}]} />
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
  thicknessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  thicknessButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
  },
  selectedThicknessButton: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  thicknessLine: {
    width: 30,
    backgroundColor: 'black',
    borderRadius: 4,
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
