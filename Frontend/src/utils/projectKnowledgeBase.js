import stringSimilarity from 'string-similarity';

const normalize = (text = '') => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const knowledgeEntries = [
  {
    id: 'project_overview',
    question: 'Walkzy là gì?',
    keywords: ['walkzy 2.2', 'gioi thieu du an', 'tong quan he thong'],
    answer: `Walkzy 2.2 là nền tảng thương mại điện tử tập trung vào thời trang nam. Dự án bao gồm website bán hàng cho khách và hệ thống quản trị nâng cao (sản phẩm, khuyến mãi, vận chuyển, phân tích, AI chatbox). Frontend xây trên React 18 + Ant Design, backend Node/Express + MongoDB (REST API), tích hợp PayPal và nhiều module realtime khác.`
  },
  {
    id: 'feature_highlights',
    question: 'Dự án có những tính năng chính nào?',
    keywords: ['tinh nang', 'module', 'chuc nang chinh', 'feature'],
    answer: `Các nhóm tính năng nổi bật:
- **Khách hàng**: xem danh mục cha/con, tìm kiếm có lọc, khuyến mãi, thanh toán PayPal/COD, theo dõi đơn hàng.
- **Quản trị**: tạo/sửa sản phẩm với biến thể, quản lý banner, khuyến mãi, voucher vận chuyển, phân tích doanh thu, quản lý người dùng.
- **Trải nghiệm nâng cao**: Chatbot AI, spell correction, gợi ý sản phẩm, flash sale, collections.`
  },
  {
    id: 'promotion_system',
    question: 'Khuyến mãi hoạt động ra sao?',
    keywords: ['khuyen mai', 'promotion', 'voucher', 'shipping voucher'],
    answer: `Module khuyến mãi hỗ trợ nhiều loại: giảm %, giảm tiền cố định, voucher user mới, voucher toàn shop, flash sale, combo, voucher vận chuyển. Admin có thể áp dụng cho sản phẩm, danh mục, thương hiệu; đặt điều kiện giá trị đơn hàng, giới hạn người dùng, thời gian. Frontend CategoryDetail và ChatBox đã hiển thị các promotion tương ứng.`
  },
  {
    id: 'shipping_payment',
    question: 'Vận chuyển và thanh toán thế nào?',
    keywords: ['shipping', 'van chuyen', 'thanh toan', 'paypal', 'phi giao hang'],
    answer: `Hệ thống hỗ trợ nhiều phương thức vận chuyển (chuẩn, nhanh, freeship theo voucher) với phí hiển thị rõ tại bước đặt hàng. Thanh toán gồm COD và PayPal (qua @paypal/react-paypal-js). Module PaymentPage xử lý tính phí, voucher freeship và cập nhật trạng thái đơn.`
  },
  {
    id: 'tech_stack',
    question: 'Stack kỹ thuật của Walkzy?',
    keywords: ['tech stack', 'cong nghe', 'frontend backend'],
    answer: `Stack chính:
- **Frontend**: React 18, Ant Design, styled-components, React Query, Redux-persist, chart libs (Recharts), AI chat UI tùy biến.
- **Backend**: Node.js/Express, MongoDB, JWT auth, services cho Product, Promotion, Voucher, Shipping.
- **Khác**: PayPal SDK, Nodemailer gửi mail, string-similarity cho spell-correction, AI Chat service riêng.`
  },
  {
    id: 'ai_assistant',
    question: 'Chatbot trả lời kiểu gì?',
    keywords: ['ai', 'chatbot', 'tro ly', 'spell correction'],
    answer: `Chatbot có lớp chuẩn hóa tiếng Việt + sửa chính tả (ví dụ “thawart lưng” → “thắt lưng”) trước khi gọi dịch vụ AI backend. Nếu khớp kiến thức cục bộ, hệ thống trả lời ngay với giọng thân thiện (“Mình đoán bạn đang tìm…”).`
  }
];

const candidateTexts = knowledgeEntries.map((entry) =>
  normalize(`${entry.question} ${entry.keywords.join(' ')}`)
);

export const getProjectAnswer = (rawQuestion = '') => {
  const normalizedQuestion = normalize(rawQuestion);
  if (!normalizedQuestion) return null;

  const match = stringSimilarity.findBestMatch(normalizedQuestion, candidateTexts);
  if (!match?.bestMatch || match.bestMatch.rating < 0.55) {
    return null;
  }

  return knowledgeEntries[match.bestMatchIndex]?.answer || null;
};
