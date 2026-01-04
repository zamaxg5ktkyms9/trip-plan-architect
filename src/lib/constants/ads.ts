/**
 * Gadget advertisements for footer
 */
export const GADGET_ADS = [
  {
    id: 1,
    name: 'Travel Power Bank 20000mAh',
    description: 'Fast charging portable battery for all your devices',
    price: '$29.99',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
    link: '#',
  },
  {
    id: 2,
    name: 'Noise Cancelling Earbuds',
    description: 'Premium sound quality for your journey',
    price: '$79.99',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
    link: '#',
  },
  {
    id: 3,
    name: 'Compact Travel Adapter',
    description: 'Universal adapter for 150+ countries',
    price: '$19.99',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
    link: '#',
  },
  {
    id: 4,
    name: 'Smart Luggage Tracker',
    description: 'Never lose your luggage again',
    price: '$34.99',
    image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400',
    link: '#',
  },
  {
    id: 5,
    name: 'Portable WiFi Hotspot',
    description: 'Stay connected anywhere in the world',
    price: '$89.99',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
    link: '#',
  },
]

/**
 * Returns a random gadget ad
 */
export function getRandomGadgetAd() {
  return GADGET_ADS[Math.floor(Math.random() * GADGET_ADS.length)]
}
