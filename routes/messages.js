import express from 'express';
import Message from '../models/Message.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private (Admin/Employee)
router.get('/', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find(query)
      .populate('assignedTo', 'name email')
      .populate('replies.repliedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

    console.log(`📧 Messages fetched: ${messages.length}/${total} for ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private (Admin/Employee)
router.get('/:id', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('replies.repliedBy', 'name email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark as read if it's new
    if (message.status === 'new') {
      message.status = 'read';
      await message.save();
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message'
    });
  }
});

// @desc    Create new message (contact form)
// @route   POST /api/messages
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, category = 'general' } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    const newMessage = await Message.create({
      name,
      email,
      phone,
      subject,
      message,
      category
    });

    // Emit socket event for real-time notifications
    const io = req.app.get('io');
    io.emit('new-message', {
      messageId: newMessage._id,
      name: newMessage.name,
      email: newMessage.email,
      subject: newMessage.subject,
      category: newMessage.category,
      createdAt: newMessage.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon!',
      data: newMessage
    });

    console.log(`📧 New message received from ${name} (${email}) at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// @desc    Reply to message
// @route   POST /api/messages/:id/reply
// @access  Private (Admin/Employee)
router.post('/:id/reply', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const messageDoc = await Message.findById(req.params.id);

    if (!messageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Add reply
    messageDoc.replies.push({
      message,
      repliedBy: req.user._id
    });

    // Update status
    messageDoc.status = 'replied';

    // Assign to current user if not assigned
    if (!messageDoc.assignedTo) {
      messageDoc.assignedTo = req.user._id;
    }

    await messageDoc.save();
    await messageDoc.populate('replies.repliedBy', 'name email');

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: messageDoc
    });

    console.log(`✅ Message reply sent by ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
});

// @desc    Update message status
// @route   PUT /api/messages/:id/status
// @access  Private (Admin/Employee)
router.put('/:id/status', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'replied', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message status updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    });
  }
});

// @desc    Assign message to employee
// @route   PUT /api/messages/:id/assign
// @access  Private (Admin only)
router.put('/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const { employeeId } = req.body;

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { assignedTo: employeeId },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message assigned successfully',
      data: message
    });
  } catch (error) {
    console.error('Error assigning message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign message'
    });
  }
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

    console.log(`🗑️ Message deleted by ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// @desc    Get message statistics
// @route   GET /api/messages/stats/overview
// @access  Private (Admin/Employee)
router.get('/stats/overview', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ status: { $in: ['new', 'read'] } });
    const pendingMessages = await Message.countDocuments({ status: { $in: ['new', 'read', 'replied'] } });

    const statusBreakdown = await Message.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryBreakdown = await Message.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalMessages,
        unreadMessages,
        pendingMessages,
        statusBreakdown,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message statistics'
    });
  }
});

export default router;