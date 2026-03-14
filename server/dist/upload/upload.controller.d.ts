import { UploadedFile } from '@nestjs/common';
import { UploadService } from './upload.service';
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    upload(file: UploadedFile): Promise<{
        code: number;
        msg: string;
        data: {
            url: string;
            fileKey: string;
            filename: string;
            size: number;
            mimetype: string;
        };
    }>;
}
export {};
