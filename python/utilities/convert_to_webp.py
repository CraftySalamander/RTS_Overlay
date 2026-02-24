import os
import argparse
from PIL import Image


def convert_to_webp(input_dir):
    # Walk through the input directory recursively
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            # Check if the file is a .png or .jpg
            if file.lower().endswith(('.png', '.jpg')):
                # Construct full file path
                file_path = os.path.join(root, file)
                try:
                    # Open the image file
                    with Image.open(file_path) as img:
                        # Construct the new file path with .webp extension
                        new_file_path = os.path.splitext(file_path)[0] + '.webp'
                        # Save the image in .webp format
                        img.save(new_file_path, 'WEBP')
                        print(f"Converted {file_path} to {new_file_path}")
                    # Remove the original file after successful conversion
                    os.remove(file_path)
                    print(f"Removed original file: {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")


def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(
        description='Convert .png and .jpg files to .webp format and remove original files.'
    )
    parser.add_argument('-i', '--input_dir', type=str, required=True, help='Input directory path')
    args = parser.parse_args()

    # Call the conversion function
    convert_to_webp(args.input_dir)


if __name__ == '__main__':
    main()
