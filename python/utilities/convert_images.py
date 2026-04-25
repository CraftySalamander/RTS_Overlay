import os
import argparse
from glob import glob
from PIL import Image  # pip install pillow


def convert_images(
    in_folder_path: str,
    out_folder_path: str,
    in_ext: list = ('webp', 'gif', 'png', 'jpg', 'jfif'),
    out_ext: str = ('webp', 'png', 'jpg'),
    max_size: int = -1,
):
    """Convert images from one format to another and limit its size.

    Parameters
    ----------
    in_folder_path     Input folder path.
    out_folder_path    Output folder path.
    in_ext             Input extensions to look for.
    out_ext            Generated output extension, will keep the same extension as input if it is in the list,
                       otherwise will use the first extension of the list.
    max_size           Maximum size along both width and height, negative to ignore.
    """
    assert len(out_ext) >= 1

    # list all the input files (recursively)
    files_list = []
    for extension in in_ext:
        files_list += [y for x in os.walk(in_folder_path) for y in glob(os.path.join(x[0], '*.' + extension))]

    for in_file in files_list:  # list on the input files
        in_ext = os.path.splitext(in_file)[1][1:]  # input extension
        selected_out_ext = in_ext if (in_ext in out_ext) else out_ext[0]
        # name of the output file
        out_file = (
            os.path.splitext(os.path.join(out_folder_path, os.path.relpath(in_file, in_folder_path)))[0]
            + '.'
            + selected_out_ext
        )
        print(in_file, '->', out_file)

        # create directory if non-existent
        os.makedirs(os.path.dirname(out_file), exist_ok=True)

        # open image
        im = Image.open(in_file)

        # resize
        if max_size > 0:
            width, height = im.size
            assert (width > 0) and (height > 0)
            if width == height:
                if width > max_size:
                    im = im.resize((max_size, max_size))
            elif width > height:
                if width > max_size:
                    ratio = height / width
                    new_width = max_size
                    new_height = int(ratio * new_width)
                    im = im.resize((new_width, new_height))
            else:
                if height > max_size:
                    ratio = width / height
                    new_height = max_size
                    new_width = int(ratio * new_height)
                    im = im.resize((new_width, new_height))

        # save the image in the new format
        im.save(out_file)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert images from one format to another and limit their size.')
    parser.add_argument('-i', '--input', type=str, required=True, help='Input folder path')
    parser.add_argument('-o', '--output', type=str, required=True, help='Output folder path')
    parser.add_argument(
        '-m', '--max_size', type=int, default=-1, help='Maximum size along both width and height, negative to ignore'
    )

    args = parser.parse_args()

    convert_images(in_folder_path=args.input, out_folder_path=args.output, max_size=args.max_size)
