import * as vscode from 'vscode';

import { addNewFileMarking, resetFileMarking, getFileMarking, FileMarking, addSeries, removeSeries } from './storage';
import { getDataElements, getSelectedColumn, DataElement } from './algorithm';

export function activate(context: vscode.ExtensionContext) {
	console.log('GraphMe extension activated.');

	let activeEditor = vscode.window.activeTextEditor;

	let markColDisposable = vscode.commands.registerCommand('graphme.markcol', () => {
		if (activeEditor) {
			if (!activeEditor?.selection.isEmpty) {
				const fileName: string = activeEditor.document.fileName;
				let marking: FileMarking | undefined = getFileMarking(fileName);
				const lineNum: number = activeEditor.selection.active.line;

				const text: string = activeEditor.document.getText();
				const rowDataElements: DataElement[] = getDataElements(text, false, lineNum);
				const columnSelection: number = getSelectedColumn(rowDataElements, activeEditor.selection.active.character);
				if (columnSelection !== -1) {
					if (!marking) {
						addNewFileMarking(fileName, true);
						marking = getFileMarking(fileName);
						if (marking) { // Extra safety check
							addSeries(marking, columnSelection);
						}
					}
					else if (marking && !marking.colMode) {
						resetFileMarking(marking, true);
						addSeries(marking, columnSelection);
					}
					else {
						if (!marking.seriesIndices.includes(columnSelection)) {
							addSeries(marking, columnSelection);
						}
						else {
							removeSeries(marking, columnSelection);
						}
					}
				}
				else {
					vscode.window.showInformationMessage('Please highlight a row before using the Mark Row command.');
				}
			}
			else {
				vscode.window.showInformationMessage('Please highlight a row before using the Mark Row command.');
			}
			triggerUpdateDecorations();
		}
	});
	let markRowDisposable = vscode.commands.registerCommand('graphme.markrow', () => {
		if (activeEditor) {
			if (!activeEditor?.selection.isEmpty) {
				const fileName: string = activeEditor.document.fileName;
				let marking: FileMarking | undefined = getFileMarking(fileName);
				const lineNum: number = activeEditor.selection.active.line;
				if (!marking) {
					addNewFileMarking(fileName, false);
					marking = getFileMarking(fileName);
					if (marking) {
						addSeries(marking, lineNum);
					}
				}
				else if (marking && marking.colMode) {
					resetFileMarking(marking, false);
					addSeries(marking, lineNum);
				}
				else {
					if (!marking.seriesIndices.includes(lineNum)) {
						addSeries(marking, lineNum);
					}
					else {
						removeSeries(marking, lineNum);
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

	const oddDecoration = vscode.window.createTextEditorDecorationType({
		light: {
			backgroundColor: '#FF505077'
		},
		dark: {
			backgroundColor: '#FF505077'
		}
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
		
		const text: string = activeEditor.document.getText();

		let i: number = 0;
		const highlightsEven: vscode.DecorationOptions[] = [];
		const highlightsOdd: vscode.DecorationOptions[] = [];
		while (i < marking.seriesIndices.length) {
			const dataElements: DataElement[] = getDataElements(text, marking.colMode, marking.seriesIndices[i]);
			
			if (!marking.colMode) {
				const startDataElement: DataElement = dataElements[0];
				const endDataElement: DataElement = dataElements[dataElements.length - 1];

				const rawStartPos: vscode.Position = activeEditor.document.positionAt(startDataElement.start + startDataElement.offset);
				const startPos: vscode.Position = new vscode.Position(rawStartPos.line, 0);
				const endPos: vscode.Position = activeEditor.document.positionAt(endDataElement.end + endDataElement.offset);

				const highlightData = { range: new vscode.Range(startPos, endPos) };

				if (rawStartPos.line % 2 === 0) {
					highlightsEven.push(highlightData);
				}
				else {
					highlightsOdd.push(highlightData);
				}
			}
			else {
				let j: number = 0;
				while (j < dataElements.length) {
					const dataElement: DataElement = dataElements[j];
					const startPos: vscode.Position = activeEditor.document.positionAt(dataElement.start + dataElement.offset);
					const endPos: vscode.Position = activeEditor.document.positionAt(dataElement.end + dataElement.offset);

					const highlightData = { range: new vscode.Range(startPos, endPos) };

					if (marking.seriesIndices[i] % 2 === 0) {
						highlightsEven.push(highlightData);
					}
					else {
						highlightsOdd.push(highlightData);
					}
					j++;
				}
			}

			i++;
		}
		activeEditor.setDecorations(evenDecoration, highlightsEven);
		activeEditor.setDecorations(oddDecoration, highlightsOdd);
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

