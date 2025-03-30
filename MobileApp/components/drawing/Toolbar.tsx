import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, TOOLS} from '../../constants/drawing';

interface ToolbarProps {
  activeTool: string | null;
  onToolPress: (toolId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function Toolbar({
  activeTool,
  onToolPress,
  onZoomIn,
  onZoomOut,
}: ToolbarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
        <Icon name="add" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
        <Icon name="remove" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.toolsContainer}>
        {TOOLS.map(tool => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              activeTool === tool.id ? styles.activeToolButton : null,
            ]}
            onPress={() => onToolPress(tool.id)}>
            <Icon
              name={tool.icon}
              size={24}
              color={activeTool === tool.id ? COLORS.primary : COLORS.text}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  zoomButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  toolsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  toolButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeToolButton: {
    backgroundColor: '#d1fae5', // Light green
  },
});
