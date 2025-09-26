import Message from '../models/Message.js';
import EmailService from '../utils/emailServices.js';

export const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createMessage = async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();
    
    const io = req.app.get('io');
    io.emit('new-message', message);
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const replyToMessage = async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    message.replies.push({ message: replyMessage, repliedBy: req.user.id });
    message.status = 'replied';
    await message.save();
    
    await EmailService.sendContactReply(message, replyMessage);
    
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};