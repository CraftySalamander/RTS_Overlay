import os
import sys
from glob import glob
from PIL import Image  # pip install pillow


def convert_images(in_folder_path: str, out_folder_path: str,
                   in_ext: list = ('webp', 'gif', 'png', 'jpg', 'jfif'), out_ext: str = 'png'):
    """Convert images from one format to another

    Parameters
    ----------
    in_folder_path     input folder path
    out_folder_path    output folder path
    in_ext             input extensions to look for
    out_ext            generated output extension
    """

    # list all the input files (recursively)
    files_list = []
    for extension in in_ext:
        files_list += [y for x in os.walk(in_folder_path) for y in glob(os.path.join(x[0], '*.' + extension))]

    for in_file in files_list:  # list on the input files
        # name of the output file
        out_file = os.path.splitext(os.path.join(out_folder_path, os.path.relpath(in_file, in_folder_path)))[
                       0] + '.' + out_ext
        print(in_file, '->', out_file)

        # create directory if non-existent
        os.makedirs(os.path.dirname(out_file), exist_ok=True)

        # save the image in the new format
        im = Image.open(in_file)
        im.save(out_file)


if __name__ == '__main__':
    # Usage: python convert_images.py in_folder_path out_folder_path
    argv = sys.argv
    assert len(argv) == 3
    convert_images(in_folder_path=argv[1], out_folder_path=argv[2])
