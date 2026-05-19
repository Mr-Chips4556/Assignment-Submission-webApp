// File utility functions

export const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/zip",
    "application/x-zip-compressed",
];

export const MAX_SIZE_MB = 50;
export const IMAGE_MAX_WIDTH = 1920;
export const IMAGE_MAX_HEIGHT = 1080;
export const IMAGE_QUALITY = 0.8;
export const MAX_FILES = 5;

export function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(date) {
    if (!date) return "Unknown";
    if (date.toDate) date = date.toDate();
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function getFileIcon(type = "") {
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("sheet")) return "📊";
    if (type.includes("presentation")) return "📊";
    if (type.includes("image")) return "🖼️";
    if (type.includes("zip")) return "🗜️";
    if (type.includes("text")) return "📝";
    return "📎";
}

export function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: "File type not supported. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG, WEBP, ZIP"
        };
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${MAX_SIZE_MB} MB.`
        };
    }
    return { valid: true };
}

export function compressImage(file, maxWidth = IMAGE_MAX_WIDTH, maxHeight = IMAGE_MAX_HEIGHT, quality = IMAGE_QUALITY) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            let { width, height } = img;
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(resolve, file.type, quality);
        };

        img.src = URL.createObjectURL(file);
    });
}

export function generateThumbnail(file, size = 150) {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            const { width, height } = img;
            const aspectRatio = width / height;

            let thumbWidth = size;
            let thumbHeight = size;

            if (aspectRatio > 1) {
                thumbHeight = size / aspectRatio;
            } else {
                thumbWidth = size * aspectRatio;
            }

            canvas.width = thumbWidth;
            canvas.height = thumbHeight;
            ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

            canvas.toBlob(resolve, 'image/jpeg', 0.7);
        };

        img.src = URL.createObjectURL(file);
    });
}

export function createDownloadLink(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function copyToClipboard(text) {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve();
    }
}