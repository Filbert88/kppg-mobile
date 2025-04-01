import React from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import {Tool} from '../../pages/fragmentation-form/fragmentation-form5';

interface ToolbarProps {
  activeTool: Tool;
  onToolSelect: (tool: Tool) => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolSelect,
  onExport,
}) => {
  return (
    <View style={styles.toolbar}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onToolSelect('draw')}>
        <Text style={styles.text}>Draw</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onToolSelect('line')}>
        <Text style={styles.text}>Line</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onToolSelect('shape')}>
        <Text style={styles.text}>Shape</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onToolSelect('fill')}>
        <Text style={styles.text}>Fill</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onToolSelect('crop')}>
        <Text style={styles.text}>Crop</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onToolSelect('erase')}>
        <Text style={styles.text}>Erase</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onExport}>
        <Text style={styles.text}>Export</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Toolbar;

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#eee',
  },
  button: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
});
