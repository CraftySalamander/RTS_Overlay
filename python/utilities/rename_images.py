import os
import argparse
from glob import glob


def rename_files(
    in_folder_path: str,
    string_removal_patterns: str,
    extensions: tuple = ('webp', 'gif', 'png', 'jpg', 'jfif'),
):
    """Rename files recursively in the input folder to lowercase and remove specified patterns.

    Parameters
    ----------
    in_folder_path            Input folder path.
    extensions                File extensions to process.
    string_removal_patterns   Semicolon-separated list of patterns to remove from filenames.
    """
    patterns = string_removal_patterns.split(';')

    # List all the input files (recursively)
    files_list = []
    for ext in extensions:
        files_list += [y for x in os.walk(in_folder_path) for y in glob(os.path.join(x[0], f'*.{ext}'))]

    for file_path in files_list:
        dir_name, old_filename = os.path.split(file_path)
        filename, ext = os.path.splitext(old_filename)
        new_filename = filename.lower()

        # Remove each pattern from the filename
        for pattern in patterns:
            new_filename = new_filename.replace(pattern.lower(), '')

        # Remove any double underscores or trailing underscores
        new_filename = new_filename.replace('__', '_').strip('_')

        new_filename += ext
        new_file_path = os.path.join(dir_name, new_filename)

        # Rename the file
        if old_filename != new_filename:
            os.rename(file_path, new_file_path)
            print(f'Renamed: {old_filename} -> {new_filename}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Rename image files recursively to lowercase and remove specified patterns.'
    )
    parser.add_argument('-i', '--input', type=str, required=True, help='Input folder path')
    parser.add_argument(
        '-s',
        '--string_removal',
        type=str,
        default="_icon;_aoe2;_aoe4;_aomr;aomr_;_sc2;_wc3",
        help='Semicolon-separated list of patterns to remove from filenames',
    )

    args = parser.parse_args()

    rename_files(in_folder_path=args.input, string_removal_patterns=args.string_removal)
