// Debug utility for testing image loading issues
// Run this in browser console to test image URLs

export const debugImageUrl = (url) => {
  console.log('🖼️ Testing image URL:', url)
  
  const img = new Image()
  
  img.onload = () => {
    console.log('✅ Image loaded successfully:', {
      url,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete
    })
  }
  
  img.onerror = (error) => {
    console.error('❌ Image failed to load:', {
      url,
      error
    })
  }
  
  img.src = url
  
  // Test CORS
  fetch(url, { method: 'HEAD' })
    .then(response => {
      console.log('🌐 CORS check:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length')
        }
      })
    })
    .catch(error => {
      console.error('🚫 CORS/Network error:', { url, error })
    })
}

// Test multiple URLs at once
export const debugImageUrls = (urls) => {
  console.log('🧪 Testing multiple image URLs...')
  urls.forEach((url, index) => {
    setTimeout(() => debugImageUrl(url), index * 100)
  })
}

// Browser console usage:
// debugImageUrl('your-image-url-here')
// debugImageUrls(['url1', 'url2', 'url3'])
