const path=require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function extractProductTitle(fullTitle) {
    // This is a placeholder - adjust according to your title format
    // For example, if titles are like "Product Name - Variant Info"
    return fullTitle.split(' - ')[0] || fullTitle;
  }
  
  /**
   * Helper function to extract variant title from a combined title
   * Note: You may need to adjust this based on your actual data format
   */
  function extractVariantTitle(fullTitle) {
    // This is a placeholder - adjust according to your title format
    // For example, if titles are like "Product Name - Variant Info"
    const parts = fullTitle.split(' - ');
    return parts.length > 1 ? parts[1] : "Default";
  }

const fetchProductsWithVariants = async () => {
  try {
    // Scan all items from the table
    // Note: For large datasets, you should implement pagination
    // const command = new ScanCommand({
    //   TableName: "marketPlaceData"
    // });

    // const response = await docClient.send(command);
    
    // if (!response.Items || response.Items.length === 0) {
    //   return [];
    // }

    // Step 1: Group items by productId
    const productMap = {};
    
    // response.Items.forEach(item => {
      // Skip items without necessary data
      // if (!item.productId || !item.variantId || !item.title) {
      //   console.warn("Item missing required fields:", item);
      //   return;
      // }
      
      // Create product entry if it doesn't exist
      // if (!productMap[item.productId]) {
      //   productMap[item.productId] = {
      //     title: extractProductTitle(item.title), // Extract product title from variant title
      //     product_id: item.productId,
      //     variants: []
      //   };
      // }
      
      // Extract variant details
      // Note: Assuming variant title is part of the title string or needs to be parsed
      // You might need to adjust this based on your actual data structure
      // const variantTitle = extractVariantTitle(item.title);
      
      // Add variant to product
      // productMap[item.productId].variants.push({
      //   variant_id: item.variantId,
      //   variant_title: variantTitle,
      //   sku: item.amazonSKU || "N/A",
      //   prices: {
      //     amazon: parseFloat(item.amazonPrice) || null,
      //   //  flipkart: null, // Not in your schema - you'll need to add this to your DynamoDB or fetch separately
      //     shopify: parseFloat(item.shopifyPrice) || null
      //   },
      // });
    // });
    
    // Step 2: Convert map to array of products
    return Object.values(productMap);
    
  } catch (error) {
    console.error("Error fetching products from DynamoDB:", error);
    throw new Error("Failed to fetch products. Please try again later.");
  }
};

module.exports=fetchProductsWithVariants;
