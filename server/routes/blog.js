const express = require('express');
const router = express.Router();
const {
    createPost,
    updatePost,
    deletePost,
    getPublishedPosts,
    getPostBySlug,
    getAllPostsAdmin
} = require('../controllers/blog');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getPublishedPosts);
router.get('/admin', protect, authorize('admin'), getAllPostsAdmin);
router.get('/:slug', getPostBySlug);
router.post('/', protect, authorize('admin'), createPost);
router.patch('/:id', protect, authorize('admin'), updatePost);
router.delete('/:id', protect, authorize('admin'), deletePost);

module.exports = router;
