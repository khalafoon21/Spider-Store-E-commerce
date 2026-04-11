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

        const products = await ProductModel.getAll(searchQuery);
        
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
            return res.end(JSON.stringify({ 
                success: false, 
                message: 'You are not authorized to add products' 
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


            const title = fields.title ? fields.title[0] : null;
            const description = fields.description ? fields.description[0] : '';
            const price = fields.price ? fields.price[0] : null;
            const stock_quantity = fields.stock_quantity ? fields.stock_quantity[0] : 0;

            if (!title || !price) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Title and price are required' 
                }));
            }


            let image_url = '';
            if (files.image) {
                const uploadedFile = Array.isArray(files.image) ? files.image[0] : files.image;
                const fileName = path.basename(uploadedFile.filepath); 
                image_url = `/uploads/products/${fileName}`;
            }


            const newProductId = await ProductModel.create({
                seller_id: req.user.userId,
                title,
                description,
                price: parseFloat(price),
                stock_quantity: parseInt(stock_quantity),
                image_url
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: 'Product added successfully!', 
                productId: newProductId,
                image_url: image_url
            }));
        });

    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            message: 'An error occurred while processing the request' 
        }));
    }
}

module.exports = { getProducts, createProduct };