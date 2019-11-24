# Playground Code
Create a playground editor to run code. This is an easy way for some situations, such as test a code snippet, validate algorithm and so on.

## Features

- Create playground editor for supported language 
- Kill the playground process
- Reset the playground
- Print output to the VSCode output channel

## Requirements

Make sure the language you want to run has been installed on your system. Such as you want to run a c# playground on Windows, the .net framework should be installed first.

## Get Start
![getstart](https://github.com/yanzf0417/assets/blob/master/playground/getstart.gif?raw=true)

## Config

### Config script
![config](https://github.com/yanzf0417/assets/blob/master/playground/config.gif?raw=true)

> the ${file} variable is represent for the code filename.For example, ```go run ${file}``` is equal to ```go run vscode_playground.go```.

### Config temporary folder 
![config](https://github.com/yanzf0417/assets/blob/master/playground/config_temporaryfolder.gif?raw=true)
> The temporary folder is used to save the playground file that you run.

## Known Issues

- For Windows System, the output channel would be garbled if your code were occurred error.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of PlaygroundCode.

**Enjoy!**
