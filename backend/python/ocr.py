from OCR_Helper import OCR

def perform_OCR(folder_path, temp_folder, output_folder):
    OCR(folder_path, temp_folder, output_folder)

# if __name__ == "__main__":
#     folder_path = './input/image.jpg'
#     temp_folder = "helper" # nanti bakal auto kehapus waktu selesai run 
#     output_folder = "output"
#     Perform_OCR(folder_path, temp_folder, output_folder)
