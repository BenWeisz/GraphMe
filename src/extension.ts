import * as vscode from 'vscode';

import { addNewFileMarking, getFileMarking, FileMarking, addSeries } from './storage';
import { getDataElements, DataElement } from './algorithm';

export function activate(context: vscode.ExtensionContext) {
	console.log('GraphMe extension activated.');

	let activeEditor = vscode.window.activeTextEditor;

	let markColDisposable = vscode.commands.registerCommand('graphme.markcol', () => {
		vscode.window.showInformationMessage('Mark Column');
	});
	let markRowDisposable = vscode.commands.registerCommand('graphme.markrow', () => {
		if (activeEditor) {
			if (!activeEditor?.selection.isEmpty) {
				const fileName: string = activeEditor.document.fileName;
				let marking: FileMarking | undefined = getFileMarking(fileName);
				const lineNum: number = activeEditor.selection.active.line;
				if (!marking) {
					addNewFileMarking(fileName, false, lineNum, null);
				}
				else {
					if (!marking.seriesIndices.includes(lineNum)) {
						addSeries(marking, lineNum);
					}
					else {
						// Add code to remove selection
					}
				}
			}
			else {
				vscode.window.showInformationMessage('Please highlight a row before using the Mark Row command.');
			}
			triggerUpdateDecorations();
		}
	});
	
	let genCodeDisposable = vscode.commands.registerCommand('graphme.gencode', () => {
		if (activeEditor) {
			if (activeEditor?.document.fileName) {
				const fileName: string = activeEditor?.document.fileName;
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
	const evenDecoration = vscode.window.createTextEditorDecorationType({
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

		
		const fileName: string = activeEditor?.document.fileName;
		const marking: FileMarking | undefined = getFileMarking(fileName);
		if (!marking) {
			return;
		}
		
		const text = activeEditor.document.getText();

		let i: number = 0;
		const highlights: vscode.DecorationOptions[] = [];
		while (i < marking.seriesIndices.length) {
			const dataElements: DataElement[] = getDataElements(text, marking.colMode, marking.seriesIndices[i]);
			
			if (!marking.colMode) {
				const rawStartPos: vscode.Position = activeEditor.document.positionAt(dataElements[0].start);
				const startPos: vscode.Position = new vscode.Position(rawStartPos.line, 0);
				const endPos: vscode.Position = activeEditor.document.positionAt(dataElements[dataElements.length - 1].end);

				highlights.push({ range: new vscode.Range(startPos, endPos) });
			}

			i++;
		}
		activeEditor.setDecorations(evenDecoration, highlights);
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

