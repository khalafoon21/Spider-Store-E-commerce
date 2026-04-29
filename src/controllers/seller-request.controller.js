const path = require('path');
const fs = require('fs');
const { formidable } = require('formidable');
const SellerRequestModel = require('../models/seller-request.model');
const { getPostData } = require('../utils/helpers');
const { finalizeUploadedImage } = require('../utils/upload-security');

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function ensureUploadDir(folder) {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
}

function imagePath(file, uploadFolder) {
    return finalizeUploadedImage(file, {
        uploadDir: uploadFolder,
        publicDir: '/uploads/profiles',
        allowedMimeTypes: allowedImageTypes,
        maxSize: 5 * 1024 * 1024,
        filenamePrefix: 'seller-request'
    });
}

async function getMySellerRequest(req, res) {
    try {
        const request = await SellerRequestModel.getLatestForUser(req.user.userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: request || null }));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Could not load seller request' }));
    }
}

async function submitSellerRequest(req, res) {
    try {
        if (req.user.role === 'seller' || req.user.seller_status === 'approved_seller') {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'You are already registered as a seller' }));
        }

        const existingRequest = await SellerRequestModel.getLatestForUser(req.user.userId);
        if (existingRequest && ['pending', 'approved', 'rejected'].includes(existingRequest.status)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Seller request already exists', data: existingRequest }));
        }

        const uploadFolder = path.join(__dirname, '../../uploads/profiles');
        ensureUploadDir(uploadFolder);

        const form = formidable({
            uploadDir: uploadFolder,
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Error uploading store image' }));
            }

            const storeName = fields.store_name ? String(fields.store_name[0]).trim() : '';
            if (!storeName) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Store name is required' }));
            }

            let storeImage = '';
            if (files.store_image) {
                const file = Array.isArray(files.store_image) ? files.store_image[0] : files.store_image;
                try {
                    storeImage = imagePath(file, uploadFolder);
                } catch (uploadError) {
                    res.writeHead(uploadError.statusCode || 400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: uploadError.message || 'Only image files are allowed' }));
                }
            }

            const requestId = await SellerRequestModel.createOrUpdate(req.user.userId, {
                store_name: storeName,
                phone: fields.phone ? fields.phone[0] : '',
                address: fields.address ? fields.address[0] : '',
                city: fields.city ? fields.city[0] : '',
                country: fields.country ? fields.country[0] : '',
                description: fields.description ? fields.description[0] : '',
                store_image: storeImage
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Seller request submitted successfully', requestId }));
        });
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Could not submit seller request' }));
    }
}

async function getAdminSellers(req, res) {
    try {
        if (req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Admin access only' }));
        }
        const sellers = await SellerRequestModel.getAllWithStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: sellers }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Could not load sellers' }));
    }
}

async function updateSellerRequestStatus(req, res, requestId) {
    try {
        if (req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Admin access only' }));
        }
        const body = await getPostData(req);
        await SellerRequestModel.updateStatus(requestId, body.status, body.admin_note || '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Seller request updated successfully' }));
    } catch (error) {
        const known = /invalid|not found/i.test(error.message || '');
        res.writeHead(known ? 400 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.message || 'Could not update seller request' }));
    }
}

module.exports = {
    getMySellerRequest,
    submitSellerRequest,
    getAdminSellers,
    updateSellerRequestStatus
};
