const queryForBigQuery = require('../config/bigquery');
const path = require('path');
const { getDatasetName } = require('./bigquery');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { fetchProductImageByProductTitle } = require('./fetchDataFromShopify');
const { fetchProductImageByProductTitleREST } = require('./fetchDataFromShopify');
const fetchTotalProductsCount = async () => {
    try {
        let totalCount = 0;
        let hasNextPage = true;
        let cursor = null;

        while (hasNextPage) {
            const query = `
                query($cursor: String) {
                    products(first: 250, after: $cursor, query: "status:ACTIVE -tag:no-product") {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        edges {
                            node {
                                id
                                title
                                status
                                tags
                            }
                        }
                    }
                }
            `;

            const response = await fetch(`https://${process.env.SHOPIFY_APP_URL}/admin/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
                },
                body: JSON.stringify({ 
                    query,
                    variables: { cursor }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            const products = data.data.products;
            totalCount += products.edges.length;
            hasNextPage = products.pageInfo.hasNextPage;
            cursor = products.pageInfo.endCursor;

            // console.log(`Fetched ${products.edges.length} products, total so far: ${totalCount}`);
        }

        return totalCount;
    } catch (error) {
        console.error('Error fetching total products count:', error);
        return 0;
    }
}

const calculateAverageProductPrice = async () => {
    try {
        // Updated query for nested line_items structure
        const query = `
            SELECT ROUND(AVG(line_item.PRICE), 2) as average_price
            FROM \`${getDatasetName()}\` o,
            UNNEST(o.line_items) as line_item
            WHERE line_item.PRICE IS NOT NULL 
            AND line_item.PRICE > 0
        `;
        
        const result = await queryForBigQuery(query);
        return result[0]?.average_price || 0;
    } catch (error) {
        console.error('Error calculating average product price:', error);
        return 0;
    }
}

const getTopSellingProducts = async (startDate, endDate) => {
    try {
        // Updated query for nested line_items structure
        const query = `
            SELECT 
            line_item.NAME as product_name,
            SUM(line_item.QUANTITY) as total_quantity_sold,
            SUM(line_item.PRICE * line_item.QUANTITY) as total_revenue,
            COUNT(DISTINCT line_item.VARIANT_ID) as number_of_variants
            FROM \`${getDatasetName()}\` o,
            UNNEST(o.line_items) as line_item
            WHERE line_item.NAME IS NOT NULL 
            AND line_item.QUANTITY IS NOT NULL
            AND line_item.QUANTITY > 0
            AND DATE(o.PROCESSED_AT) >= '${startDate}'
            AND DATE(o.PROCESSED_AT) <= '${endDate}'
            GROUP BY line_item.NAME
            ORDER BY total_quantity_sold DESC
            LIMIT 5
        `;

        const result = await queryForBigQuery(query);

        // Check if result is valid
        if (!result || !Array.isArray(result) || result.length === 0) {
            console.log('❌ No results from BigQuery, returning mock data');
            const mockData = [
                { name: 'Product A', sales: 1200, revenue: 24000, image: null },
                { name: 'Product B', sales: 950, revenue: 19000, image: null },
                { name: 'Product C', sales: 800, revenue: 16000, image: null },
                { name: 'Product D', sales: 750, revenue: 15000, image: null },
                { name: 'Product E', sales: 600, revenue: 12000, image: null },
            ];
            return mockData;
        }

        // Fetch images for all products in parallel using Promise.all
        const dataWithImages = await Promise.all(
            result.map(async (item) => {
                console.log('🔍 Fetching image for product:', item.product_name);
                const productImages = await fetchProductImageByProductTitleREST(item.product_name);
                console.log('🖼️ Image result for', item.product_name, ':', productImages);
                
                return {
                    name: item.product_name,
                    quantitySold: item.total_quantity_sold,
                    revenue: item.total_revenue,
                    image: productImages.imageUrl || null
                };
            })
        );

        console.log('✅ Final data with images:', dataWithImages);
        return dataWithImages;
        
    } catch (error) {
        console.error('❌ Error fetching top selling products:', error);
        // Return fallback data in case of error
        const fallbackData = [
            { name: 'Error fetching top selling products', sales: 0, revenue: 0, image: null },
          
        ];
        return fallbackData;
    }
}

const getTopSellingProducts24h = async () => {
    try {
        const mockData = [
            { name: 'Product A', sales: 45, revenue: 900 },
            { name: 'Product B', sales: 38, revenue: 760 },
            { name: 'Product C', sales: 32, revenue: 640 },
            { name: 'Product D', sales: 28, revenue: 560 },
            { name: 'Product E', sales: 25, revenue: 500 },
        ];
        return mockData;
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        throw error;
    }
}

const getTopCategories = async () => {
    try {
        const mockData = [
            { name: 'Electronics', value: 35 },
            { name: 'Clothing', value: 25 },
            { name: 'Home & Kitchen', value: 20 },
            { name: 'Books', value: 15 },
            { name: 'Sports', value: 5 },
        ];
        return mockData;
    } catch (error) {
        console.error('Error fetching top categories:', error);
        throw error;
    }
}

const getTopCategories24h = async () => {
    try {
        const mockData = [
            { name: 'Electronics', value: 40 },
            { name: 'Clothing', value: 30 },
            { name: 'Home & Kitchen', value: 15 },
            { name: 'Books', value: 10 },
            { name: 'Sports', value: 5 },
        ];
        return mockData;
    } catch (error) {
        console.error('Error fetching top categories:', error);
        throw error;
    }
}

const getLeastSellingProducts = async () => {
    try {
        const query = `
            SELECT 
            TITLE as product_name,
            SUM(CURRENT_QUANTITY) as total_quantity_sold,
            SUM((CURRENT_QUANTITY * PRICE) - DISCOUNT_ALLOCATION_AMOUNT) as total_revenue,
            COUNT(DISTINCT SKU) as number_of_variants
            FROM 
            \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}.line_items\`
            WHERE 
            TITLE IS NOT NULL 
            AND CURRENT_QUANTITY IS NOT NULL
            AND CURRENT_QUANTITY > 0
            GROUP BY 
            TITLE
            ORDER BY 
            total_quantity_sold ASC
            LIMIT 5;
        `;

        const result = await queryForBigQuery(query);

        // Check if result is valid
        if (!result || !Array.isArray(result) || result.length === 0) {
            console.log('❌ No results from BigQuery for least selling products, returning mock data');
            const mockData = [
                { name: 'Product X', quantitySold: 10, revenue: 200, image: null },
                { name: 'Product Y', quantitySold: 15, revenue: 300, image: null },
                { name: 'Product Z', quantitySold: 20, revenue: 400, image: null },
                { name: 'Product W', quantitySold: 25, revenue: 500, image: null },
                { name: 'Product V', quantitySold: 30, revenue: 600, image: null },
            ];
            return mockData;
        }

        // Fetch images for all products in parallel using Promise.all
        const dataWithImages = await Promise.all(
            result.map(async (item) => {
                console.log('🔍 Fetching image for least selling product:', item.product_name);
                const productImages = await fetchProductImageByProductTitleREST(item.product_name);
                console.log('🖼️ Image result for', item.product_name, ':', productImages);
                
                return {
                    name: item.product_name,
                    quantitySold: item.total_quantity_sold,
                    revenue: item.total_revenue,
                    image: productImages.imageUrl || null
                };
            })
        );

        console.log('✅ Final least selling products data with images:', dataWithImages);
        return dataWithImages;
        
    } catch (error) {
        console.error('❌ Error fetching least selling products:', error);
        // Return fallback data in case of error
        const fallbackData = [
            { name: 'Error fetching least selling products', quantitySold: 0, revenue: 0, image: null },
        ];
        return fallbackData;
    }
}

const getLeastSellingProducts24h = async () => {
    try {
        const mockData = [
            { name: 'Product X', sales: 0, revenue: 0 },
            { name: 'Product Y', sales: 1, revenue: 20 },
            { name: 'Product Z', sales: 2, revenue: 40 },
            { name: 'Product W', sales: 3, revenue: 60 },
            { name: 'Product V', sales: 4, revenue: 80 },
        ];
        return mockData;    
    } catch (error) {
        console.error('Error fetching least selling products:', error);
        throw error;
    }
}

const getMostReturnedProducts = async () => {
    try {
       const mockData = [
            { name: 'Product R', returns: 50, returnRate: '15%' },
            { name: 'Product S', returns: 40, returnRate: '12%' },
            { name: 'Product T', returns: 35, returnRate: '10%' },
            { name: 'Product U', returns: 30, returnRate: '9%' },
            { name: 'Product V', returns: 25, returnRate: '8%' },
        ];
        return mockData;
    } catch (error) {
        console.error('Error fetching most returned products:', error);
        throw error;
    }
}


// const topFiveLeastSoldProducts = async () => {
//     try {
//         const query = `SELECT 
//   TITLE,
//   SUM(QUANTITY) as total_quantity_sold
// FROM \`${process.env.BIGQUERY_DATASET}.ordered_lineitem\`
// GROUP BY TITLE
// ORDER BY total_quantity_sold ASC
// LIMIT 5`
        
//     } catch (error) {
        
//     }
// }


// const main = async () => {
   
//     try {

//         console.log('Starting to fetch active products and their variant prices...');
//         console.log('Environment check:');
//         console.log('SHOPIFY_APP_URL:', process.env.SHOPIFY_APP_URL);
//         console.log('Access Token exists:', !!process.env.SHOPIFY_ACCESS_TOKEN);
//         console.log('SHOPIFY_STORE_URL:', process.env.SHOPIFY_STORE_URL);
//         console.log('SHOPIFY_ACCESS_TOKEN:', process.env.SHOPIFY_ACCESS_TOKEN);
//         console.log('SHOPIFY_APP_URL:', process.env.SHOPIFY_APP_URL);

//         console.log('fetching total products count')    ;
        
//         // console.log('\n--- Method 2: GraphQL Pagination ---');
//         const totalProductsGraphQL = await fetchTotalProductsCountL();
//         console.log('Total products (GraphQL):', totalProductsGraphQL);

//         const averageProductPrice = await calculateAverageProductPrice();
//         console.log('Average product price:', averageProductPrice);
        
//     } catch (error) {
//         console.error('Main function error:', error.message);
//     }
// }

// main();

module.exports = {
    fetchTotalProductsCount,
    calculateAverageProductPrice,
    getTopSellingProducts,
    getTopSellingProducts24h,
    getTopCategories,
    getTopCategories24h,
    getLeastSellingProducts,
    getLeastSellingProducts24h,
    getMostReturnedProducts
}