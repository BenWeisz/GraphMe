import * as vscode from 'vscode';

import { addNewFileMarking, getFileMarking, FileMarking } from './storage';
import { getDataElements } from './algorithm';

export function activate(context: vscode.ExtensionContext) {
	console.log('GraphMe extension activated.');

	let activeEditor = vscode.window.activeTextEditor;

	let markColDisposable = vscode.commands.registerCommand('graphme.markcol', () => {
		vscode.window.showInformationMessage('Mark Column');
	});
	let markRowDisposable = vscode.commands.registerCommand('graphme.markrow', () => {
		vscode.window.showInformationMessage('Mark Row');
	});
	
	let genCodeDisposable = vscode.commands.registerCommand('graphme.gencode', () => {
		const activeTextEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		if (activeTextEditor) {
			if (activeTextEditor?.document.fileName) {
				const fileName: string = activeTextEditor?.document.fileName;
				const marking: FileMarking | undefined = getFileMarking(fileName);
				if (!marking) {
					vscode.window.showErrorMessage('Please add graphing markings before generating graphing code!');
				}
				else {
					vscode.window.showInformationMessage('TODO: Add code generation');
				}
			}
			else { 
				vscode.window.showErrorMessage('This file is not named');
			}
		}
		else { 
			vscode.window.showErrorMessage("This window editor does not contain graphing data.");
		}
		// const fileName: string = vscode.window.activeTextEditor?.document.fileName;

		// getFileMarking()
	});

	context.subscriptions.push(markColDisposable);
	context.subscriptions.push(genCodeDisposable);
	context.subscriptions.push(markRowDisposable);

	// This portion of the code was modified from https://github.com/microsoft/vscode-extension-samples/tree/main/decorator-sample
	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate small numbers
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		light: {
			// this color will be used in light color themes
			backgroundColor: '#FF000055'
		},
		dark: {
			// this color will be used in dark color themes
			backgroundColor: '#FF000055'
		},
	});

	const updateDecorations = () => {
		if (!activeEditor) {
			return;
		}

		getDataElements(activeEditor.document.getText(), false, 4);

		const fileName: string = activeEditor?.document.fileName;
		const marking: FileMarking | undefined = getFileMarking(fileName);
		if (!marking) {
			return;
		}
		
		const text = activeEditor.document.getText();
		// const highlights: vscode.DecorationOptions = [];



		const regEx = /[\s\t]+/g;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
			if (match[0].length < 3) {
				smallNumbers.push(decoration);
			} else {
				largeNumbers.push(decoration);
			}
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
	};

	const triggerUpdateDecorations = (throttle = false) => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 500);
		} else {
			updateDecorations();
		}
	};

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {}

