# Playground Code
Create a playground editor to run code. This is an easy way for some situations, such as test a code snippet, validate algorithm and so on.
[Extension Main Page](https://marketplace.visualstudio.com/items?itemName=yanzf.PlaygroundCode&ssr=false#overview)

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
> The temporary folder is used to save the playground file that you run. Please note that you should reopen the VSCode after set the temporary folder.

## Keyboard Shortcuts

- ```Ctrl+P+C```  Create playground code.
- ```Ctrl+F5```  Run playground code.

## Known Issues

- For Windows System, the output channel would be garbled if your code were occurred error.

## Release Notes

### 1.1.6

1.Show time cost of execution.

2.Bug Fixed

### 1.1.5

1.Put playground file to the separate folder.

2.Bug Fixed. 

### 1.1.4

1.Bug Fixed. 

### 1.1.3

1.Bug Fixed. 

### 1.1.2

1.Bug Fixed. 

### 1.1.0

1.Support run in terminal.

2.Bug Fixed. 

### 1.0.6

Bug Fixed.

### 1.0.5

Support D Language-Playground.

### 1.0.4

Sort the language list.

### 1.0.3

Support Dart-Playground.

### 1.0.2

Bug Fixed.

### 1.0.1

Support Keyboard Shortcuts.

### 1.0.0

Initial release of PlaygroundCode.

**Enjoy!**
