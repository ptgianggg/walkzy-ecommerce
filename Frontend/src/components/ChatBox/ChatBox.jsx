import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../services/ChatService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { convertPrice, getPlaceholderImage } from '../../utils';
import { normalizeUserMessage } from '../../utils/chatInputNormalizer';
import { getProjectAnswer } from '../../utils/projectKnowledgeBase';
import * as OrderService from '../../services/OrderService';
import { usePublicSettings } from '../../hooks/useSettings';
import {
  ChatContainer,
  ChatButton,
  ChatWindow,
  ChatHeader,
  HeaderLeft,
  HeaderAvatar,
  HeaderMeta,
  StatusDot,
  HeaderClose,
  ChatBody,
  ChatFooter,
  MessageList,
  MessageItem,
  MessageAvatar,
  MessageContent,
  MessageTime,
  InputContainer,
  Input,
  SendButton,
  ProductCard,
  ProductGrid,
  LoadingDots,
  PromotionList,
  PromotionCard,
  InputHint,
  SuggestionRow,
  SuggestionChip,
  AttachmentBar,
  AttachmentThumb,
  FeedbackBar,
  ContactButtons,
  InlineProductCard,
} from './style';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  RobotFilled,
  UserOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Xin chào! Mình là trợ lý AI của Walkzy - cửa hàng phụ kiện thời trang nam.\n\nMình có thể giúp bạn tìm/gợi ý sản phẩm, xem khuyến mãi, hỏi danh mục - thương hiệu hoặc kiểm tra đơn hàng.\n\nBạn muốn mình hỗ trợ gì hôm nay?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [attachments, setAttachments] = useState([]); // {name,type,size,preview,base64}
  const [savedProfile, setSavedProfile] = useState(null);
  const [profileInjected, setProfileInjected] = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]); // array of product payloads
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { settings } = usePublicSettings();
  const quickSuggestions = [
    { label: 'Xem sản phẩm bán chạy', payload: 'Sản phẩm bán chạy', autoSend: true },
    { label: 'Xem sản phẩm đang sale', payload: 'Sản phẩm đang sale', autoSend: true },
    { label: 'Tra cứu đơn hàng', payload: 'Tra cứu đơn hàng [Nhập mã đơn trong tài khoản của tôi]', autoSend: false },
    { label: 'Xem danh mục', payload: 'Danh mục đang có', autoSend: true },
    { label: 'Xem thương hiệu', payload: 'Thương hiệu hiện có', autoSend: true },
    { label: 'Liên hệ CSKH', payload: '__CONTACT__', autoSend: true, localAction: 'contact' },
  ];

  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const profileKey = user?.id ? `chat_profile_${user.id}` : 'chat_profile_guest';

  useEffect(() => {
    const handler = (e) => {
      const product = e.detail || null;
      if (!product) return;
      setIsOpen(true);
      setPendingProducts((prev) => {
        const exists = prev.find((p) => (p.id || p._id || p.name) === (product.id || product._id || product.name));
        const next = exists ? prev : [...prev, product].slice(-2); // giữ tối đa 2 sản phẩm để so sánh
        if (next.length >= 2) {
          setInputMessage('So sánh giúp mình các sản phẩm này');
        } else {
          setInputMessage(`Tư vấn sản phẩm: ${product.name || 'sản phẩm này'}`);
        }
        return next;
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener('open-chat-with-product', handler);

    try {
      const raw = localStorage.getItem(profileKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedProfile(parsed);
      } else {
        setSavedProfile(null);
      }
      setProfileInjected(false);
    } catch (err) {
      console.error('Load profile error', err);
    }
    return () => window.removeEventListener('open-chat-with-product', handler);
  }, [profileKey]);

  useEffect(() => {
    if (savedProfile && !profileInjected) {
      setConversationHistory((prev) => [
        { role: 'user', content: savedProfile.text, timestamp: new Date() },
        ...prev,
      ]);
      setProfileInjected(true);
    }
  }, [savedProfile, profileInjected]);

  const removeDiacritics = (text = '') =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');

  const parseBodyProfile = (raw = '') => {
    if (!raw) return {};
    const text = removeDiacritics(raw).toLowerCase();
    let heightCm = null;
    let weightKg = null;
    let context = null;

    const mMatch = text.match(/(\d{1}\.\d{2})\s*m/);
    const mShort = text.match(/(\d)\s*m\s*(\d{2})/);
    const heightMatch = text.match(/(\d{3})\s*cm/) || text.match(/(\d{3})(?!\d)/);

    if (mMatch) heightCm = Math.round(parseFloat(mMatch[1]) * 100);
    else if (mShort) heightCm = parseInt(mShort[1]) * 100 + parseInt(mShort[2]);
    else if (heightMatch) heightCm = parseInt(heightMatch[1]);

    const wMatch = text.match(/(\d{2,3})\s*kg/) || text.match(/(\d{2,3})(?!\d)/);
    if (wMatch) weightKg = parseInt(wMatch[1]);

    if (/cong so|di lam|office|work/.test(text)) context = 'office';
    else if (/tiec|party|dam cuoi|su kien/.test(text)) context = 'party';
    else if (/du lich|travel|di choi|phuot/.test(text)) context = 'travel';
    else if (/the thao|chay bo|gym|tap/.test(text)) context = 'sport';

    return { heightCm, weightKg, context };
  };

  const buildProfileText = ({ heightCm, weightKg, context }) => {
    const parts = [];
    if (heightCm) parts.push(`cao ${heightCm}cm`);
    if (weightKg) parts.push(`nặng ${weightKg}kg`);
    if (context) {
      const ctx =
        context === 'office'
          ? 'đi làm'
          : context === 'party'
            ? 'đi tiệc'
            : context === 'travel'
              ? 'du lịch'
              : 'thể thao';
      parts.push(`bối cảnh ${ctx}`);
    }
    return parts.length ? `Hồ sơ: ${parts.join(', ')}` : '';
  };

  const extractOrderCode = (text = '') => {
    const normalized = removeDiacritics(text).toLowerCase();
    const keywords = ['ma don', 'ma don hang', 'don hang', 'tra cuu', 'tracking', 'order', 'ma order'];
    const hasKeyword = keywords.some((keyword) => normalized.includes(keyword));
    const codeRegex = /[A-Za-z0-9-]{8,36}/g;
    const matches = text.match(codeRegex) || [];
    const codeCandidate = matches.find((item) => item.length >= 8 && item.length <= 36);

    if (hasKeyword && codeCandidate) {
      return codeCandidate;
    }

    if (!hasKeyword) {
      const trimmed = text.trim();
      if (trimmed.length >= 8 && trimmed.length <= 36 && /^[A-Za-z0-9-]+$/.test(trimmed)) {
        return trimmed;
      }
    }

    return null;
  };

  const resolveOrderIdForUser = async (code) => {
    // If code already looks like a full ObjectId, use it directly
    if (/^[a-fA-F0-9]{24}$/.test(code)) {
      return code;
    }

    if (!user?.id || !user?.access_token) return code;

    try {
      const res = await OrderService.getOrderByUserId(user.id, user.access_token);
      const orders = Array.isArray(res?.data) ? res.data : [];
      const upperCode = (code || '').toString().toUpperCase();

      const matched = orders.find((order) => {
        const id = order?._id || '';
        const idUpper = id.toUpperCase();
        const tail8 = idUpper.slice(-8);
        const orderCode = (order?.orderCode || '').toUpperCase();

        return (
          idUpper === upperCode ||
          tail8 === upperCode ||
          orderCode === upperCode
        );
      });

      return matched?._id || code;
    } catch (err) {
      console.error('resolveOrderIdForUser error:', err);
      return code;
    }
  };

  const formatOrderStatus = (status) => {
    const map = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      shipped: 'Đã bàn giao cho đơn vị vận chuyển',
      delivered: 'Đã giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
      return_requested: 'Đang yêu cầu trả hàng',
    };
    return map[status] || status || 'Đang cập nhật';
  };

  const buildOrderSummaryMessage = (order, code) => {
    if (!order) {
      return 'Mình chưa tìm thấy thông tin đơn hàng này. Bạn kiểm tra lại mã giúp mình nhé.';
    }

    const statusText = formatOrderStatus(order.status);
    const paymentMethod = order.paymentMethod === 'paypal' ? 'PayPal' : 'COD';
    const paymentStatus = order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán';
    const shippingFee = convertPrice(order.shippingPrice || 0);
    const totalPrice = convertPrice(order.totalPrice || 0);
    const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Đang cập nhật';

    const items = (order.orderItems || [])
      .slice(0, 3)
      .map((item) => `- ${item.name || 'Sản phẩm'} x${item.amount} - ${convertPrice(item.price * item.amount)}`)
      .join('\n');

    const moreItems =
      (order.orderItems || []).length > 3 ? `... và ${order.orderItems.length - 3} sản phẩm khác` : '';

    return `Mã đơn hàng: ${code || order.orderCode || order._id}
- Trạng thái: ${statusText}
- Thanh toán: ${paymentStatus} (${paymentMethod})
- Tổng tiền: ${totalPrice}
- Phí vận chuyển: ${shippingFee}
- Ngày tạo: ${createdAt}
${items ? `\nChi tiết sản phẩm:\n${items}` : ''}${moreItems ? `\n${moreItems}` : ''}`;
  };

  const handleSendMessage = async (overrideMessage = null) => {
    const textToSend = overrideMessage !== null ? overrideMessage : inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const originalText = textToSend.trim();
    const parsedProfile = parseBodyProfile(originalText);
    if (parsedProfile.heightCm || parsedProfile.weightKg || parsedProfile.context) {
      const mergedProfile = {
        ...(savedProfile || {}),
        ...parsedProfile,
      };
      const profileText = buildProfileText(mergedProfile);
      const profilePayload = { ...mergedProfile, text: profileText };
      setSavedProfile(profilePayload);
      try {
        localStorage.setItem(profileKey, JSON.stringify(profilePayload));
      } catch (err) {
        console.error('Save profile error', err);
      }
    }

    let productSnippet = '';
    if (pendingProducts.length > 0) {
      const snippets = pendingProducts.map((item, idx) => {
        const price =
          item.price || item.finalPrice || item.discountPrice || item.originalPrice || 0;
        const priceText = price ? convertPrice(price) : '';
        const brandText = item.brand?.name || item.brand || '';
        const categoryText = item.category?.name || item.category || '';
        const link =
          item.link ||
          (item.id || item._id
            ? `${window.location.origin}/product-details/${item.id || item._id}`
            : '');
        return [
          `Sản phẩm ${pendingProducts.length > 1 ? idx + 1 : ''}`.trim() + ':',
          `- Tên: ${item.name || 'Sản phẩm'}`,
          priceText ? `- Giá: ${priceText}` : null,
          brandText ? `- Thương hiệu: ${brandText}` : null,
          categoryText ? `- Danh mục: ${categoryText}` : null,
          link ? `- Link: ${link}` : null,
        ]
          .filter(Boolean)
          .join('\n');
      });
      productSnippet = ['Thông tin sản phẩm:', ...snippets].join('\n');
    }

    const { processedText, displayLabel, didCorrect } = normalizeUserMessage(originalText);
    const finalPayload = (processedText || originalText) + (productSnippet ? `\n\n${productSnippet}` : '');
    const correctionLabel = didCorrect ? displayLabel || finalPayload : null;
    const timestamp = new Date();

    const displayAttachments = attachments.map((att) => ({
      url: att.preview || att.base64,
      name: att.name,
      type: att.type,
    }));
    const attachmentsForSend = attachments.map((att) => ({
      name: att.name,
      type: att.type,
      size: att.size,
      base64: att.base64,
    }));

    const userDisplayMessage = {
      role: 'user',
      content: originalText,
      timestamp,
      attachments: displayAttachments,
      productPreviews: pendingProducts,
    };

    const userHistoryMessage = {
      role: 'user',
      content: finalPayload,
      timestamp,
    };

    const updatedHistory = [...conversationHistory, userHistoryMessage];

    setMessages((prev) => [...prev, userDisplayMessage]);
    setConversationHistory(updatedHistory);
    setInputMessage('');
    setAttachments([]);
    setPendingProducts([]);

    const orderCode = extractOrderCode(finalPayload);
    if (orderCode) {
      if (!user?.access_token) {
        const loginMessage = {
          role: 'assistant',
          content: 'Bạn cần đăng nhập để tra cứu đơn hàng của mình nhé.',
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, loginMessage]);
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: loginMessage.content, timestamp: loginMessage.timestamp },
        ]);
        return;
      }
      setIsLoading(true);
      try {
        const resolvedOrderId = await resolveOrderIdForUser(orderCode);
        const res = await OrderService.getDetailsOrder(resolvedOrderId, user?.access_token);
        if (res?.data) {
          const assistantMessage = {
            role: 'assistant',
            content: buildOrderSummaryMessage(res.data, orderCode),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setConversationHistory((prev) => [
            ...prev,
            { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
          ]);
        } else {
          const assistantMessage = {
            role: 'assistant',
            content: 'Mình chưa tìm thấy thông tin đơn hàng này. Bạn kiểm tra lại mã giúp mình nhé.',
            timestamp: new Date(),
            isError: true,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setConversationHistory((prev) => [
            ...prev,
            { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
          ]);
        }
      } catch (error) {
        const assistantMessage = {
          role: 'assistant',
          content:
            'Hiện tại mình chưa tra cứu được đơn hàng này. Bạn giúp mình kiểm tra lại mã hoặc thử lại sau nhé.',
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const localAnswer = getProjectAnswer(finalPayload);
    if (localAnswer) {
      let assistantContent = localAnswer;
      if (correctionLabel) {
        assistantContent = `Mình đoán bạn đang tìm ${correctionLabel}. Dưới đây là thông tin mình có:\n\n${assistantContent}`;
      }
      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        finalPayload,
        updatedHistory,
        user?.access_token || null,
        attachmentsForSend
      );

      if (response.status === 'OK') {
        let assistantContent = response.text || response.message;
        if (correctionLabel) {
          assistantContent = `Mình đoán bạn đang tìm ${correctionLabel}. Đây là các gợi ý phù hợp:\n\n${
            assistantContent || ''
          }`;
        }

        const assistantMessage = {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          products: response.products || [],
          orders: response.orders || [],
          promotions: response.promotions || [],
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setConversationHistory((prev) => [
          ...prev,
          { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
        ]);
      } else {
        let fallbackContent =
          response.message || 'Xin lỗi, mình chưa xử lý được yêu cầu này. Bạn thử lại sau nhé.';
        if (correctionLabel) {
          fallbackContent = `Mình đoán bạn đang tìm ${correctionLabel}. Dưới đây là gợi ý mình có:\n\n${fallbackContent}`;
        }

        const errorMessage = {
          role: 'assistant',
          content: fallbackContent,
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
        if (!response.message?.includes('API key')) {
          setConversationHistory((prev) => [
            ...prev,
            { role: 'assistant', content: errorMessage.content, timestamp: errorMessage.timestamp },
          ]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      let errorContent = 'Xin lỗi, mình gặp lỗi khi gửi tin nhắn. Bạn thử lại sau nhé.';

      if (error.response?.data?.message) {
        errorContent = error.response.data.message;
      } else if (error.message) {
        errorContent = `Lỗi: ${error.message}`;
      }

      if (correctionLabel) {
        errorContent = `Mình đoán bạn đang tìm ${correctionLabel}. Dưới đây là gợi ý mình có:\n\n${errorContent}`;
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage.content, timestamp: errorMessage.timestamp },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue; // 5MB limit
      try {
        const base64 = await toDataUrl(file);
        const preview = URL.createObjectURL(file);
        next.push({
          name: file.name,
          type: file.type,
          size: file.size,
          preview,
          base64,
        });
      } catch (err) {
        console.error('read file error', err);
      }
    }
    setAttachments((prev) => [...prev, ...next].slice(0, 3));
    e.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProductClick = (product) => {
    const productId = product?.id || product?._id;
    if (productId && productId !== 'undefined' && productId !== 'null') {
      navigate(`/product-details/${productId}`);
      setIsOpen(false);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleFeedback = (index, value) => {
    setMessages((prev) =>
      prev.map((msg, i) => {
        if (i !== index) return msg;
        if (msg.feedback) return msg; // đã chọn rồi, không cho bấm lại
        return { ...msg, feedback: value, feedbackAck: true };
      })
    );

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, i) => {
          if (i !== index || !msg.feedbackAck) return msg;
          const clone = { ...msg };
          delete clone.feedbackAck;
          return clone;
        })
      );
    }, 1800);
  };

  const handleSuggestionClick = (text, autoSend = false) => {
    if (text === '__CONTACT__') {
      const contactLines = [];
      const contactButtons = [];
      if (settings?.contactPhone) {
        contactLines.push(`Hotline: ${settings.contactPhone}`);
        contactButtons.push({ label: 'Gọi Hotline', href: `tel:${settings.contactPhone.replace(/\s+/g, '')}` });
      }
      if (settings?.contactEmail) {
        contactLines.push(`Email: ${settings.contactEmail}`);
        contactButtons.push({ label: 'Gửi Email', href: `mailto:${settings.contactEmail}` });
      }
      if (settings?.contactAddress) contactLines.push(`Địa chỉ: ${settings.contactAddress}`);
      if (settings?.facebookUrl) {
        contactLines.push(`Facebook: ${settings.facebookUrl}`);
        contactButtons.push({ label: 'Facebook', href: settings.facebookUrl });
      }
      if (settings?.instagramUrl) {
        contactLines.push(`Instagram: ${settings.instagramUrl}`);
        contactButtons.push({ label: 'Instagram', href: settings.instagramUrl });
      }
      if (settings?.zaloUrl) {
        contactLines.push(`Zalo: ${settings.zaloUrl}`);
        contactButtons.push({ label: 'Zalo', href: settings.zaloUrl });
      }

      const assistantMessage = {
        role: 'assistant',
        content:
          contactLines.length > 0
            ? `Bạn có thể liên hệ trực tiếp CSKH:\n${contactLines.join('\n')}`
            : 'Hiện mình chưa có thông tin liên hệ. Bạn thử lại sau nhé.',
        timestamp: new Date(),
        contactButtons,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
      ]);
      return;
    }

    setInputMessage(text);
    inputRef.current?.focus();
    if (autoSend) {
      handleSendMessage(text);
    }
  };

  return (
    <>
      <ChatButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        {isOpen ? <CloseOutlined style={{ fontSize: '24px' }} /> : <MessageOutlined style={{ fontSize: '24px' }} />}
      </ChatButton>

      {isOpen && (
        <ChatContainer>
          <ChatWindow>
            <ChatHeader>
              <HeaderLeft>
                <HeaderAvatar>
                  <RobotFilled />
                </HeaderAvatar>
                <HeaderMeta>
                  <span className="name">CHAT WALKZY</span>
                  <span className="status">
                    
                  
                  </span>
                </HeaderMeta>
              </HeaderLeft>
              <HeaderClose onClick={() => setIsOpen(false)}>
                <CloseOutlined />
              </HeaderClose>
            </ChatHeader>

            <ChatBody>
              <SuggestionRow>
                {quickSuggestions.map((item) => (
                  <SuggestionChip key={item.label} onClick={() => handleSuggestionClick(item.payload, item.autoSend)}>
                    {item.label}
                  </SuggestionChip>
                ))}
              </SuggestionRow>

              <MessageList>
                {messages.map((message, index) => (
                  <MessageItem key={index} isUser={message.role === 'user'}>
                    <MessageAvatar isUser={message.role === 'user'}>
                      {message.role === 'user' ? <UserOutlined /> : <RobotFilled />}
                    </MessageAvatar>
                    <div style={{ flex: 1 }}>
                      <MessageContent isUser={message.role === 'user'} isError={message.isError}>
                        {(message.content || '').split('\n').map((line, i, arr) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < arr.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </MessageContent>

                      {message.attachments && message.attachments.length > 0 && (
                        <AttachmentBar>
                          {message.attachments.map((att, idx) => (
                            <AttachmentThumb key={`${att.url}-${idx}`}>
                              <img src={att.url} alt={att.name || `attachment-${idx + 1}`} />
                            </AttachmentThumb>
                          ))}
                      </AttachmentBar>
                    )}

                      {message.promotions && message.promotions.length > 0 && (
                        <PromotionList>
                          {message.promotions.map((promo, promoIdx) => {
                            const endDate = promo.endDate ? new Date(promo.endDate) : null;
                            const discountText =
                              promo.type === 'percentage'
                                ? `Giảm ${promo.value}%`
                                : `Giảm ${convertPrice(promo.value || 0)}`;

                            return (
                              <PromotionCard key={`${promo.code || promo.name}-${promoIdx}`}>
                                <div className="promotion-header">
                                  <h4 className="promotion-title">{promo.name}</h4>
                                  {promo.code && <div className="promotion-code">{promo.code}</div>}
                                </div>
                                <div className="promotion-details">
                                  <div className="promotion-discount">Ưu đãi: {discountText}</div>
                                  {promo.description && <div className="promotion-description">Mô tả: {promo.description}</div>}
                                  {promo.minPurchase > 0 && (
                                    <div className="promotion-condition">
                                      Áp dụng cho đơn từ {convertPrice(promo.minPurchase)}
                                    </div>
                                  )}
                                  {endDate && <div className="promotion-expiry">Hết hạn: {endDate.toLocaleDateString('vi-VN')}</div>}
                                </div>
                              </PromotionCard>
                            );
                          })}
                        </PromotionList>
                      )}

                      {message.productPreviews && message.productPreviews.length > 0 && (
                        <>
                          {message.productPreviews.map((p, idx) => (
                            <InlineProductCard key={(p.id || p._id || p.name || 'p') + idx}>
                              <div className="thumb">
                                <img
                                  src={p.image || p.images?.[0] || getPlaceholderImage(80, 80, 'No Image')}
                                  alt={p.name || 'Sản phẩm'}
                                />
                              </div>
                              <div className="meta">
                                <div className="name">{p.name || 'Sản phẩm'}</div>
                                {p.price && <div className="price">{convertPrice(p.price)}</div>}
                              </div>
                            </InlineProductCard>
                          ))}
                        </>
                      )}

                      {message.products && message.products.length > 0 && (
                        <ProductGrid single={message.products.length === 1}>
                          {message.products.map((product) => {
                            const finalPrice = product.price;
                            let originalPrice = product.originalPrice;
                            if (!originalPrice && product.discount > 0 && product.price > 0) {
                              originalPrice = Math.round(product.price / (1 - (product.discount || 0) / 100));
                            }
                            const productImage =
                              product.image || (product.images && product.images[0]) || getPlaceholderImage(150, 150, 'No Image');
                            const productId = product.id || product._id;

                            return (
                              <ProductCard key={productId} onClick={() => handleProductClick(product)} title={product.name}>
                                <div className="product-image-wrapper">
                                  <img
                                    src={productImage}
                                    alt={product.name || 'Sản phẩm'}
                                    onError={(e) => {
                                      e.target.src = getPlaceholderImage(150, 150, 'No Image');
                                    }}
                                  />
                                </div>
                                <div className="product-info">
                                  <div className="product-name" title={product.name}>
                                    {product.name || 'Sản phẩm'}
                                  </div>
                                  <div className="product-price">
                                    {originalPrice && originalPrice > finalPrice && (
                                      <span className="original-price">{convertPrice(originalPrice)}</span>
                                    )}
                                    <span className="current-price">{convertPrice(finalPrice)}</span>
                                  </div>
                                  {product.rating > 0 && (
                                    <div className="product-rating">Đánh giá {product.rating.toFixed(1)}</div>
                                  )}
                                </div>
                              </ProductCard>
                            );
                          })}
                        </ProductGrid>
                      )}

                      <MessageTime isUser={message.role === 'user'}>{formatTime(message.timestamp)}</MessageTime>
                      {message.contactButtons && message.contactButtons.length > 0 && (
                        <ContactButtons>
                          {message.contactButtons.map((btn, idx) => (
                            <a key={`${btn.href}-${idx}`} href={btn.href} target="_blank" rel="noopener noreferrer">
                              {btn.label}
                            </a>
                          ))}
                        </ContactButtons>
                      )}
                      {message.role === 'assistant' && (
                        <FeedbackBar>
                          <button
                            type="button"
                            className={message.feedback === 'up' ? 'active' : ''}
                            disabled={!!message.feedback}
                            onClick={() => handleFeedback(index, 'up')}
                          >
                            Hài lòng
                          </button>
                          <button
                            type="button"
                            className={message.feedback === 'down' ? 'active' : ''}
                            disabled={!!message.feedback}
                            onClick={() => handleFeedback(index, 'down')}
                          >
                            Chưa ổn
                          </button>
                          {message.feedbackAck && <span className="thanks">Cảm ơn bạn đã phản hồi</span>}
                        </FeedbackBar>
                      )}
                    </div>
                  </MessageItem>
                ))}

                {isLoading && (
                  <MessageItem isUser={false}>
                    <MessageAvatar>
                      <RobotFilled />
                    </MessageAvatar>
                    <LoadingDots>
                      <span></span>
                      <span></span>
                      <span></span>
                    </LoadingDots>
                  </MessageItem>
                )}
                <div ref={messagesEndRef} />
              </MessageList>
            </ChatBody>

            <ChatFooter>
              {pendingProducts.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                  {pendingProducts.map((p, idx) => (
                    <InlineProductCard key={(p.id || p._id || p.name || 'p') + idx}>
                      <div className="thumb">
                        <img
                          src={p.image || p.images?.[0] || getPlaceholderImage(80, 80, 'No Image')}
                          alt={p.name || 'Sản phẩm'}
                        />
                      </div>
                      <div className="meta">
                        <div className="name">{p.name || 'Sản phẩm'}</div>
                        {p.price && <div className="price">{convertPrice(p.price)}</div>}
                        <button
                          className="remove-btn"
                          type="button"
                          onClick={() =>
                            setPendingProducts((prev) => prev.filter((_, removeIdx) => removeIdx !== idx))
                          }
                        >
                          Bỏ đính kèm
                        </button>
                      </div>
                    </InlineProductCard>
                  ))}
                </div>
              )}
              <input
                id="chat-attachment-input"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {attachments.length > 0 && (
                <AttachmentBar>
                  {attachments.map((att, idx) => (
                    <AttachmentThumb key={`${att.name}-${idx}`}>
                      <img src={att.preview || att.base64} alt={att.name} />
                      <button className="remove" onClick={() => handleRemoveAttachment(idx)} type="button">
                        <DeleteOutlined />
                      </button>
                    </AttachmentThumb>
                  ))}
                </AttachmentBar>
              )}

              <InputContainer>
                <button
                  type="button"
                  onClick={() => document.getElementById('chat-attachment-input')?.click()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: '1px solid #bae6fd',
                    background: 'linear-gradient(135deg, #e0f2fe, #f8fbff)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: '#0ea5e9',
                    boxShadow: '0 8px 16px rgba(14,165,233,0.15)',
                  }}
                  aria-label="Đính kèm ảnh"
                >
                  <CloudUploadOutlined />
                </button>

                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                  disabled={isLoading}
                />
                <SendButton
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Gửi tin nhắn"
                >
                  <SendOutlined />
                </SendButton>
              </InputContainer>
             
            </ChatFooter>
          </ChatWindow>
        </ChatContainer>
      )}
    </>
  );
};

export default ChatBox;
