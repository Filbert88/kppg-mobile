import React, {useRef, useState, useEffect} from 'react';
import {SafeAreaView, View, StyleSheet, Modal} from 'react-native';
import ZoomableView, {
  ReactNativeZoomableView,
} from '@openspacelabs/react-native-zoomable-view';
import {captureRef} from 'react-native-view-shot';
import Toolbar from '../../components/drawing/Toolbar';
import ImageCanvasContainer from '../../components/drawing/ImageCanvasContainer';
import ColorPicker from '../../components/drawing/ColorPicker';
import LineThicknessPicker from '../../components/drawing/LineThicknessPicker';
import ShapePicker from '../../components/drawing/ShapePicker';
import Cropper from 'react-native-amazing-cropper';

// The same list of tools
export type Tool = 'draw' | 'line' | 'shape' | 'fill' | 'crop' | 'erase' | null;

const App = () => {
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
  const [lineThickness, setLineThickness] = useState<number>(4);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLinePicker, setShowLinePicker] = useState<boolean>(false);
  const [showShapePicker, setShowShapePicker] = useState<boolean>(false);
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState<string>(
    'https://example.com/sample.jpg',
  );

  // The view ref we use for exporting an image
  const drawingViewRef = useRef<View>(null);

  // We'll still capture the final dimension from ImageCanvasContainer
  const [canvasSize, setCanvasSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  /**
   * Because we now use a HybridContainer approach (or similar) for fill,
   * we no longer need the snapshot + FillCanvas trick. So we remove it.
   */

  const handleToolSelect = (tool: Tool) => {
    if (activeTool === tool) {
      setActiveTool(null);
    } else {
      setActiveTool(tool);
      // If using a color-based tool, open color picker, etc.
      if (tool === 'draw' || tool === 'fill' || tool === 'erase') {
        setShowColorPicker(true);
      }
      if (tool === 'line') {
        setShowLinePicker(true);
      }
      if (tool === 'shape') {
        setShowShapePicker(true);
      }
      if (tool === 'crop') {
        setShowCropper(true);
      }
    }
  };

  const exportImage = async () => {
    try {
      if (drawingViewRef.current) {
        const uri = await captureRef(drawingViewRef, {
          format: 'png',
          quality: 1,
        });
        console.log('Exported image URI:', uri);
      }
    } catch (error) {
      console.error('Error exporting image', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ReactNativeZoomableView
          maxZoom={3}
          minZoom={0.5}
          zoomEnabled={activeTool === null}
          panEnabled={activeTool === null}
          style={styles.zoomable}>
          <View collapsable={false} ref={drawingViewRef}>
            {/* 
              Instead of the old FillCanvas approach, 
              we use the new ImageCanvasContainer 
              that has a HybridContainer behind the scenes. 
            */}
            <ImageCanvasContainer
              activeTool={activeTool}
              selectedColor={selectedColor}
              lineThickness={lineThickness}
              onCanvasSizeChange={size => setCanvasSize(size)}
            />
          </View>
        </ReactNativeZoomableView>

        {/* Your toolbar */}
        <Toolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onExport={exportImage}
        />
      </View>

      {/* Color picker modal */}
      <Modal visible={showColorPicker} transparent animationType="slide">
        <ColorPicker
          selectedColor={selectedColor}
          onSelect={color => {
            setSelectedColor(color);
            setShowColorPicker(false);
          }}
          onClose={() => setShowColorPicker(false)}
        />
      </Modal>

      {/* Line thickness modal */}
      <Modal visible={showLinePicker} transparent animationType="slide">
        <LineThicknessPicker
          selectedThickness={lineThickness}
          onSelect={thickness => {
            setLineThickness(thickness);
            setShowLinePicker(false);
          }}
          onClose={() => setShowLinePicker(false)}
        />
      </Modal>

      {/* Shape picker modal */}
      <Modal visible={showShapePicker} transparent animationType="slide">
        <ShapePicker
          onSelect={(shapeType: string) => {
            setShowShapePicker(false);
          }}
          onClose={() => setShowShapePicker(false)}
        />
      </Modal>

      {/* Cropper */}
      <Modal visible={showCropper} transparent animationType="slide">
        <Cropper
          imageUri={backgroundImage}
          onDone={croppedUri => {
            setBackgroundImage(croppedUri);
            setShowCropper(false);
          }}
          onCancel={() => setShowCropper(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  zoomable: {
    flex: 1,
  },
});
