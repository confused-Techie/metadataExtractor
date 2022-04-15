# MetaDataExtractor

This program is definetly not finished, yet still functional.

The application will take any and all supported photos and videos stored in the data folder and will extract all the metadata it can from them.

After extracting the metadata it will saved it to a comma separated array of objects in the `metadata.json` file at the root of this project.

This was based off code from another one of my projects [LoMiArch-API](https://github.com/confused-Techie/LoMiArch-API) but MetaDataExtractor was originally made with the intention to show how sharing services strip metadata for you.

For example taking an original photo, and downloading the same photo after sent using Discord, Instagram or Facebook, you could then see the difference in available metadata.

This can help narrow peoples understood attack vector of uploading photos online, but also help to hopefully point out sites that do this with an insecure practice.

## Usage

After downloading the repo, and ensuring that NPM and this programs dependencies are installed.

You can either install this program as a command line tool (keeping in mind that currently the folder is hardcoded) with:

````
npm install -g .
````

Or optionally you could run the application as is from the root of the project.

````
node .
````

After doing so a file will be created at the root of the file system titled: `metadata.json` containing your metadata.
