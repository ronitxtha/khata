import { Product } from "../models/productModel.js";
import { UserInteraction } from "../models/userInteractionModel.js";
import { Shop } from "../models/shopModel.js";
import { User } from "../models/userModel.js";

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const user = req.user;
    const isDemoUser = user?.isDemoUser || false;
    const limit = 12;

    let recommendations = [];
    let storeIds = new Set();

    // ============ CASE C: DEMO USER (NO TRACKING) ============
    if (isDemoUser) {
      console.log("📊 Demo user detected - serving trending/popular without tracking");
      
      const trendingProducts = await Product.find({ deleted: { $ne: true } })
        .sort({ views: -1, createdAt: -1 })
        .limit(8)
        .populate("shopId", "name logoUrl");

      const popularProducts = await Product.find({ deleted: { $ne: true } })
        .sort({ totalSold: -1 })
        .limit(4)
        .populate("shopId", "name logoUrl");

      const combined = [];
      const productIds = new Set();

      for (const p of [...trendingProducts, ...popularProducts]) {
        if (p && p.shopId && !productIds.has(p._id.toString())) {
          productIds.add(p._id.toString());
          combined.push(p);
          storeIds.add(p.shopId._id.toString());
        }
      }

      recommendations = combined.slice(0, limit);
      const title = "🔥 Trending Now";

      const stores = await Shop.find({
        _id: { $in: Array.from(storeIds) }
      }).populate("ownerId", "username");

      return res.json({
        success: true,
        title,
        isDemoUser: true,
        recommendations: recommendations.map(p => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          category: p.category,
          rating: p.rating,
          numReviews: p.numReviews,
          views: p.views,
          totalSold: p.totalSold,
          shopId: p.shopId?._id,
          shopName: p.shopId?.name
        })),
        stores: stores.map(s => ({
          _id: s._id,
          name: s.name,
          logoUrl: s.logoUrl,
          owner: s.ownerId?.username
        }))
      });
    }

    // ============ CASE B: NO USER / NOT AUTHENTICATED ============
    if (!userId) {
      console.log("👥 Anonymous user - serving trending/popular");
      
      const trendingProducts = await Product.find({ deleted: { $ne: true } })
        .sort({ views: -1, createdAt: -1 })
        .limit(8)
        .populate("shopId", "name logoUrl");

      const popularProducts = await Product.find({ deleted: { $ne: true } })
        .sort({ totalSold: -1 })
        .limit(4)
        .populate("shopId", "name logoUrl");

      const combined = [];
      const productIds = new Set();

      for (const p of [...trendingProducts, ...popularProducts]) {
        if (p && p.shopId && !productIds.has(p._id.toString())) {
          productIds.add(p._id.toString());
          combined.push(p);
          storeIds.add(p.shopId._id.toString());
        }
      }

      recommendations = combined.slice(0, limit);
      const title = "🔥 Trending Now";

      const stores = await Shop.find({
        _id: { $in: Array.from(storeIds) }
      }).populate("ownerId", "username");

      return res.json({
        success: true,
        title,
        isDemoUser: false,
        isNewUser: true,
        recommendations: recommendations.map(p => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          category: p.category,
          rating: p.rating,
          numReviews: p.numReviews,
          views: p.views,
          totalSold: p.totalSold,
          shopId: p.shopId?._id,
          shopName: p.shopId?.name
        })),
        stores: stores.map(s => ({
          _id: s._id,
          name: s.name,
          logoUrl: s.logoUrl,
          owner: s.ownerId?.username
        }))
      });
    }

    // ============ CHECK IF USER HAS INTERACTION DATA ============
    const userInteractions = await UserInteraction.find({
      userId: userId,
      interactionType: { $in: ["product_view", "product_click", "category_view"] }
    }).sort({ timestamp: -1 });

    const userCategories = [...new Set(
      userInteractions
        .filter(i => i.category)
        .map(i => i.category)
    )];

    // ============ CASE B: NEW USER (NO INTERACTION DATA) ============
    if (userCategories.length === 0) {
      console.log("🆕 New user with no interaction data");
      
      const trendingProducts = await Product.find({ deleted: { $ne: true } })
        .sort({ views: -1, createdAt: -1 })
        .limit(6)
        .populate("shopId", "name logoUrl");

      const popularProducts = await Product.find({
        deleted: { $ne: true },
        _id: { $nin: trendingProducts.map(p => p._id) }
      })
        .sort({ totalSold: -1 })
        .limit(3)
        .populate("shopId", "name logoUrl");

      const latestProducts = await Product.find({
        deleted: { $ne: true },
        _id: {
          $nin: [
            ...trendingProducts.map(p => p._id),
            ...popularProducts.map(p => p._id)
          ]
        }
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("shopId", "name logoUrl");

      recommendations = [...trendingProducts, ...popularProducts, ...latestProducts]
        .slice(0, limit);

      for (const p of recommendations) {
        if (p && p.shopId) {
          storeIds.add(p.shopId._id.toString());
        }
      }

      const title = "🔥 Trending Now";

      const stores = await Shop.find({
        _id: { $in: Array.from(storeIds) }
      }).populate("ownerId", "username");

      return res.json({
        success: true,
        title,
        isDemoUser: false,
        isNewUser: true,
        recommendations: recommendations.map(p => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          category: p.category,
          rating: p.rating,
          numReviews: p.numReviews,
          views: p.views,
          totalSold: p.totalSold,
          shopId: p.shopId?._id,
          shopName: p.shopId?.name
        })),
        stores: stores.map(s => ({
          _id: s._id,
          name: s.name,
          logoUrl: s.logoUrl,
          owner: s.ownerId?.username
        }))
      });
    }

    // ============ CASE A: PERSONALIZED USER ============
    console.log(`📌 Personalized mode - user categories: ${userCategories.join(", ")}`);

    let personalizedProducts = [];
    let trendingProducts = [];

    if (userCategories.length === 1) {
      console.log(`Single category mode: ${userCategories[0]}`);
      
      const categoryProducts = await Product.find({
        category: userCategories[0],
        deleted: { $ne: true }
      }).populate("shopId", "name logoUrl");

      const storeMap = {};
      for (const product of categoryProducts) {
        if (!product || !product.shopId) continue;
        const shopId = product.shopId._id.toString();
        if (!storeMap[shopId]) {
          storeMap[shopId] = [];
        }
        storeMap[shopId].push(product);
      }

      for (const shopId in storeMap) {
        const storeProducts = storeMap[shopId]
          .sort((a, b) => b.totalSold - a.totalSold)[0];
        if (storeProducts) {
          personalizedProducts.push(storeProducts);
        }
        if (personalizedProducts.length >= 8) break;
      }
    } else {
      console.log(`Multiple categories mode: ${userCategories.join(", ")}`);
      
      const productsPerCategory = Math.ceil(8 / userCategories.length);
      
      for (const category of userCategories) {
        const categoryProducts = await Product.find({
          category,
          deleted: { $ne: true }
        })
          .sort({ totalSold: -1 })
          .limit(productsPerCategory)
          .populate("shopId", "name logoUrl");

        const storeMap = {};
        for (const product of categoryProducts) {
          if (!product || !product.shopId) continue;
          const shopId = product.shopId._id.toString();
          if (!storeMap[shopId]) {
            storeMap[shopId] = product;
            personalizedProducts.push(product);
          }
        }
      }
    }

    trendingProducts = await Product.find({
      deleted: { $ne: true },
      _id: { $nin: personalizedProducts.map(p => p._id) }
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .populate("shopId", "name logoUrl");

    const personalizedCount = Math.ceil(limit * 0.7);
    const trendingCount = Math.floor(limit * 0.3);

    const final = [
      ...personalizedProducts.slice(0, personalizedCount),
      ...trendingProducts.slice(0, trendingCount)
    ].slice(0, limit);

    if (final.length < 8) {
      const additional = await Product.find({
        deleted: { $ne: true },
        _id: { $nin: final.map(p => p._id) }
      })
        .sort({ createdAt: -1 })
        .limit(8 - final.length)
        .populate("shopId", "name logoUrl");
      
      final.push(...additional);
    }

    recommendations = final.slice(0, limit);

    for (const p of recommendations) {
      if (p && p.shopId) {
        storeIds.add(p.shopId._id.toString());
      }
    }

    const title = "✨ Recommended for You";

    const stores = await Shop.find({
      _id: { $in: Array.from(storeIds) }
    }).populate("ownerId", "username");

    res.json({
      success: true,
      title,
      isDemoUser: false,
      isNewUser: false,
      userCategories,
      recommendations: recommendations.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        rating: p.rating,
        numReviews: p.numReviews,
        views: p.views,
        totalSold: p.totalSold,
        shopId: p.shopId?._id,
        shopName: p.shopId?.name
      })),
      stores: stores.map(s => ({
        _id: s._id,
        name: s.name,
        logoUrl: s.logoUrl,
        owner: s.ownerId?.username
      }))
    });

  } catch (error) {
    console.error("❌ Recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
      error: error.message
    });
  }
};

export const trackInteraction = async (req, res) => {
  try {
    const userId = req.userId;
    const { interactionType, productId, category, searchQuery } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (user?.isDemoUser) {
      return res.json({ success: true, message: "Demo user - interaction not tracked" });
    }

    const interaction = new UserInteraction({
      userId,
      interactionType,
      productId: productId || null,
      category: category || null,
      searchQuery: searchQuery || null
    });

    await interaction.save();

    if (interactionType === "product_view" && productId) {
      await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
    }

    res.json({ success: true, message: "Interaction tracked" });
  } catch (error) {
    console.error("❌ Track interaction error:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking interaction"
    });
  }
};

export const incrementProductSales = async (productId, quantity = 1) => {
  try {
    await Product.findByIdAndUpdate(productId, { $inc: { totalSold: quantity } });
  } catch (error) {
    console.error("❌ Error incrementing product sales:", error);
  }
};
