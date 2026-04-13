const url = require('url');
const path = require('path');
const fs = require('fs');
const { formidable } = require('formidable');
const ProductModel = require('../models/product.model');
const { getPostData } = require('../utils/helpers');

async function getProducts(req, res) {
    try {
        const baseURL = `http://${req.headers.host}`;
        const parsedUrl = new URL(req.url, baseURL);
        const searchQuery = parsedUrl.searchParams.get('search') || '';
        const categoryId = parsedUrl.searchParams.get('category_id') || null;

        const products = await ProductModel.getAll(searchQuery, categoryId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: products }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'An error occurred while fetching products' 
        }));
    }
}

async function createProduct(req, res) {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'You are not authorized to add products' }));
        }

        const uploadFolder = path.join(__dirname, '../../uploads/products');

        // ✨ التأكد من إنشاء مجلد الصور تلقائياً لو مش موجود عشان السيرفر ميقعش
        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder, { recursive: true });
        }

        const form = formidable({
            uploadDir: uploadFolder, 
            keepExtensions: true,    
            maxFileSize: 10 * 1024 * 1024, // 10 ميجا
            multiples: true // السماح برفع أكثر من ملف
        });

        form.parse(req, async (err, fields, files) => {
            // ✨ إضافة try...catch داخلية لاحتواء أي خطأ يخص الداتا بيز
            try {
                if (err) {
                    console.error('Formidable Error:', err);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'خطأ أثناء رفع الصور' }));
                }

                const title = fields.title ? fields.title[0] : null;
                const description = fields.description ? fields.description[0] : '';
                const price = fields.price ? fields.price[0] : null;
                const discount = fields.discount ? fields.discount[0] : 0;
                const stock_quantity = fields.stock_quantity ? fields.stock_quantity[0] : 0;
                const category_id = fields.category_id ? fields.category_id[0] : null;
                const brand = fields.brand ? fields.brand[0] : '';
                const tags = fields.tags ? fields.tags[0] : '';

                if (!title || !price) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'الاسم والسعر مطلوبان' }));
                }

                let image_url = '';
                if (files.main_image) {
                    const mainFile = Array.isArray(files.main_image) ? files.main_image[0] : files.main_image;
                    // دعم لنسخ formidable المختلفة
                    const fileName = path.basename(mainFile.filepath || mainFile.newFilename || ''); 
                    if (fileName) image_url = `/uploads/products/${fileName}`;
                }

                let additional_images = [];
                if (files.additional_images) {
                    const addFiles = Array.isArray(files.additional_images) ? files.additional_images : [files.additional_images];
                    additional_images = addFiles.map(file => {
                        const fName = path.basename(file.filepath || file.newFilename || '');
                        return `/uploads/products/${fName}`;
                    });
                }

                const newProductId = await ProductModel.create({
                    seller_id: req.user.userId,
                    title,
                    description,
                    price: parseFloat(price) || 0,
                    discount: parseFloat(discount) || 0,
                    stock_quantity: parseInt(stock_quantity) || 0,
                    category_id: category_id ? parseInt(category_id) : null,
                    brand,
                    tags,
                    image_url,
                    additional_images 
                });

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'تم إضافة المنتج والصور بنجاح!', 
                    productId: newProductId
                }));

            } catch (innerError) {
                // لو حصل خطأ في الداتا بيز (زي إن عمود ناقص)، السيرفر مش هيقع وهيطبع الخطأ
                console.error("Database Error inside form.parse:", innerError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'خطأ في قاعدة البيانات: ' + innerError.message }));
            }
        });

    } catch (error) {
        console.error("General Server Error:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'حدث خطأ في السيرفر' }));
    }
}

async function getMyProducts(req, res) {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'You are not authorized to view these products'
            }));
        }

        const products = req.user.role === 'admin'
            ? await ProductModel.getAll()
            : await ProductModel.getAllForSeller(req.user.userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: products }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'An error occurred while fetching your products'
        }));
    }
}

async function updateProduct(req, res, productId) {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'You are not authorized to update products'
            }));
        }

        const existing = await ProductModel.getById(productId);
        if (!existing) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'Product not found'
            }));
        }

        if (req.user.role !== 'admin' && existing.seller_id !== req.user.userId) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'You can only edit your own products'
            }));
        }

        const uploadFolder = path.join(__dirname, '../../uploads/products');
        const form = formidable({
            uploadDir: uploadFolder,
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: false,
                    message: 'An error occurred while uploading the image'
                }));
            }

            const title = fields.title ? fields.title[0] : existing.title;
            const description = fields.description ? fields.description[0] : existing.description;
            const price = fields.price ? parseFloat(fields.price[0]) : existing.price;
            const stock_quantity = fields.stock_quantity ? parseInt(fields.stock_quantity[0]) : existing.stock_quantity;
            const category_id = fields.category_id ? parseInt(fields.category_id[0]) : existing.category_id;

            let image_url = existing.image_url || '';
            if (files.image) {
                const uploadedFile = Array.isArray(files.image) ? files.image[0] : files.image;
                const fileName = path.basename(uploadedFile.filepath || uploadedFile.newFilename || '');
                if (fileName) image_url = `/uploads/products/${fileName}`;
            }

            await ProductModel.updateById(productId, {
                title,
                description,
                price,
                stock_quantity,
                image_url,
                category_id
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Product updated successfully'
            }));
        });
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'An error occurred while updating the product'
        }));
    }
}

async function deleteProduct(req, res, productId) {
    try {
        if (req.user.role !== 'seller' && req.user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'You are not authorized to delete products'
            }));
        }

        const existing = await ProductModel.getById(productId);
        if (!existing) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'Product not found'
            }));
        }

        if (req.user.role !== 'admin' && existing.seller_id !== req.user.userId) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'You can only delete your own products'
            }));
        }

        await ProductModel.deleteById(productId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Product deleted successfully'
        }));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'An error occurred while deleting the product'
        }));
    }
}

module.exports = { getProducts, createProduct, getMyProducts, updateProduct, deleteProduct };