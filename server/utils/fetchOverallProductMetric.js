const queryForBigQuery = require('../config/bigquery');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fetchTotalProductsCount = async () => {
    try {
        let totalCount = 0;
        let hasNextPage = true;
        let cursor = null;

        while (hasNextPage) {
            const query = `
                query($cursor: String) {
                    products(first: 250, after: $cursor, query: "NOT tag:no-product AND status:active AND tag:original") {
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
        console.error('Error fetching total products with GraphQL:', error);
        throw error;
    }
};

const calculateAverageProductPrice = async () => {
    try {
        let allVariantPrices = [];
        let totalProducts = 0;
        let hasNextPage = true;
        let cursor = null;

        

        while (hasNextPage) {
            const query = `
                query($cursor: String) {
                    products(first: 250, after: $cursor, query: "NOT tag:no-product AND status:active") {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        edges {
                            node {
                                id
                                title
                                status
                                variants(first: 100) {
                                    edges {
                                        node {
                                            id
                                            title
                                            price
                                            compareAtPrice
                                            inventoryQuantity
                                        }
                                    }
                                }
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
                console.error('GraphQL errors:', data.errors);
                throw new Error(data.errors[0].message);
            }

            const products = data.data.products;
            totalProducts += products.edges.length;

            // Collect all variant prices from current batch
            products.edges.forEach(productEdge => {
                const product = productEdge.node;
                const variants = product.variants.edges;
                
                variants.forEach(variantEdge => {
                    const variant = variantEdge.node;
                    const price = parseFloat(variant.price);
                    
                    if (!isNaN(price) && price > 0) {
                        allVariantPrices.push({
                            productId: product.id,
                            productTitle: product.title,
                            variantId: variant.id,
                            variantTitle: variant.title,
                            price: price,
                            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
                            inventoryQuantity: variant.inventoryQuantity
                        });
                    }
                });
            });

            hasNextPage = products.pageInfo.hasNextPage;
            cursor = products.pageInfo.endCursor;

            // console.log(`Processed ${products.edges.length} products, total products: ${totalProducts}, total variants: ${allVariantPrices.length}`);
        }

        // Calculate average price
        if (allVariantPrices.length === 0) {
            return {
                averagePrice: 0,
                totalVariants: 0,
                totalProducts: totalProducts,
                message: 'No variants with valid prices found'
            };
        }

        const totalPrice = allVariantPrices.reduce((sum, variant) => sum + variant.price, 0);
        const averagePrice = totalPrice / allVariantPrices.length;
        return averagePrice.toFixed(2);

    } catch (error) {
        console.error('Error calculating average product price:', error);
        throw error;
    }
};

const getTopSellingProducts = async () => {
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
            total_quantity_sold DESC
            LIMIT 5;
                    `;

        const result = await queryForBigQuery(query);
        // console.log(result);
        const mockData = [
            { name: 'Product A', sales: 1200, revenue: 24000 },
            { name: 'Product B', sales: 950, revenue: 19000 },
            { name: 'Product C', sales: 800, revenue: 16000 },
            { name: 'Product D', sales: 750, revenue: 15000 },
            { name: 'Product E', sales: 600, revenue: 12000 },
        ];
        //receiiving this data

        // [
        //     {
        //       product_name: 'Frido Ultimate Wedge Plus Cushion',
        //       total_quantity_sold: 28552,
        //       number_of_variants: 10
        //     },
        //     {
        //       product_name: 'Ultimate Car Comfort Bundle',
        //       total_quantity_sold: 13679,
        //       number_of_variants: 2
        //     },
        //     {
        //       product_name: 'Frido Travel Neck Pillow',
        //       total_quantity_sold: 11302,
        //       number_of_variants: 5
        //     },
        //     {
        //       product_name: 'Frido Ultimate Car Neck Rest Pillow',
        //       total_quantity_sold: 10612,
        //       number_of_variants: 7
        //     },
        //     {
        //       product_name: 'Frido Ultimate Wedge Cushion',
        //       total_quantity_sold: 7352,
        //       number_of_variants: 4
        //     }
        //   ]

        
        const data = result.map(item => ({
            name: item.product_name,
            quantitySold: item.total_quantity_sold,
            revenue: item.total_revenue
        }));

        return data;
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        throw error;
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
        const mockData =  [
            { name: 'Product X', sales: 10, revenue: 200 },
            { name: 'Product Y', sales: 15, revenue: 300 },
            { name: 'Product Z', sales: 20, revenue: 400 },
            { name: 'Product W', sales: 25, revenue: 500 },
            { name: 'Product V', sales: 30, revenue: 600 },
        ];
        return mockData;
    } catch (error) {
        console.error('Error fetching least selling products:', error);
        throw error;
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