#!C:\pathxl\python\Python27\python.exe
#""" before it was just 'C:\Python27\python.exe' """
# EASY-INSTALL-ENTRY-SCRIPT: 'pip==1.5.6','console_scripts','pip2.7'
__requires__ = 'pip==1.5.6'
import sys
from pkg_resources import load_entry_point

if __name__ == '__main__':
    sys.exit(
        load_entry_point('pip==1.5.6', 'console_scripts', 'pip2.7')()
    )
