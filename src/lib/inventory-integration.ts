import { MOCK_PRODUCTS } from './mock-data';
import { Product } from './types';

/**
 * Get unique device brands from inventory
 */
export const getDeviceBrandsFromInventory = (): string[] => {
  const brands = MOCK_PRODUCTS.map(product => product.brand);
  const uniqueBrands = [...new Set(brands)].sort();
  
  // Add common repair brands that might not be in current inventory
  const commonRepairBrands = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 
    'Huawei', 'LG', 'Motorola', 'Sony', 'Nokia', 'Other'
  ];
  
  const allBrands = [...new Set([...uniqueBrands, ...commonRepairBrands])].sort();
  return allBrands;
};

/**
 * Get device models for a specific brand from inventory
 */
export const getDeviceModelsForBrand = (brand: string): string[] => {
  const models = MOCK_PRODUCTS
    .filter(product => product.brand.toLowerCase() === brand.toLowerCase())
    .map(product => product.model);
  
  return [...new Set(models)].sort();
};

/**
 * Find inventory item by IMEI
 */
export const findInventoryByIMEI = (imei: string): Product | undefined => {
  return MOCK_PRODUCTS.find(product => product.imei === imei);
};

/**
 * Search inventory by brand and model
 */
export const searchInventoryByDevice = (brand: string, model?: string): Product[] => {
  return MOCK_PRODUCTS.filter(product => {
    const brandMatch = product.brand.toLowerCase() === brand.toLowerCase();
    if (!model) return brandMatch;
    return brandMatch && product.model.toLowerCase().includes(model.toLowerCase());
  });
};

/**
 * Get device suggestions based on partial input
 */
export const getDeviceSuggestions = (query: string): { brand: string; model: string; imei?: string }[] => {
  const results = MOCK_PRODUCTS.filter(product => 
    product.brand.toLowerCase().includes(query.toLowerCase()) ||
    product.model.toLowerCase().includes(query.toLowerCase()) ||
    product.imei.includes(query)
  );
  
  return results.map(product => ({
    brand: product.brand,
    model: product.model,
    imei: product.imei
  }));
};

/**
 * Check if device exists in inventory
 */
export const isDeviceInInventory = (brand: string, model: string, imei?: string): boolean => {
  return MOCK_PRODUCTS.some(product => {
    const brandMatch = product.brand.toLowerCase() === brand.toLowerCase();
    const modelMatch = product.model.toLowerCase() === model.toLowerCase();
    const imeiMatch = !imei || product.imei === imei;
    
    return brandMatch && modelMatch && imeiMatch;
  });
};

/**
 * Get inventory statistics for repair dashboard
 */
export const getInventoryStats = () => {
  const totalDevices = MOCK_PRODUCTS.length;
  const brands = getDeviceBrandsFromInventory();
  const availableDevices = MOCK_PRODUCTS.filter(p => p.status !== 'Sold').length;
  
  const brandStats = brands.map(brand => ({
    brand,
    count: MOCK_PRODUCTS.filter(p => p.brand === brand).length
  }));
  
  return {
    totalDevices,
    availableDevices,
    brandsCount: brands.length,
    brandStats
  };
};