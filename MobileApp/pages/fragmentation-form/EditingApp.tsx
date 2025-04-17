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
import EraseThicknessPicker from '../../components/drawing/EraseThicknessPicker';

export type Tool = 'draw' | 'line' | 'shape' | 'fill' | 'crop' | 'erase' | null;
interface EditingAppProps {
  initialImage: string; // the image to edit
  onClose: (resultUri: string | null) => void; // pass final edited image or null if canceled
}
const EditingApp: React.FC<EditingAppProps> = ({initialImage, onClose}) => {
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [selectedShapeType, setSelectedShapeType] = useState<string>('rect');
  const [lineThickness, setLineThickness] = useState<number>(4);
  const [eraseThickness, setEraseThickness] = useState<number>(8);

  // Show/hide pickers as modals
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showErasePicker, setShowErasePicker] = useState(false);
   const [canvasKey, setCanvasKey] = useState<number>(0);

  // Show/hide the Cropper
  const [showCropper, setShowCropper] = useState(false);

  const [backgroundImage, setBackgroundImage] = useState<string>(
   initialImage
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

      if (tool === 'draw' || tool === 'fill') {
        setShowColorPicker(true);
      }
      if (tool === 'line') {
        setShowLinePicker(true);
      }
      if (tool === 'shape') {
        setShowShapePicker(true);
      }
      // For erase => show erase thickness
      if (tool === 'erase') {
        setShowErasePicker(true);
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

  const exportEditedImage = async () => {
    if(drawingViewRef.current){
      const uri = await captureRef(drawingViewRef, { format:'png', quality:1 });
      console.log('Edited image =>', uri);
      // pass this final URI back to parent
      onClose(uri);
    } else {
      // if can't capture, just pass null
      onClose(null);
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
              key={canvasKey}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              selectedColor={selectedColor}
              selectedShapeType={selectedShapeType}
              lineThickness={lineThickness}
              eraserThickness={eraseThickness}
              onCanvasSizeChange={size => setCanvasSize(size)}
              backgroundImage={backgroundImage}
            />
          </View>
        </ReactNativeZoomableView>

        <Toolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onExport={exportEditedImage}
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
              setCanvasKey(k => k + 1);
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
              setSelectedShapeType(shapeType)
              // handle shape creation
            }}
            onClose={() => setShowShapePicker(false)}
          />
        </Modal>
      )}

      {/* ERASE THICKNESS PICKER MODAL */}
      {showErasePicker && (
        <Modal transparent animationType="slide">
          <EraseThicknessPicker
            selectedThickness={eraseThickness}
            onSelect={thick => {
              setEraseThickness(thick);
              setShowErasePicker(false);
            }}
            onClose={() => setShowErasePicker(false)}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default EditingApp;

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
