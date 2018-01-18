'''
Update.py

This script updates the open-source Bootleaf app from the main Bootleaf development branch.

'''

import sys, os
from distutils.dir_util import copy_tree

destination = "/Library/WebServer/Documents/demos/bootleaf"
source = "/Library/WebServer/Documents/iagcl/geo_web/Leaflet/bootleaf"

# Copy/Update the entire Bootleaf /src/ folder, and the Bootleaf Checker in the /check/ folder
for dir in ['src','check']:
    inDir = os.path.join(source, dir)
    outDir = os.path.join(destination, dir)
    print ("copying from " + inDir + " to " + outDir)
    copy_tree(inDir, outDir)

    # Replace iag. with bootleaf.

    for root, dirs, files in os.walk(outDir):
        for file in files:
            if file.endswith(".js"):
                print(os.path.join(root, file))

                # Read in the source file
                with open(os.path.join(root, file), 'r') as f:
                    contents = f.read()

                    # Replace the target string
                    contents = contents.replace('iag', 'bootleaf')

                    # Write the file out again
                    with open(os.path.join(root, file), 'w') as g:
                      g.write(contents)
