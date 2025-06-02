const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const SHOPIFY_STORE_URL = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
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
// Function to fetch all products with pagination
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
module.exports = {
  fetchAllProducts,
  fetchAllProductsWithPagination,
};