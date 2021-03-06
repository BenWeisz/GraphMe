

interface DataElement {
    start: number,
    end: number,
    offset: number
}

const getRowDataElements = (rowText: string, offset: number): DataElement[] {
    const dataElements: DataElement[] = [];
    const regEx = /[\s\t]+/g;
    let positions: number[] = [];
    let match;
    while ((match = regEx.exec(rowText))) {
        const startPos = match.index;
        const endPos = match.index + match[0].length;

        positions.push(startPos);
        positions.push(endPos);
    }

    const hasFront: boolean = positions.includes(0);
    const hasBack: boolean = positions.includes(rowText.length);

    if (hasFront && hasBack) {
        positions.shift();
        positions.pop();
    }
    else if (hasFront) {
        positions.shift();
        positions.splice(positions.length, 0, rowText.length);
    }
    else if (hasBack) {
        positions.pop();
        positions.splice(0, 0, 0);
    }
    else if (!hasFront && !hasBack) {
        positions.splice(0, 0, 0);
        positions.splice(positions.length, 0, rowText.length);
    }

    let j: number = 0;
    while (j < positions.length) {
        dataElements.push({ start: positions[j], end: positions[j + 1], offset });
        j += 2;
    }

    return dataElements;
};

const getDataElements = (text: string, colMode: boolean = true, seriesIndex: number): DataElement[] => {
    let textSegments: Array<Array<string>> = text.split('\r\n').map(s => s.split('\n'));
    let textRows: string[] = textSegments.flat().filter(s => s !== '');

    // Compute the offset indicies
    const offsetPSA: number[] = [0];
    let i: number = 0;
    let ipsa: number = 1;
    while (i < text.length) {
        let sum: number = 0;
        if (i < text.length - 1) {
            while (i < text.length && !(text[i] === '\r' && text[i + 1] === '\n') && text[i] !== '\n') {
                sum += 1;
                i += 1;
            }

            if (i < text.length) {
                if (text[i] === '\r' && text[i + 1] === '\n') {
                    sum += 2;
                    i += 2;
                }
                else if (text[i] === '\n') {
                    sum += 1;
                    i += 1;
                }
            }
        }
        else {
            while (i < text.length && text[i] !== '\n') {
                sum += 1;
                i += 1;
            }
            if (i < text.length) {
                sum += 1;
                i += 1;
            }
        }
        offsetPSA.push(sum + offsetPSA[ipsa - 1]);
        ipsa += 1;
    }

    if (!colMode) {
        // Compute the start and stop indicies
        return getRowDataElements(textRows[seriesIndex], offsetPSA[seriesIndex]);
    }
    else {
        const dataElements: DataElement[] = [];
        let j: number = 0;
        while (j < textRows.length) {
            const rowDataElements: DataElement[] = getRowDataElements(textRows[j], offsetPSA[j]);
            if (seriesIndex < rowDataElements.length) {
                dataElements.push(rowDataElements[seriesIndex]);
            }
            j++;
        }
        return dataElements;
    }
};

const getSelectedColumn = (rowDataElements: DataElement[], cursorPos: number): number => {
    let i: number = 0;
    while (i < rowDataElements.length) {
        if (rowDataElements[i].start <= cursorPos && cursorPos <= rowDataElements[i].end) {
            return i;
        }
        i++;
    }
    return -1; 
};

export { getDataElements, getSelectedColumn, DataElement };