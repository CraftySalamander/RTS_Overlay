# Prepare the release library
import os
import sys
import shutil


def compile_clean(name_game: str,
                  disable_console: bool = True, finalize_folder: bool = False):
    """Compile an overlay program and clean the building files.

    Parameters
    ----------
    name_game          Name of the game.
    disable_console    True to disable the console output.
    finalize_folder    True to finalize the folder (copy additional files, zip, clean).
    """
    name_main_file = 'main_' + name_game  # name of the main python file (without path & extension)
    name_out_lib = name_game + '_overlay'  # name of the output library

    # create output folders
    overlay_folder = os.path.join(name_out_lib, 'overlay')
    utilities_folder = os.path.join(overlay_folder, 'utilities')

    assert not os.path.isdir(name_out_lib)
    os.mkdir(name_out_lib)
    os.mkdir(overlay_folder)
    os.mkdir(utilities_folder)

    icon = '../../docs/assets/common/icon/salamander_sword_shield.ico'  # icon for the library

    # nuitka command to run
    command = ('cmd /c "python -m nuitka'
               ' --standalone'
               ' --plugin-enable=pyqt5'
               f' --windows-icon-from-ico={icon}'
               f' --include-data-file=../common/*.py=common/'
               f' --include-data-file=../{name_game}/*.py={name_game}/'
               f' --include-data-dir=../../docs/assets/common=docs/assets/common'
               f' --include-data-dir=../../docs/assets/{name_game}=docs/assets/{name_game}')

    if disable_console:  # disable the console
        command += ' --windows-disable-console'

    command += f' ../{name_main_file}.py'  # main file to compile

    os.system(command)  # compilation

    # rename executable name
    os.rename(os.path.join(f'{name_main_file}.dist', f'{name_main_file}.exe'),
              os.path.join(f'{name_main_file}.dist', f'{name_out_lib}.exe'))

    if not disable_console:  # rename for version with console
        os.rename(os.path.join(f'{name_main_file}.dist', f'{name_out_lib}.exe'),
                  os.path.join(f'{name_main_file}.dist', f'{name_out_lib}_with_console.exe'))

    # copy files in output directory
    shutil.copytree(f'{name_main_file}.dist', overlay_folder, dirs_exist_ok=True)

    # move pictures in new directory
    out_docs = os.path.join(name_out_lib, 'docs')
    os.makedirs(out_docs, exist_ok=True)
    shutil.move(os.path.join(overlay_folder, 'docs', 'assets'), out_docs)

    # clean building files
    shutil.rmtree(f'{name_main_file}.build')
    shutil.rmtree(f'{name_main_file}.dist')

    # finalize the output folder
    if finalize_folder:
        # copy readme, changelog, license, version and requirements
        shutil.copy('../../Readme.md', name_out_lib)
        shutil.copy('../../Changelog.md', name_out_lib)
        shutil.copy('../../LICENSE', name_out_lib)
        shutil.copy('../../version.json', name_out_lib)
        shutil.copy('requirements.txt', utilities_folder)

        # copy remaining source files
        shutil.copy(f'../{name_main_file}.py', overlay_folder)
        shutil.copy('prepare_release.py', utilities_folder)

        # zip output folder
        shutil.make_archive(name_out_lib, 'zip', name_out_lib)
        shutil.rmtree(name_out_lib)  # clean non-zipped files


if __name__ == '__main__':
    # python prepare_release.py [name_game] (aoe2, aoe4, sc2)
    if len(sys.argv) != 2:  # compile all projects
        selected_games = ['aoe2', 'aoe4', 'sc2']
    else:
        selected_games = [sys.argv[1]]

    for selected_game in selected_games:
        compile_clean(name_game=selected_game, disable_console=True, finalize_folder=True)
