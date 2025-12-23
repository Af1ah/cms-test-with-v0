// Simple utility to test image URLs directly
// You can run this in your browser console to test specific image URLs

window.testImageUrl = function(url) {
  console.log('🧪 Testing image URL:', url);
  
  // Create a test image element
  const img = new Image();
  
  img.onload = function() {
    console.log('✅ Image loaded successfully:', {
      url,
      naturalWidth: this.naturalWidth,
      naturalHeight: this.naturalHeight,
      complete: this.complete
    });
  };
  
  img.onerror = function(error) {
    console.error('❌ Image failed to load:', {
      url,
      error: error
    });
  };
  
  img.src = url;
  
  // Also test with fetch to check CORS and accessibility
  fetch(url, { 
    method: 'HEAD',
    mode: 'cors'
  })
  .then(response => {
    console.log('🌐 HEAD request successful:', {
      url,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
  })
  .catch(error => {
    console.error('🚫 HEAD request failed:', {
      url,
      error: error.message
    });
  });
};

// Test multiple URLs
window.testImageUrls = function(urls) {
  console.log('🧪 Testing multiple image URLs...');
  urls.forEach((url, index) => {
    setTimeout(() => window.testImageUrl(url), index * 500);
  });
};

console.log('🛠️ Image testing utilities loaded!');
console.log('Usage:');
console.log('  testImageUrl("your-image-url-here")');
console.log('  testImageUrls(["url1", "url2", "url3"])');
