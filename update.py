'''
Update.py

This script updates the open-source Bootleaf app from the main Bootleaf development branch.

'''

import sys, os
from distutils.dir_util import copy_tree

destination = "/Library/WebServer/Documents/demos/bootleaf"

# Find the path to the Bootleaf source code, which is a few directories up from this script
source = "/Library/WebServer/Documents/iagcl/geo_web/Leaflet/bootleaf"

# Copy/Update the entire Bootleaf /src/ folder, and the Bootleaf Checker in the /check/ folder
for dir in ['src','check']:
    inDir = os.path.join(source, dir)
    outDir = os.path.join(destination, dir)
    print ("copying from " + inDir + " to " + outDir)
    copy_tree(inDir, outDir)
