import React, {useRef, useState} from 'react';
import {SafeAreaView, View, StyleSheet, Dimensions, Modal} from 'react-native';
import ZoomableView, {
  ReactNativeZoomableView,
} from '@openspacelabs/react-native-zoomable-view';
import {captureRef} from 'react-native-view-shot';
import AmazingCropper from 'react-native-amazing-cropper';

import Toolbar from '../../components/drawing/Toolbar';
import ImageCanvasContainer from '../../components/drawing/ImageCanvasContainer';
import ColorPicker from '../../components/drawing/ColorPicker';
import LineThicknessPicker from '../../components/drawing/LineThicknessPicker';
import ShapePicker from '../../components/drawing/ShapePicker';

export type Tool = 'draw' | 'line' | 'shape' | 'fill' | 'crop' | 'erase' | null;

const App = () => {
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
  const [lineThickness, setLineThickness] = useState<number>(4);

  // Show/hide pickers as modals
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);

  // Show/hide the Cropper
  const [showCropper, setShowCropper] = useState(false);

  const [backgroundImage, setBackgroundImage] = useState<string>(
    'https://upload.wikimedia.org/wikipedia/commons/6/63/Biho_Takashi._Bat_Before_the_Moon%2C_ca._1910.jpg',
  );

  // The container we capture
  const drawingViewRef = useRef<View>(null);
  const [cropSourceUri, setCropSourceUri] = useState<string | null>(null);

  const [canvasSize, setCanvasSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  // 1) When the user picks the "crop" tool, we capture, set `showCropper=true`, but do NOT unmount the container
  const handleToolSelect = (tool: Tool) => {
    if (activeTool === tool) {
      setActiveTool(null);
    } else {
      setActiveTool(tool);

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
        if (drawingViewRef.current) {
          captureRef(drawingViewRef, {format: 'png', quality: 1})
            .then(uri => {
              console.log('Captured =>', uri);
              setCropSourceUri(uri);
              setShowCropper(true); // We'll show the Cropper on top
            })
            .catch(err => console.error('Error capturing snapshot:', err));
        }
      }
    }
  };

  const exportImage = async () => {
    if (drawingViewRef.current) {
      const uri = await captureRef(drawingViewRef, {format: 'png', quality: 1});
      console.log('Exported =>', uri);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Always mount the drawing UI so ephemeral pixel data is not lost */}
      <View
        style={styles.container}
        pointerEvents={showCropper ? 'none' : 'auto'}>
        <ReactNativeZoomableView
          maxZoom={3}
          minZoom={0.5}
          zoomEnabled={!showCropper && activeTool === null}
          panEnabled={!showCropper && activeTool === null}
          style={styles.zoomable}>
          <View collapsable={false} ref={drawingViewRef}>
            <ImageCanvasContainer
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              selectedColor={selectedColor}
              lineThickness={lineThickness}
              onCanvasSizeChange={size => setCanvasSize(size)}
              backgroundImage={backgroundImage}
            />
          </View>
        </ReactNativeZoomableView>

        <Toolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onExport={exportImage}
        />
      </View>

      {/* Overlaid Cropper in absolute style, hidden unless showCropper=true */}
      {showCropper && cropSourceUri && (
        <View style={styles.cropOverlay}>
          <AmazingCropper
            imageUri={cropSourceUri}
            imageWidth={canvasSize.width || 600}
            imageHeight={canvasSize.height || 800}
            onDone={croppedUri => {
              console.log('Cropped =>', croppedUri);
              setBackgroundImage(croppedUri);
              setShowCropper(false);
              setActiveTool(null);
            }}
            onCancel={() => {
              console.log('Crop canceled');
              setShowCropper(false);
              setActiveTool(null);
            }}
            onError={err => {
              console.log('Crop error =>', err);
              setShowCropper(false);
              setActiveTool(null);
            }}
            COMPONENT_HEIGHT={Dimensions.get('window').height - 120}
          />
        </View>
      )}

      {/* The color/line/shape pickers still modals */}
      {showColorPicker && (
        <Modal transparent animationType="slide">
          <ColorPicker
            selectedColor={selectedColor}
            onSelect={color => {
              setSelectedColor(color);
              setShowColorPicker(false);
            }}
            onClose={() => setShowColorPicker(false)}
          />
        </Modal>
      )}

      {showLinePicker && (
        <Modal transparent animationType="slide">
          <LineThicknessPicker
            selectedThickness={lineThickness}
            onSelect={thickness => {
              setLineThickness(thickness);
              setShowLinePicker(false);
            }}
            onClose={() => setShowLinePicker(false)}
          />
        </Modal>
      )}

      {showShapePicker && (
        <Modal transparent animationType="slide">
          <ShapePicker
            onSelect={(shapeType: string) => {
              setShowShapePicker(false);
              // handle shape creation
            }}
            onClose={() => setShowShapePicker(false)}
          />
        </Modal>
      )}
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
  cropOverlay: {
    // absolutely fill the screen
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000', // typical for a crop background
  },
});
