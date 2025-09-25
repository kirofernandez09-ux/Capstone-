// This is a simulation. In a real app, this would be a Mongoose model.
let contentStore = {
    mission: { title: 'Our Mission', content: 'To provide exceptional travel experiences...' },
    vision: { title: 'Our Vision', content: 'To be the leading travel and transportation company...' },
    about: { title: 'About Us', content: 'DoRayd Travel & Tours was founded with a passion...' },
    terms: { title: 'Terms and Conditions', content: 'All bookings must be confirmed...' },
    privacy: { title: 'Privacy Policy', content: 'We are committed to protecting your privacy...' },
    contact: { title: 'Contact Information', content: 'HEAD OFFICE...' }
};

export const getContentByType = (req, res) => {
  const { type } = req.params;
  const content = contentStore[type];
  if (!content) {
    return res.status(404).json({ success: false, message: 'Content not found' });
  }
  res.json({ success: true, data: content });
};

export const updateContent = (req, res) => {
  const { type } = req.params;
  const { title, content } = req.body;
  if (!contentStore[type]) {
    return res.status(404).json({ success: false, message: 'Content type not found' });
  }
  contentStore[type] = {
    title: title || contentStore[type].title,
    content: content || contentStore[type].content,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, message: 'Content updated successfully', data: contentStore[type] });
};