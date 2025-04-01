import React, {useEffect, useState} from 'react';
import {View, Image, StyleSheet, Dimensions} from 'react-native';
// import DrawingCanvas from './DrawingCanvas'; // We'll replace this
import HybridContainer from './HybridContainer';
import {Tool} from '../../pages/fragmentation-form/EditingApp';

interface ImageCanvasContainerProps {
  activeTool: string | null;
  setActiveTool: (tool: Tool) => void;
  selectedColor: string;
  selectedShapeType: string;
  lineThickness: number;
  eraserThickness: number;
  onCanvasSizeChange: (size: {width: number; height: number}) => void;
  backgroundImage: string;
}


const ImageCanvasContainer: React.FC<ImageCanvasContainerProps> = ({
  activeTool,
  setActiveTool,
  selectedColor,
  selectedShapeType,
  lineThickness,
  eraserThickness,
  onCanvasSizeChange,
  backgroundImage,
}) => {
  const [canvasSize, setCanvasSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;

    const setScaledSize = (imgWidth: number, imgHeight: number) => {
      const scaleFactor = screenWidth / imgWidth;
      const scaledWidth = screenWidth;
      const scaledHeight = Math.floor(imgHeight * scaleFactor);
      const size = {width: scaledWidth, height: scaledHeight};

      setCanvasSize(size);
      onCanvasSizeChange(size);
    };
    if (typeof backgroundImage === 'number') {
      // It's a local require(...) resource.
      // For example: require('./path/to/image')
      const source = Image.resolveAssetSource(backgroundImage);
      if (source && source.width && source.height) {
        setScaledSize(source.width, source.height);
      }
    } else if (typeof backgroundImage === 'string') {
      // It's probably a remote URL
      Image.getSize(
        backgroundImage,
        (imgWidth, imgHeight) => {
          setScaledSize(imgWidth, imgHeight);
        },
        error => {
          console.log('Error loading remote image for size:', error);
        },
      );
    }
  }, [backgroundImage]);

  if (canvasSize.width === 0 || canvasSize.height === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {width: canvasSize.width, height: canvasSize.height},
      ]}>
      {/* Background image */}
      <View
        style={[
          styles.imageWrapper,
          {width: canvasSize.width, height: canvasSize.height},
        ]}
        pointerEvents="none">
        <Image
          source={{uri: backgroundImage}}
          style={[
            styles.image,
            {width: canvasSize.width, height: canvasSize.height},
          ]}
          resizeMode="contain"
        />
      </View>

      {/* The HybridContainer with both pixel canvas + svg overlay */}
      <View
        style={[
          styles.overlay,
          {width: canvasSize.width, height: canvasSize.height},
        ]}>
        <HybridContainer
          width={canvasSize.width}
          height={canvasSize.height}
          eraserThickness={eraserThickness}
          setActiveTool={setActiveTool}
          activeTool={activeTool as any} // or cast your type
          selectedShapeType={selectedShapeType}
          selectedColor={selectedColor}
          lineThickness={lineThickness}
        />
      </View>
    </View>
  );
};

export default ImageCanvasContainer;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  image: {},
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
