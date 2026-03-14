interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class UploadService {
    private uploadDir;
    constructor();
    upload(file: UploadedFile): Promise<{
        url: string;
        fileKey: string;
        filename: string;
        size: number;
        mimetype: string;
    }>;
}
export {};
