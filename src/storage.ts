interface FileMarking {
    fileName: string;
    colMode: boolean;
    seriesIndices: number[];
    labels: string[];
}

const storage: FileMarking[] = [];

const addNewFileMarking = (fileName: string, colMode: boolean, newIndex: number | null, labels: Array<string> | null) => {
    if (newIndex !== null) {
        const marking: FileMarking = {
            fileName,
            colMode,
            seriesIndices: [newIndex],
            labels: []
        };
        storage.push(marking);
    } else { 
        const labelsList: Array<string> = labels !== null ? labels : [];
        const marking: FileMarking = {
            fileName,
            colMode,
            seriesIndices: [],
            labels: labelsList
        };
        storage.push(marking);
    }
};

const getFileMarking = (fileName: string): FileMarking | undefined => storage.find((marking) => marking.fileName === fileName);

export {
    addNewFileMarking,
    getFileMarking,
    FileMarking
};
