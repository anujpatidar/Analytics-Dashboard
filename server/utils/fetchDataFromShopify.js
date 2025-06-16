const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SHOPIFY_STORE_URL = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Debug environment variables
console.log('🔧 Environment Variables Check:');
console.log('SHOPIFY_SHOP_DOMAIN:', SHOPIFY_STORE_URL ? '✅ Set' : '❌ Missing');
console.log('SHOPIFY_ACCESS_TOKEN:', SHOPIFY_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
console.log('Store URL will be:', SHOPIFY_STORE_URL ? `https://${SHOPIFY_STORE_URL}` : 'UNDEFINED');

const fetchAllProducts = async () => {
  try {
    const query = `
      query {
        products(first: 250, query: "status:ACTIVE -tag:no-product") {
          edges {
            node {
              id
              title
              handle
              description
              createdAt
              updatedAt
              publishedAt
              vendor
              productType
              tags
              status
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    compareAtPrice
                    inventoryQuantity
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }
    // Transform the data into a more usable format
    const products = data.data.products.edges.map(({ node }) => ({
      id: node.id.split('/').pop(),
      title: node.title,
      handle: node.handle,
      description: node.description,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      publishedAt: node.publishedAt,
      vendor: node.vendor,
      productType: node.productType,
      tags: node.tags,
      price: {
        min: parseFloat(node.priceRangeV2.minVariantPrice.amount),
        max: parseFloat(node.priceRangeV2.maxVariantPrice.amount),
        currency: node.priceRangeV2.minVariantPrice.currencyCode,
      },
      image: node.images.edges[0]?.node.url || null,
      imageAlt: node.images.edges[0]?.node.altText || null,
      variants: node.variants.edges.map(({ node: variant }) => ({
        id: variant.id.split('/').pop(),
        title: variant.title,
        sku: variant.sku,
        price: parseFloat(variant.price),
        compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
        inventoryQuantity: variant.inventoryQuantity,
        options: variant.selectedOptions.map(option => ({
          name: option.name,
          value: option.value,
        })),
      })),
    }));
    return products;
  } catch (error) {
    console.error('Error fetching products from Shopify:', error);
    throw error;
  }
};

//fetch listing image of product by Id
const fetchListingImageAndDescriptionById = async (productId) => {
  // Format the ID to match Shopify's global ID format
  const globalId = `gid://shopify/Product/${productId}`;
  const query = `
    query {
      product(id: "${globalId}") {
        description
        images(first: 1) {
          edges {
            node {
              url
              altText
            } 
          }
        }
      }
    }
  `;
  const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  if (data.errors) {
    console.error('Error fetching product image and description:', data.errors);
    return { imageUrl: null, description: null };
  }
  return {
    imageUrl: data.data.product?.images.edges[0]?.node.url || null,
    description: data.data.product?.description || null
  };
};

const fetchProductImageByProductTitle = async (productTitle) => {
  console.log('🔍 Searching for product image with title:', productTitle);
  
  // Use the products query to search by title since product query doesn't accept title parameter
  const query = `
    query($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            title
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const searchQuery = `title:*${productTitle}*`;
  console.log('📝 GraphQL search query:', searchQuery);
  
  try {
    const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ 
        query,
        variables: { 
          query: searchQuery 
        }
      }),
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (!response.ok) {
      console.error('❌ HTTP error:', response.status, response.statusText);
      return { imageUrl: null };
    }

    const data = await response.json();
    console.log('📦 Full response data:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      return { imageUrl: null };
    }
    
    const products = data.data?.products?.edges || [];
    console.log('🛍️ Found products count:', products.length);
    
    if (products.length > 0) {
      console.log('✅ First product title:', products[0].node.title);
      const imageUrl = products[0]?.node?.images?.edges[0]?.node?.url || null;
      console.log('🖼️ Image URL:', imageUrl);
      return { imageUrl };
    } else {
      console.log('❌ No products found for search term');
      return { imageUrl: null };
    }
    
  } catch (error) {
    console.error('💥 Fetch error:', error);
    return { imageUrl: null };
  }
};

const fetchAllProductsWithPagination = async () => {
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  while (hasNextPage) {
    try {
      const query = `
        query($cursor: String) {
          products(first: 250, after: $cursor, query: "status:ACTIVE -tag:no-product") {
            edges {
              node {
                id
                title
                handle
                description
                createdAt
                updatedAt
                publishedAt
                vendor
                productType
                tags
                status
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      compareAtPrice
                      inventoryQuantity
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query,
          variables: { cursor },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      const products = data.data.products.edges.map(({ node }) => ({
        id: node.id.split('/').pop(),
        title: node.title,
        handle: node.handle,
        description: node.description,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        publishedAt: node.publishedAt,
        vendor: node.vendor,
        productType: node.productType,
        tags: node.tags,
        price: {
          min: parseFloat(node.priceRangeV2.minVariantPrice.amount),
          max: parseFloat(node.priceRangeV2.maxVariantPrice.amount),
          currency: node.priceRangeV2.minVariantPrice.currencyCode,
        },
        image: node.images.edges[0]?.node.url || null,
        imageAlt: node.images.edges[0]?.node.altText || null,
        variants: node.variants.edges.map(({ node: variant }) => ({
          id: variant.id.split('/').pop(),
          title: variant.title,
          sku: variant.sku,
          price: parseFloat(variant.price),
          compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
          inventoryQuantity: variant.inventoryQuantity,
          options: variant.selectedOptions.map(option => ({
            name: option.name,
            value: option.value,
          })),
        })),
      }));
      allProducts = [...allProducts, ...products];
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;
      // Add a small delay to avoid rate limiting
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error fetching products from Shopify:', error);
      throw error;
    }
  }
  return allProducts;
};

// Alternative REST API approach for fetching product image by title
const fetchProductImageByProductTitleREST = async (productTitle) => {
  console.log('🔍 [REST] Searching for product image with title:', productTitle);
  
  try {
    // First, search for products by title using REST API
    const encodedTitle = encodeURIComponent(productTitle);
    const searchUrl = `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/products.json?title=${encodedTitle}&limit=1`;
    console.log('📝 [REST] Search URL:', searchUrl);
    console.log('📝 [REST] Encoded title:', encodedTitle);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [REST] HTTP error:', response.status, response.statusText);
      console.error('❌ [REST] Error body:', errorText);
      return { imageUrl: null };
    }
    
    const data = await response.json();
    console.log('📦 [REST] Full response:', JSON.stringify(data, null, 2));
    console.log('📦 [REST] Found products:', data.products?.length || 0);
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      console.log('✅ [REST] Product found:', product.title);
      console.log('🖼️ [REST] Product images count:', product.images?.length || 0);
      const imageUrl = product.images && product.images.length > 0 ? product.images[0].src : null;
      console.log('🖼️ [REST] Image URL:', imageUrl);
      return { imageUrl };
    } else {
      console.log('❌ [REST] No products found');
      return { imageUrl: null };
    }
    
  } catch (error) {
    console.error('💥 [REST] Fetch error:', error);
    return { imageUrl: null };
  }
};

// Hybrid function that tries GraphQL first, then falls back to REST
const fetchProductImageByProductTitleHybrid = async (productTitle) => {
  console.log('🔄 Trying hybrid approach for product:', productTitle);
  
  // Try GraphQL first
  const graphqlResult = await fetchProductImageByProductTitle(productTitle);
  if (graphqlResult.imageUrl) {
    console.log('✅ GraphQL method succeeded');
    return graphqlResult;
  }
  
  console.log('⚠️ GraphQL method failed, trying REST API...');
  
  // Fallback to REST API
  const restResult = await fetchProductImageByProductTitleREST(productTitle);
  if (restResult.imageUrl) {
    console.log('✅ REST API method succeeded');
    return restResult;
  }
  
  console.log('❌ Both methods failed');
  return { imageUrl: null };
};

module.exports = {
  fetchAllProducts,
  fetchAllProductsWithPagination,
  fetchListingImageAndDescriptionById,
  fetchProductImageByProductTitle,
  fetchProductImageByProductTitleREST,
  fetchProductImageByProductTitleHybrid
};