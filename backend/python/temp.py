def enhance_images_in_folder(folder_path="temp_ocr"):
    """
    Enhance all images in a folder to improve OCR quality and replace the original files.
    
    Args:
        folder_path: Path to folder containing images (default: "temp_ocr")
        
    Returns:
        int: Number of processed images
    """
    import cv2
    import numpy as np
    import os
    from PIL import Image, ImageEnhance
    from pathlib import Path
    
    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} not found.")
        return 0
    
    # Get all image files in the folder
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    image_files = []
    for ext in image_extensions:
        image_files.extend(Path(folder_path).glob(f"*{ext}"))
    
    if not image_files:
        print(f"No image files found in {folder_path}")
        return 0
    
    processed_count = 0
    
    # Process each image
    for img_path in image_files:
        try:
            # Read the image
            img_path_str = str(img_path)
            image = cv2.imread(img_path_str)
            if image is None:
                print(f"Could not read image from {img_path}, skipping.")
                continue
            
            # Step 1: Increase resolution
            scale_factor = 3.0
            image = cv2.resize(image, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
            
            # Step 2: Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Step 3: Apply adaptive thresholding to improve contrast
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                          cv2.THRESH_BINARY, 11, 2)
            
            # Step 4: Remove noise with median blur
            denoised = cv2.medianBlur(thresh, 3)
            
            # Step 5: Sharpen the image
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharpened = cv2.filter2D(denoised, -1, kernel)
            
            # Step 6: Additional enhancements using PIL
            pil_img = Image.fromarray(sharpened)
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(pil_img)
            enhanced_img = enhancer.enhance(2.0)
            
            # Enhance sharpness again
            enhancer = ImageEnhance.Sharpness(enhanced_img)
            enhanced_img = enhancer.enhance(2.0)
            
            # Convert back to OpenCV format
            enhanced_cv = np.array(enhanced_img)
            
            # Apply one more round of adaptive thresholding for better contrast
            if len(enhanced_cv.shape) == 3:
                enhanced_cv = cv2.cvtColor(enhanced_cv, cv2.COLOR_RGB2GRAY)
            
            final = cv2.adaptiveThreshold(enhanced_cv, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                         cv2.THRESH_BINARY, 11, 2)
            
            # Save the enhanced image, replacing the original
            cv2.imwrite(img_path_str, final)
            processed_count += 1
            print(f"Enhanced and replaced: {img_path}")
            
        except Exception as e:
            print(f"Error enhancing {img_path}: {e}")
    
    print(f"Enhanced and replaced {processed_count} out of {len(image_files)} images")
    return 

enhance_images_in_folder()