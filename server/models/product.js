const mongoose = require('mongoose');
const slugify = require('slugify');
const Review = require('./review');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters']
  },
  slug: String,
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  images: [
    {
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }
  ],
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['Electronics', 'Clothing', 'Books', 'Home', 'Beauty'],
      message: 'Please select correct category'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative']
  },
  ratings: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Review'
    }
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create product slug from name
productSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Cascade delete reviews when a product is deleted. Mongoose 7+ removed
// the .remove() document method entirely, and with it the old 'remove'
// hook stopped firing for anything — this now hooks 'deleteOne' in
// document-middleware mode (query:false), which fires for
// product.deleteOne() calls (see controllers/products.js).
productSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await Review.deleteMany({ product: this._id });
  next();
});

// Static method to get average rating
productSchema.statics.getAverageRating = async function(productId) {
  const obj = await this.aggregate([
    {
      $match: { _id: productId }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: 'reviews',
        foreignField: '_id',
        as: 'reviewsData'
      }
    },
    {
      $unwind: '$reviewsData'
    },
    {
      $group: {
        _id: '$_id',
        averageRating: { $avg: '$reviewsData.rating' }
      }
    }
  ]);

  try {
    await this.findByIdAndUpdate(productId, {
      ratings: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = mongoose.model('Product', productSchema);