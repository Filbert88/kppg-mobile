from frag_helper import SegmentAnythingPipeline
import os 

def fragmentation(input_path, output_path):
    # input_name = os.path.splitext(os.path.basename(input_path))[0]
    # output_path = f'output/res_{input_name}.png'
    
    pipeline = SegmentAnythingPipeline()
    pipeline.process_image(input_path, output_path)

fragmentation("./input/img3.jpeg", "./output/res_3.jpeg")
