import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

interface Product {
  name: string;
  popularityScore: number;
  weight: number;
  price: string;
  rating: string;
  goldPrice: number;
  images: {
    yellow: string;
    rose: string;
    white: string;
  };
}

// STAR RATING COMPONENT - YARIM YILDIZ DESTEKLİ
const StarRating: React.FC<{ 
  rating: number; 
  onRatingChange?: (rating: number) => void 
}> = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const handleStarClick = (index: number, isHalf: boolean) => {
    if (onRatingChange) {
      const newRating = isHalf ? index + 0.5 : index + 1;
      onRatingChange(newRating);
    }
  };

  const handleStarHover = (index: number, isHalf: boolean) => {
    if (onRatingChange) {
      const newHover = isHalf ? index + 0.5 : index + 1;
      setHoverRating(newHover);
    }
  };

  const handleMouseLeave = () => setHoverRating(null);

  const displayRating = hoverRating ?? rating;

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {[0, 1, 2, 3, 4].map((index) => {
        const starValue = index + 1;
        const isFull = displayRating >= starValue;
        const isHalf = displayRating >= starValue - 0.5 && displayRating < starValue;

        return (
          <span key={index} className="star-wrapper">
            <span
              className={`star ${isFull ? 'filled' : isHalf ? 'half' : 'empty'}`}
              onClick={(e) => {
                const { offsetX, target } = e.nativeEvent as MouseEvent;
                const isLeftHalf = offsetX < (target as HTMLElement).offsetWidth / 2;
                handleStarClick(index, isLeftHalf);
              }}
              onMouseMove={(e) => {
                const { offsetX, target } = e.nativeEvent as MouseEvent;
                const isLeftHalf = offsetX < (target as HTMLElement).offsetWidth / 2;
                handleStarHover(index, isLeftHalf);
              }}
              style={{ cursor: onRatingChange ? 'pointer' : 'default', position: 'relative' }}
            >
              ★
            </span>
          </span>
        );
      })}
      <span className="rating-text">{displayRating.toFixed(1)}/5</span>
    </div>
  );
};


// COLOR PICKER COMPONENT
const ColorPicker: React.FC<{ selectedColor: string; onColorChange: (color: string) => void }> = ({
  selectedColor,
  onColorChange,
}) => {
  const colors = [
    { id: 'yellow', label: 'Yellow Gold' },
    { id: 'white', label: 'White Gold' },
    { id: 'rose', label: 'Rose Gold' },
  ];

  return (
    <div>
      <div className="color-options">
        {colors.map((color) => (
          <div
            key={color.id}
            className={`color-option color-${color.id} ${selectedColor === color.id ? 'active' : ''}`}
            onClick={() => onColorChange(color.id)}
          />
        ))}
      </div>
    </div>
  );
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColors, setSelectedColors] = useState<{ [key: number]: string }>({});
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  // SWIPE SUPPORT FOR MOBILE
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      scrollRight();
    }

    if (touchStart - touchEnd < -75) {
      scrollLeft();
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
        setLoading(false);

        const defaultColors: { [key: number]: string } = {};
        const defaultRatings: { [key: number]: number } = {};
        response.data.forEach((product: Product, index: number) => {
          defaultColors[index] = 'yellow';
          defaultRatings[index] = parseFloat(product.rating);
        });
        setSelectedColors(defaultColors);
        setRatings(defaultRatings);
      } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleColorChange = (productIndex: number, color: string) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productIndex]: color,
    }));
  };

  const handleRatingChange = (productIndex: number, newRating: number) => {
    setRatings(prev => ({
      ...prev,
      [productIndex]: newRating
    }));
  };

  // CAROUSEL FUNCTIONS
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // RENK YAZISI FONKSİYONU
  const getColorText = (color: string) => {
    switch (color) {
      case 'yellow': return 'Yellow Gold';
      case 'white': return 'White Gold';
      case 'rose': return 'Rose Gold';
      default: return 'Yellow Gold';
    }
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="App">
      <header className="header-section">
        <h1 className="header-title">Product List</h1>
      </header>

      {/* Carousel */}
      <div className="carousel-wrapper">
        <button className="arrow left" onClick={scrollLeft}>‹</button>
        <div 
          className="product-carousel"
          ref={carouselRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {products.map((product, index) => (
            <div key={index} className="product-card">
              <img
                src={product.images[selectedColors[index] as keyof typeof product.images]}
                alt={product.name}
                className="product-image"
              />
              
              <h3 className="product-title">Product Title</h3>
              <p className="product-price">${product.price} USD</p>
              
              <ColorPicker
                selectedColor={selectedColors[index]}
                onColorChange={(color) => handleColorChange(index, color)}
              />
              
              <p className={`product-metal ${selectedColors[index]}`}>
                {getColorText(selectedColors[index])}
              </p>
              
              <StarRating 
                rating={ratings[index] || parseFloat(product.rating)} 
                onRatingChange={(newRating) => handleRatingChange(index, newRating)}
              />
            </div>
          ))}
        </div>
        <button className="arrow right" onClick={scrollRight}>›</button>
      </div>
    </div>
  );
}

export default App;






