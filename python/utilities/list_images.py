import os
import sys
from glob import glob


def list_images(in_folder_path: str, in_ext: list = ('png', 'jpg')):
    """List all images in a folder in sub-categories.
       All images must be located in a sub-folder, i.e. in_folder_path/sub_folder/image.

    Parameters
    ----------
    in_folder_path    Input folder path.
    in_ext            Input extensions to look for.
    """

    # List all the input files (recursively), relatively to 'in_folder_path'
    files_list = []
    for extension in in_ext:
        files_list += [os.path.relpath(y, in_folder_path) for x in os.walk(in_folder_path) for y in
                       glob(os.path.join(x[0], '*.' + extension))]

    # List all files in a dictionary per sub-folder
    files_dict = dict()

    for file_path in files_list:
        file_split = os.path.split(file_path)
        assert len(file_split) == 2

        key = file_split[0]
        if key in files_dict:
            files_dict[key].append(file_split[1])
        else:
            files_dict[key] = [file_split[1]]

    # Convert the dictionary to a shorter form to store all the images as 'image_0#image_1#image_2'
    store_dict = dict()

    for key, files in files_dict.items():
        files_count = len(files)
        assert files_count >= 1

        files_str = files[0]
        for i in range(1, files_count):
            files_str += '#' + files[i]
        store_dict[key] = files_str

    # Print final result
    print(store_dict)


if __name__ == '__main__':
    # Usage: python list_images.py in_folder_path
    argv = sys.argv
    assert len(argv) == 2
    list_images(in_folder_path=argv[1])
