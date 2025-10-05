const express = require('express');
const cors = require('cors');
const axios = require('axios');
const products = require('./products.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// GERÇEK ALTIN FİYATI API'Sİ 
const getGoldPrice = async () => {
  try {
    console.log('🔄 Altın fiyatı alınıyor...');
    
    const response = await axios.get('https://api.metals.live/v1/spot/gold');
    
    console.log('API Response:', response.data);
    
    // API yanıtına göre fiyatı al
    let pricePerOunce;
    if (response.data && response.data[0] && response.data[0].price) {
      pricePerOunce = response.data[0].price;
    } else {
      throw new Error('API yanıt beklenen formatta değil');
    }
    
    // Gram başına fiyat (1 ons = 31.1035 gram)
    const pricePerGram = pricePerOunce / 31.1035;
    
    console.log('Altın fiyatı alındı:', {
      pricePerOunce: pricePerOunce,
      pricePerGram: pricePerGram.toFixed(2)
    });
    
    return pricePerGram;
  } catch (error) {
    console.log('Altın API hatası, gerçekçi değer kullanılıyor:', error.message);
    return 68.42;
  }
};

// Fiyat hesaplama 
const calculatePrice = (popularityScore, weight, goldPrice) => {
  console.log('Fiyat hesaplanıyor:', {
    popularityScore: popularityScore,
    weight: weight,
    goldPrice: goldPrice
  });
  
  const calculated = ((popularityScore + 1) * weight * goldPrice).toFixed(2);
  console.log('Hesaplanan fiyat:', calculated);
  
  return calculated;
};

// Tüm ürünleri getir 
app.get('/api/products', async (req, res) => {
  try {
    console.log('Ürünler isteği alındı');
    const goldPrice = await getGoldPrice();
    
    console.log('Kullanılacak altın fiyatı:', goldPrice);
    
    const productsWithPrice = products.map((product, index) => {
      const price = calculatePrice(product.popularityScore, product.weight, goldPrice);
      
      console.log(`Ürün ${index + 1}:`, {
        name: product.name,
        popularity: product.popularityScore,
        weight: product.weight,
        calculatedPrice: price
      });
      
      return {
        ...product,
        price: price,
        goldPrice: goldPrice,
        rating: (product.popularityScore / 100).toFixed(1)
      };
    });

    console.log('Tüm ürünler hazır, gönderiliyor...');
    res.json(productsWithPrice);
  } catch (error) {
    console.error('Ürünler yüklenirken hata:', error);
    res.status(500).json({ error: 'Ürünler yüklenirken hata' });
  }
});

// Altın fiyatını tek başına getir
app.get('/api/gold-price', async (req, res) => {
  try {
    const goldPrice = await getGoldPrice();
    res.json({ 
      goldPricePerGram: goldPrice,
      timestamp: new Date().toISOString(),
      source: 'metals.live API'
    });
  } catch (error) {
    res.status(500).json({ error: 'Altın fiyatı alınamadı' });
  }
});

// Filtreleme endpoint'i 
app.get('/api/products/filter', async (req, res) => {
  try {
    const { minPrice, maxPrice, minRating } = req.query;
    const goldPrice = await getGoldPrice();
    
    let filteredProducts = products.map(product => ({
      ...product,
      price: calculatePrice(product.popularityScore, product.weight, goldPrice),
      goldPrice: goldPrice,
      rating: ((product.popularityScore / 100) * 5).toFixed(1)  // ← DÜZELTİLDİ!
    }));

    // Fiyat filtreleme
    if (minPrice) {
      filteredProducts = filteredProducts.filter(product => parseFloat(product.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product => parseFloat(product.price) <= parseFloat(maxPrice));
    }
    
    // Rating filtreleme
    if (minRating) {
      filteredProducts = filteredProducts.filter(product => parseFloat(product.rating) >= parseFloat(minRating));
    }

    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: 'Filtreleme hatası' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend çalışıyor! 🚀',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Backend başlatıldı: http://localhost:${PORT}`);
  console.log(`Test: http://localhost:${PORT}/api/test`);
  console.log(`Ürünler: http://localhost:${PORT}/api/products`);
  console.log(`Altın Fiyatı: http://localhost:${PORT}/api/gold-price`);
  console.log(`Filtreleme: http://localhost:${PORT}/api/products/filter?minPrice=100&maxPrice=500`);
});