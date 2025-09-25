import React, { useState, useEffect, useCallback } from 'react';
import { Save, Edit3, FileText, Shield, Phone } from 'lucide-react';
import DataService from '../../components/services/DataService';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState({ title: '', content: '' });

  const contentTabs = [
    { key: 'about', label: 'About Us', icon: FileText },
    { key: 'terms', label: 'Terms & Conditions', icon: Shield },
    { key: 'privacy', label: 'Privacy Policy', icon: Shield },
    { key: 'contact', label: 'Contact Info', icon: Phone }
  ];

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setEditMode(false);
    try {
      const response = await DataService.fetchContent(activeTab);
      setContent(response);
    } catch (error) {
      console.error(`Failed to fetch ${activeTab} content:`, error);
      setContent({ title: `Default ${activeTab} Title`, content: 'Could not load content.' });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await DataService.updateContent(activeTab, content);
      setEditMode(false);
    } catch (error) {
      console.error("Failed to save content:", error);
      alert("Error saving content.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Content Management</h2>
            <div>
            {editMode ? (
                <>
                <button onClick={() => { setEditMode(false); fetchContent(); }} className="bg-gray-200 px-4 py-2 rounded-lg mr-2">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                    {saving ? 'Saving...' : <><Save size={16} className="mr-2"/> Save</>}
                </button>
                </>
            ) : (
                <button onClick={() => setEditMode(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                    <Edit3 size={16} className="mr-2"/> Edit Content
                </button>
            )}
            </div>
      </div>

      <div className="flex border-b">
        {contentTabs.map(tab => (
            <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 ${activeTab === tab.key ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {loading ? <p>Loading content...</p> : (
            <div className="space-y-4">
                <div>
                    <label className="font-bold">Title</label>
                    {editMode ? (
                        <input
                            type="text"
                            value={content.title}
                            onChange={(e) => setContent({...content, title: e.target.value})}
                            className="w-full p-2 border rounded mt-1"
                        />
                    ) : (
                        <p className="p-2 bg-gray-100 rounded mt-1">{content.title}</p>
                    )}
                </div>
                 <div>
                    <label className="font-bold">Content</label>
                    {editMode ? (
                        <textarea
                            value={content.content}
                            onChange={(e) => setContent({...content, content: e.target.value})}
                            rows="15"
                            className="w-full p-2 border rounded mt-1"
                        />
                    ) : (
                        <div className="p-4 bg-gray-100 rounded mt-1 whitespace-pre-wrap">{content.content}</div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;