from ocr_helper import OCR

def perform_OCR(folder_path, temp_folder, output_folder):
    OCR(folder_path, temp_folder, output_folder)

if __name__ == "__main__":
    folder_path = './input_ocr/ocr1.jpg'
    temp_folder = "temp_ocr" # nanti bakal auto kehapus waktu selesai run 
    output_folder = "output"
    perform_OCR(folder_path, temp_folder, output_folder)
