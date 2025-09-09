interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
}

interface DocumentPictureInPicture {
    requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

interface Window {
    documentPictureInPicture: DocumentPictureInPicture;
}
