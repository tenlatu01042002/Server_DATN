const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { cloudinary } = require('../cloudinary');
const app = express();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

const uploadToCloudinary = async (filePath) => {
    try {
        console.log('Uploading file to Cloudinary:', filePath);
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'Haven_Inn_Images', 
        });
        console.log('Upload result:', result);
        return result;
    } catch (error) {
        console.error('Upload to Cloudinary error:', error);
        throw error;
    }
};

// Hàm xóa ảnh trên Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};


app.post('/upload', upload.array('files', 10), async (req, res) => {
    console.log("Request received at /upload endpoint"); 

    if (!req.files || req.files.length === 0) {
        console.error('No files uploaded');
        return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    console.log('Files received:', req.files); 

    try {
        const uploadResults = [];
        for (const file of req.files) {
            const filePath = file.path;
            console.log("Processing file:", filePath); 

            const result = await uploadToCloudinary(filePath);
            uploadResults.push(result);

            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
                else console.log('Temporary file deleted:', filePath);
            });
        }

        res.json({ success: true, results: uploadResults });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error });
    }
});

module.exports = {
    upload,
    uploadToCloudinary,
    deleteFromCloudinary,
};