const products = require('../../products.json');

export default function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query; // This works for /get-details/[id].js path

  const product = products.find(p => p._id === id);

  if (product) {
    return res.status(200).json({
      status: 'OK',
      message: 'SUCCESS',
      data: product
    });
  }

  return res.status(404).json({
    status: 'ERR',
    message: 'Product not found'
  });
}
