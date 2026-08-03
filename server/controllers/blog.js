const BlogPost = require('../models/blogPost');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

function slugify(title) {
    return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function uniqueSlug(base, excludeId) {
    let slug = base;
    let counter = 2;
    while (await BlogPost.findOne({ slug, _id: { $ne: excludeId } })) {
          slug = `${base}-${counter}`;
          counter += 1;
    }
    return slug;
}

exports.createPost = asyncHandler(async (req, res, next) => {
    const { title, excerpt, body, coverImageUrl, author, status } = req.body;
    if (!title || !title.trim()) {
          return next(new ErrorResponse('title is required', 400));
    }
    if (!body || !body.trim()) {
          return next(new ErrorResponse('body is required', 400));
    }
    const baseSlug = slugify(title);
    const slug = await uniqueSlug(baseSlug);
    const isPublished = status === 'published';
    const post = await BlogPost.create({
          title: title.trim(),
          slug,
          excerpt: excerpt || '',
          body,
          coverImageUrl,
          author: author || 'DripWiz',
          status: isPublished ? 'published' : 'draft',
          publishedAt: isPublished ? new Date() : undefined,
    });
    res.status(201).json({ success: true, data: post });
});

exports.updatePost = asyncHandler(async (req, res, next) => {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
          return next(new ErrorResponse('post not found', 404));
    }
    const { title, excerpt, body, coverImageUrl, author, status } = req.body;
    if (title && title.trim() && title.trim() !== post.title) {
          post.title = title.trim();
          post.slug = await uniqueSlug(slugify(title), post._id);
    }
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (body !== undefined) post.body = body;
    if (coverImageUrl !== undefined) post.coverImageUrl = coverImageUrl;
    if (author !== undefined) post.author = author;
    if (status && status !== post.status) {
          post.status = status;
          if (status === 'published' && !post.publishedAt) {
                  post.publishedAt = new Date();
          }
    }
    await post.save();
    res.status(200).json({ success: true, data: post });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
          return next(new ErrorResponse('post not found', 404));
    }
    res.status(200).json({ success: true, data: {} });
});

exports.getPublishedPosts = asyncHandler(async (req, res, next) => {
    const posts = await BlogPost.find({ status: 'published' }).select('-body').sort({ publishedAt: -1 });
    res.status(200).json({ success: true, count: posts.length, data: posts });
});

exports.getPostBySlug = asyncHandler(async (req, res, next) => {
    const post = await BlogPost.findOne({ slug: req.params.slug, status: 'published' });
    if (!post) {
          return next(new ErrorResponse('post not found', 404));
    }
    res.status(200).json({ success: true, data: post });
});

exports.getAllPostsAdmin = asyncHandler(async (req, res, next) => {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: posts.length, data: posts });
});
