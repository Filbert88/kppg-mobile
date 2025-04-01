import React, {useEffect, useState} from 'react';
import {View, Image, StyleSheet, Dimensions} from 'react-native';
// import DrawingCanvas from './DrawingCanvas'; // We'll replace this
import HybridContainer from './HybridContainer';

interface ImageCanvasContainerProps {
  activeTool: string | null;
  selectedColor: string;
  lineThickness: number;
  onCanvasSizeChange: (size: {width: number; height: number}) => void;
}

const imageSource = require('../../public/assets/fotodiri.jpg');

const ImageCanvasContainer: React.FC<ImageCanvasContainerProps> = ({
  activeTool,
  selectedColor,
  lineThickness,
  onCanvasSizeChange,
}) => {
  const [canvasSize, setCanvasSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  useEffect(() => {
    const {width, height} = Image.resolveAssetSource(imageSource);
    const screenWidth = Dimensions.get('window').width;
    const scaleFactor = screenWidth / width;
    const size = {width: screenWidth, height: height * scaleFactor};
    setCanvasSize(size);
    onCanvasSizeChange(size);
  }, []);

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
          source={imageSource}
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
          activeTool={activeTool as any} // or cast your type
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
