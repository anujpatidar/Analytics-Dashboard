const queryForBigQuery = require('../config/bigquery');
const path = require('path');
const { getDatasetName } = require('./bigquery');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fetchTotalProductsCount = async () => {
    try {
        // Updated query for nested line_items structure
        const query = `
            SELECT COUNT(DISTINCT line_item.PRODUCT_ID) as total_products
            FROM \`${getDatasetName()}\` o,
            UNNEST(o.line_items) as line_item
            WHERE line_item.PRODUCT_ID IS NOT NULL
        `;
        
        const result = await queryForBigQuery(query);
        return result[0]?.total_products || 0;
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