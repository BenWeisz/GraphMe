interface FileMarking {
    fileName: string;
    colMode: boolean;
    seriesIndices: number[];
    labels: string[];
}

const storage: FileMarking[] = [];

const addNewFileMarking = (fileName: string, colMode: boolean) => {
    const marking: FileMarking = {
        fileName,
        colMode,
        seriesIndices: [],
        labels: []
    };
    storage.push(marking);
};

const resetFileMarking = (marking: FileMarking, colMode: boolean) => {
    marking.colMode = colMode;
    marking.seriesIndices = [];
    marking.labels = [];
};

const getFileMarking = (fileName: string): FileMarking | undefined => storage.find((marking) => marking.fileName === fileName);

const addSeries = (marking: FileMarking, newIndex: number) => {
    marking.seriesIndices.push(newIndex);
};

const removeSeries = (marking: FileMarking, removeIndex: number) => {
    marking.seriesIndices.splice(marking.seriesIndices.indexOf(removeIndex), 1);
};

export {
    addNewFileMarking,
    resetFileMarking,
    getFileMarking,
    addSeries,
    removeSeries,
    FileMarking
};
