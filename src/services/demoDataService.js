// Demo data service for non-myfrido stores
export const demoStoreData = {
  frido_uae: {
    ordersOverview: {
      totalOrders: 347,
      totalRevenue: 52890.50,
      averageOrderValue: 152.46,
      conversionRate: 3.2,
      totalCustomers: 234,
      returningCustomers: 89,
      refundedOrders: 12,
      pendingOrders: 23
    },
    
    ordersByTimeRange: [
      { date: '2024-01-15', orders: 12, revenue: 1840.25 },
      { date: '2024-01-16', orders: 18, revenue: 2760.75 },
      { date: '2024-01-17', orders: 15, revenue: 2285.50 },
      { date: '2024-01-18', orders: 22, revenue: 3360.80 },
      { date: '2024-01-19', orders: 19, revenue: 2894.35 },
      { date: '2024-01-20', orders: 25, revenue: 3812.25 },
      { date: '2024-01-21', orders: 21, revenue: 3201.60 }
    ],

    topSellingProducts: [
      {
        id: 1,
        title: 'Premium Dates Gift Box',
        quantity: 89,
        revenue: 8900.00,
        image: 'https://images.unsplash.com/photo-1577003833259-abce5f0b3d6b?w=50'
      },
      {
        id: 2,
        title: 'Arabic Coffee Set',
        quantity: 67,
        revenue: 6700.00,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=50'
      },
      {
        id: 3,
        title: 'Traditional Spice Collection',
        quantity: 54,
        revenue: 5400.00,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=50'
      },
      {
        id: 4,
        title: 'Luxury Perfume Set',
        quantity: 43,
        revenue: 4300.00,
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=50'
      },
      {
        id: 5,
        title: 'Handcrafted Jewelry',
        quantity: 38,
        revenue: 3800.00,
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=50'
      }
    ],

    refundMetrics: {
      totalRefunds: 12,
      refundAmount: 1840.75,
      refundRate: 3.46,
      averageRefundAmount: 153.40,
      refundsByReason: [
        { reason: 'Damaged Product', count: 5, amount: 765.25 },
        { reason: 'Not as Described', count: 4, amount: 612.20 },
        { reason: 'Late Delivery', count: 2, amount: 306.15 },
        { reason: 'Customer Changed Mind', count: 1, amount: 157.15 }
      ]
    },

    recentOrders: {
      orders: [
        {
          id: 'UAE-ORD-001',
          customerName: 'Ahmed Al-Mahmoud',
          totalAmount: 285.50,
          status: 'fulfilled',
          createdAt: '2024-01-21T10:30:00Z',
          items: 3,
          email: 'ahmed.m@email.com'
        },
        {
          id: 'UAE-ORD-002',
          customerName: 'Fatima Al-Hassan',
          totalAmount: 420.75,
          status: 'processing',
          createdAt: '2024-01-21T09:15:00Z',
          items: 5,
          email: 'fatima.h@email.com'
        },
        {
          id: 'UAE-ORD-003',
          customerName: 'Mohammed Al-Rashid',
          totalAmount: 156.25,
          status: 'shipped',
          createdAt: '2024-01-20T16:45:00Z',
          items: 2,
          email: 'mohammed.r@email.com'
        },
        {
          id: 'UAE-ORD-004',
          customerName: 'Aisha Al-Zahra',
          totalAmount: 389.00,
          status: 'fulfilled',
          createdAt: '2024-01-20T14:20:00Z',
          items: 4,
          email: 'aisha.z@email.com'
        },
        {
          id: 'UAE-ORD-005',
          customerName: 'Omar Al-Farisi',
          totalAmount: 225.80,
          status: 'processing',
          createdAt: '2024-01-20T11:10:00Z',
          items: 3,
          email: 'omar.f@email.com'
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 35,
        totalOrders: 347,
        hasNextPage: true,
        hasPreviousPage: false
      }
    },

    // Products data
    productsList: [
      {
        id: 1,
        name: 'Premium Dates Gift Box',
        sku: 'UAE-DGB-001',
        totalSold: 89,
        image: 'https://images.unsplash.com/photo-1577003833259-abce5f0b3d6b?w=50'
      },
      {
        id: 2,
        name: 'Arabic Coffee Set',
        sku: 'UAE-ACS-002',
        totalSold: 67,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=50'
      },
      {
        id: 3,
        name: 'Traditional Spice Collection',
        sku: 'UAE-TSC-003',
        totalSold: 54,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=50'
      },
      {
        id: 4,
        name: 'Luxury Perfume Set',
        sku: 'UAE-LPS-004',
        totalSold: 43,
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=50'
      },
      {
        id: 5,
        name: 'Handcrafted Jewelry',
        sku: 'UAE-HCJ-005',
        totalSold: 38,
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=50'
      },
      {
        id: 6,
        name: 'Traditional Oud',
        sku: 'UAE-TOU-006',
        totalSold: 35,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50'
      },
      {
        id: 7,
        name: 'Persian Carpets',
        sku: 'UAE-PCR-007',
        totalSold: 28,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=50'
      },
      {
        id: 8,
        name: 'Arabic Calligraphy Art',
        sku: 'UAE-ACA-008',
        totalSold: 25,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50'
      },
      {
        id: 9,
        name: 'Traditional Lanterns',
        sku: 'UAE-TLN-009',
        totalSold: 22,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50'
      },
      {
        id: 10,
        name: 'Moroccan Tea Set',
        sku: 'UAE-MTS-010',
        totalSold: 18,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=50'
      }
    ],

    productMetrics: {
      totalProducts: 45,
      averageProductPrice: 185.60,
      totalCategories: 8,
      averageReturnRate: 4.2,
      topSellingProducts: [
        { name: 'Premium Dates Gift Box', quantitySold: 89, revenue: 8900.00 },
        { name: 'Arabic Coffee Set', quantitySold: 67, revenue: 6700.00 },
        { name: 'Traditional Spice Collection', quantitySold: 54, revenue: 5400.00 },
        { name: 'Luxury Perfume Set', quantitySold: 43, revenue: 4300.00 },
        { name: 'Handcrafted Jewelry', quantitySold: 38, revenue: 3800.00 }
      ],
      topSellingProducts24h: [
        { name: 'Premium Dates Gift Box', quantitySold: 12, revenue: 1200.00 },
        { name: 'Arabic Coffee Set', quantitySold: 8, revenue: 800.00 },
        { name: 'Traditional Spice Collection', quantitySold: 6, revenue: 600.00 },
        { name: 'Luxury Perfume Set', quantitySold: 5, revenue: 500.00 },
        { name: 'Handcrafted Jewelry', quantitySold: 4, revenue: 400.00 }
      ],
      topCategories: [
        { name: 'Food & Beverages', value: 35 },
        { name: 'Fragrances', value: 25 },
        { name: 'Jewelry', value: 20 },
        { name: 'Home Decor', value: 15 },
        { name: 'Textiles', value: 5 }
      ],
      topCategories24h: [
        { name: 'Food & Beverages', value: 40 },
        { name: 'Fragrances', value: 30 },
        { name: 'Jewelry', value: 15 },
        { name: 'Home Decor', value: 10 },
        { name: 'Textiles', value: 5 }
      ],
      leastSellingProducts: [
        { name: 'Moroccan Tea Set', quantitySold: 18, revenue: 1800.00 },
        { name: 'Traditional Lanterns', quantitySold: 22, revenue: 2200.00 },
        { name: 'Arabic Calligraphy Art', quantitySold: 25, revenue: 2500.00 },
        { name: 'Persian Carpets', quantitySold: 28, revenue: 2800.00 },
        { name: 'Traditional Oud', quantitySold: 35, revenue: 3500.00 }
      ],
      leastSellingProducts24h: [
        { name: 'Moroccan Tea Set', quantitySold: 0, revenue: 0 },
        { name: 'Traditional Lanterns', quantitySold: 1, revenue: 100.00 },
        { name: 'Arabic Calligraphy Art', quantitySold: 2, revenue: 200.00 },
        { name: 'Persian Carpets', quantitySold: 2, revenue: 200.00 },
        { name: 'Traditional Oud', quantitySold: 3, revenue: 300.00 }
      ],
      mostReturnedProducts: [
        { name: 'Persian Carpets', returns: 8, returnRate: '12%' },
        { name: 'Arabic Calligraphy Art', returns: 6, returnRate: '10%' },
        { name: 'Traditional Lanterns', returns: 4, returnRate: '8%' },
        { name: 'Moroccan Tea Set', returns: 3, returnRate: '7%' },
        { name: 'Traditional Oud', returns: 2, returnRate: '5%' }
      ]
    }
  },

  mobility: {
    ordersOverview: {
      totalOrders: 156,
      totalRevenue: 89450.75,
      averageOrderValue: 573.40,
      conversionRate: 2.8,
      totalCustomers: 124,
      returningCustomers: 45,
      refundedOrders: 8,
      pendingOrders: 15
    },

    productsList: [
      {
        id: 1,
        name: 'Electric Scooter Pro',
        sku: 'MOB-ESP-001',
        totalSold: 245,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=50'
      },
      {
        id: 2,
        name: 'Smart Bike Lock',
        sku: 'MOB-SBL-002',
        totalSold: 189,
        image: 'https://images.unsplash.com/photo-1544191696-15693072fb36?w=50'
      },
      {
        id: 3,
        name: 'Electric Bike Battery',
        sku: 'MOB-EBB-003',
        totalSold: 156,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=50'
      },
      {
        id: 4,
        name: 'Helmet with Bluetooth',
        sku: 'MOB-HBT-004',
        totalSold: 134,
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=50'
      },
      {
        id: 5,
        name: 'LED Safety Lights',
        sku: 'MOB-LSL-005',
        totalSold: 298,
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=50'
      }
    ],

    productMetrics: {
      totalProducts: 28,
      averageProductPrice: 425.80,
      totalCategories: 5,
      averageReturnRate: 3.1,
      topSellingProducts: [
        { name: 'LED Safety Lights', quantitySold: 298, revenue: 14900.00 },
        { name: 'Electric Scooter Pro', quantitySold: 245, revenue: 122500.00 },
        { name: 'Smart Bike Lock', quantitySold: 189, revenue: 18900.00 },
        { name: 'Electric Bike Battery', quantitySold: 156, revenue: 31200.00 },
        { name: 'Helmet with Bluetooth', quantitySold: 134, revenue: 20100.00 }
      ],
      topSellingProducts24h: [
        { name: 'LED Safety Lights', quantitySold: 15, revenue: 750.00 },
        { name: 'Electric Scooter Pro', quantitySold: 12, revenue: 6000.00 },
        { name: 'Smart Bike Lock', quantitySold: 8, revenue: 800.00 },
        { name: 'Electric Bike Battery', quantitySold: 6, revenue: 1200.00 },
        { name: 'Helmet with Bluetooth', quantitySold: 5, revenue: 750.00 }
      ],
      topCategories: [
        { name: 'Electric Vehicles', value: 45 },
        { name: 'Safety Equipment', value: 30 },
        { name: 'Accessories', value: 15 },
        { name: 'Batteries & Chargers', value: 8 },
        { name: 'Smart Devices', value: 2 }
      ],
      topCategories24h: [
        { name: 'Electric Vehicles', value: 50 },
        { name: 'Safety Equipment', value: 35 },
        { name: 'Accessories', value: 10 },
        { name: 'Batteries & Chargers', value: 5 },
        { name: 'Smart Devices', value: 0 }
      ],
      leastSellingProducts: [
        { name: 'Smart Tire Pressure Monitor', quantitySold: 12, revenue: 1200.00 },
        { name: 'Wireless Phone Charger', quantitySold: 18, revenue: 1800.00 },
        { name: 'GPS Tracker', quantitySold: 25, revenue: 2500.00 },
        { name: 'Bike Computer', quantitySold: 32, revenue: 3200.00 },
        { name: 'Water Bottle Holder', quantitySold: 45, revenue: 1125.00 }
      ],
      leastSellingProducts24h: [
        { name: 'Smart Tire Pressure Monitor', quantitySold: 0, revenue: 0 },
        { name: 'Wireless Phone Charger', quantitySold: 1, revenue: 100.00 },
        { name: 'GPS Tracker', quantitySold: 1, revenue: 100.00 },
        { name: 'Bike Computer', quantitySold: 2, revenue: 200.00 },
        { name: 'Water Bottle Holder', quantitySold: 3, revenue: 75.00 }
      ],
      mostReturnedProducts: [
        { name: 'Electric Bike Battery', returns: 12, returnRate: '8%' },
        { name: 'Smart Bike Lock', returns: 8, returnRate: '4%' },
        { name: 'GPS Tracker', returns: 5, returnRate: '20%' },
        { name: 'Helmet with Bluetooth', returns: 4, returnRate: '3%' },
        { name: 'Bike Computer', returns: 3, returnRate: '9%' }
      ]
    }
  },

  frido_sa: {
    ordersOverview: {
      totalOrders: 203,
      totalRevenue: 34672.25,
      averageOrderValue: 170.75,
      conversionRate: 2.9,
      totalCustomers: 167,
      returningCustomers: 62,
      refundedOrders: 9,
      pendingOrders: 18
    },

    productsList: [
      {
        id: 1,
        name: 'Arabian Dates Premium',
        sku: 'SA-ADP-001',
        totalSold: 156,
        image: 'https://images.unsplash.com/photo-1577003833259-abce5f0b3d6b?w=50'
      },
      {
        id: 2,
        name: 'Traditional Spices',
        sku: 'SA-TSP-002',
        totalSold: 134,
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=50'
      },
      {
        id: 3,
        name: 'Saudi Coffee Beans',
        sku: 'SA-SCB-003',
        totalSold: 98,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=50'
      }
    ],

    productMetrics: {
      totalProducts: 32,
      averageProductPrice: 125.40,
      totalCategories: 6,
      averageReturnRate: 3.8,
      topSellingProducts: [
        { name: 'Arabian Dates Premium', quantitySold: 156, revenue: 7800.00 },
        { name: 'Traditional Spices', quantitySold: 134, revenue: 6700.00 },
        { name: 'Saudi Coffee Beans', quantitySold: 98, revenue: 4900.00 }
      ],
      topSellingProducts24h: [
        { name: 'Arabian Dates Premium', quantitySold: 8, revenue: 400.00 },
        { name: 'Traditional Spices', quantitySold: 6, revenue: 300.00 },
        { name: 'Saudi Coffee Beans', quantitySold: 4, revenue: 200.00 }
      ],
      topCategories: [
        { name: 'Food & Beverages', value: 60 },
        { name: 'Spices', value: 25 },
        { name: 'Traditional Crafts', value: 10 },
        { name: 'Textiles', value: 5 }
      ],
      topCategories24h: [
        { name: 'Food & Beverages', value: 65 },
        { name: 'Spices', value: 20 },
        { name: 'Traditional Crafts', value: 10 },
        { name: 'Textiles', value: 5 }
      ],
      leastSellingProducts: [],
      leastSellingProducts24h: [],
      mostReturnedProducts: []
    }
  },

  frido_usa: {
    ordersOverview: {
      totalOrders: 445,
      totalRevenue: 98234.80,
      averageOrderValue: 220.75,
      conversionRate: 4.1,
      totalCustomers: 378,
      returningCustomers: 156,
      refundedOrders: 18,
      pendingOrders: 32
    },

    productsList: [
      {
        id: 1,
        name: 'Premium Electronics Kit',
        sku: 'USA-PEK-001',
        totalSold: 234,
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=50'
      },
      {
        id: 2,
        name: 'Smart Home Bundle',
        sku: 'USA-SHB-002',
        totalSold: 189,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=50'
      },
      {
        id: 3,
        name: 'Fitness Tracker Pro',
        sku: 'USA-FTP-003',
        totalSold: 167,
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=50'
      }
    ],

    productMetrics: {
      totalProducts: 67,
      averageProductPrice: 185.90,
      totalCategories: 12,
      averageReturnRate: 4.8,
      topSellingProducts: [
        { name: 'Premium Electronics Kit', quantitySold: 234, revenue: 46800.00 },
        { name: 'Smart Home Bundle', quantitySold: 189, revenue: 37800.00 },
        { name: 'Fitness Tracker Pro', quantitySold: 167, revenue: 33400.00 }
      ],
      topSellingProducts24h: [
        { name: 'Premium Electronics Kit', quantitySold: 12, revenue: 2400.00 },
        { name: 'Smart Home Bundle', quantitySold: 9, revenue: 1800.00 },
        { name: 'Fitness Tracker Pro', quantitySold: 7, revenue: 1400.00 }
      ],
      topCategories: [
        { name: 'Electronics', value: 40 },
        { name: 'Smart Home', value: 25 },
        { name: 'Fitness', value: 20 },
        { name: 'Gaming', value: 10 },
        { name: 'Accessories', value: 5 }
      ],
      topCategories24h: [
        { name: 'Electronics', value: 45 },
        { name: 'Smart Home', value: 30 },
        { name: 'Fitness', value: 15 },
        { name: 'Gaming', value: 8 },
        { name: 'Accessories', value: 2 }
      ],
      leastSellingProducts: [],
      leastSellingProducts24h: [],
      mostReturnedProducts: []
    }
  }
};

export const getDemoDataForStore = (storeId, dataType, params = {}) => {
  const storeData = demoStoreData[storeId];
  
  if (!storeData) {
    return null;
  }

  return storeData[dataType] || null;
};

export const isStoreDemo = (storeId) => {
  return storeId !== 'myfrido';
}; 