const products = require('../products.json');

export default function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { limit = 20, page = 0, sort, filter } = req.query;
    
    // Simple mock logic for search/filtering
    let results = [...products];

    if (filter) {
        const filterKeyword = Array.isArray(filter) ? filter[1] : filter;
        if (filterKeyword) {
          results = results.filter(p => p.name.toLowerCase().includes(filterKeyword.toLowerCase()));
        }
    }

    return res.status(200).json({
      status: 'OK',
      message: 'SUCCESS',
      data: results,
      total: results.length,
      pageCurrent: Number(page) + 1,
      totalPage: Math.ceil(results.length / limit)
    });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
