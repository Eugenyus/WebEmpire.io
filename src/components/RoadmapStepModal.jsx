import React, { useState, useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { supabase } from '../config/supabase';

export default function RoadmapStepModal({ isOpen, onClose, onSave, loading, editData = null }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '', // Initialize with empty string
    videoLinks: [],
    quizItems: []
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Fetch quiz items for this roadmap task
        const fetchItems = async () => {
          const { data: quizItems } = await supabase
            .from('quiz_to_roadmap')
            .select('*')
            .eq('roadmap_id', editData.id)
            .order('order_index');

          const newFormData = {
            title: editData.title || '',
            description: editData.description || '', // Ensure description is never null
            videoLinks: editData.video_links || [],
            quizItems: quizItems?.map(item => ({
              id: item.id,
              shortcode: item.shortcode,
              question: item.question || '',
              options: item.options || ['', ''],
              correctAnswers: item.correct_answers || [],
              explanation: item.explanation || ''
            })) || []
          };

          setFormData(newFormData);
          setEditorReady(true);
        };

        fetchItems();
      } else {
        // Reset form for new entry
        setFormData({
          title: '',
          description: '', // Initialize with empty string
          videoLinks: [],
          quizItems: []
        });
        setEditorReady(true);
      }
      setActiveTab('basic');
      setErrors({});
    }
  }, [isOpen, editData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate quiz items
    const quizErrors = [];
    formData.quizItems?.forEach((item, index) => {
      const itemErrors = {};
      if (!item.question?.trim()) {
        itemErrors.question = 'Question is required';
      }
      const validOptions = (item.options || []).filter(opt => opt?.trim());
      if (validOptions.length < 2) {
        itemErrors.options = 'At least 2 options are required';
      }
      if (item.correctAnswers?.length === 0) {
        itemErrors.correctAnswers = 'At least one correct answer is required';
      }
      if (Object.keys(itemErrors).length > 0) {
        quizErrors[index] = itemErrors;
      }
    });
    if (quizErrors.length > 0) {
      newErrors.quizItems = quizErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving step:', err.message);
      setErrors({ submit: err.message });
    }
  };

  const handleAddVideoLink = () => {
    setFormData(prev => ({
      ...prev,
      videoLinks: [...prev.videoLinks, { url: '' }]
    }));
  };

  const handleRemoveVideoLink = (index) => {
    setFormData(prev => ({
      ...prev,
      videoLinks: prev.videoLinks.filter((_, i) => i !== index)
    }));
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  const handleVideoLinkChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      videoLinks: prev.videoLinks.map((link, i) => 
        i === index ? { ...link, url: value } : link
      )
    }));
  };

  const handleAddQuizItem = () => {
    setFormData(prev => ({
      ...prev,
      quizItems: [...(prev.quizItems || []), {
        question: '',
        options: ['', ''],
        correctAnswers: [],
        explanation: ''
      }]
    }));
  };

  const handleRemoveQuizItem = (index) => {
    setFormData(prev => ({
      ...prev,
      quizItems: (prev.quizItems || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddOption = (quizIndex) => {
    setFormData(prev => ({
      ...prev,
      quizItems: (prev.quizItems || []).map((item, i) => {
        if (i === quizIndex) {
          return {
            ...item,
            options: [...(item.options || []), '']
          };
        }
        return item;
      })
    }));
  };

  const handleRemoveOption = (quizIndex, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      quizItems: (prev.quizItems || []).map((item, i) => {
        if (i === quizIndex) {
          const newOptions = (item.options || []).filter((_, j) => j !== optionIndex);
          const newCorrectAnswers = (item.correctAnswers || [])
            .filter(ansIndex => ansIndex !== optionIndex)
            .map(ansIndex => ansIndex > optionIndex ? ansIndex - 1 : ansIndex);
          
          return {
            ...item,
            options: newOptions,
            correctAnswers: newCorrectAnswers
          };
        }
        return item;
      })
    }));
  };

  const handleQuizItemChange = (index, field, value, optionIndex = null) => {
    setFormData(prev => ({
      ...prev,
      quizItems: (prev.quizItems || []).map((item, i) => {
        if (i !== index) return item;
        if (field === 'options') {
          const newOptions = [...(item.options || [])];
          newOptions[optionIndex] = value;
          return { ...item, options: newOptions };
        }
        return { ...item, [field]: value };
      })
    }));
  };

  const handleCorrectAnswerToggle = (quizIndex, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      quizItems: (prev.quizItems || []).map((item, i) => {
        if (i !== quizIndex) return item;
        
        const correctAnswers = item.correctAnswers || [];
        const newCorrectAnswers = correctAnswers.includes(optionIndex)
          ? correctAnswers.filter(i => i !== optionIndex)
          : [...correctAnswers, optionIndex];
        
        return {
          ...item,
          correctAnswers: newCorrectAnswers
        };
      })
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-[75%] w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Remove Video Link</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this video link? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteIndex(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveVideoLink(deleteIndex)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{editData ? 'Edit Step' : 'Add New Step'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-[#1a1b2e] text-[#1a1b2e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'video'
                  ? 'border-[#1a1b2e] text-[#1a1b2e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('video')}
            >
              Video Embed
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quiz'
                  ? 'border-[#1a1b2e] text-[#1a1b2e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('quiz')}
            >
              Quiz
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Tab */}
          <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e] ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className={errors.description ? 'error' : ''}>
                  {editorReady && (
                    <CKEditor
                      editor={ClassicEditor}
                      data={formData.description}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setFormData(prev => ({ ...prev, description: data }));
                      }}
                      config={{
                        toolbar: ['heading', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'insertTable', 'table', '|', 'undo', 'redo'],
                        table: {
                          contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                        }
                      }}
                    />
                  )}
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Video Embed Tab */}
          <div className={activeTab === 'video' ? 'block' : 'hidden'}>
            <div className="space-y-4">
              {formData.videoLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleVideoLinkChange(index, e.target.value)}
                    placeholder="Enter video embed link"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  />
                  {link.shortcode && (
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                      {`[video:${link.shortcode}]`}
                    </code>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteIndex(index);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddVideoLink}
                className="text-[#1a1b2e] hover:text-opacity-80 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Another Video</span>
              </button>
            </div>
          </div>

          {/* Quiz Tab */}
          <div className={activeTab === 'quiz' ? 'block' : 'hidden'}>
            <div className="space-y-8">
              {formData.quizItems.map((quizItem, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                    {quizItem.shortcode && (
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                        {`[quiz:${quizItem.shortcode}]`}
                      </code>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveQuizItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={quizItem.question}
                        onChange={(e) => handleQuizItemChange(index, 'question', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e] ${
                          errors.quizItems?.[index]?.question ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your question"
                      />
                      {errors.quizItems?.[index]?.question && (
                        <p className="mt-1 text-sm text-red-500">{errors.quizItems[index].question}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddOption(index)}
                          className="text-[#1a1b2e] hover:text-opacity-80 text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Option</span>
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(quizItem.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(quizItem.correctAnswers || []).includes(optIndex)}
                              onChange={() => handleCorrectAnswerToggle(index, optIndex)}
                              className="w-4 h-4 text-[#1a1b2e] focus:ring-[#1a1b2e] rounded"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleQuizItemChange(index, 'options', e.target.value, optIndex)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                            />
                            {(quizItem.options || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index, optIndex)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {errors.quizItems?.[index]?.options && (
                        <p className="mt-1 text-sm text-red-500">{errors.quizItems[index].options}</p>
                      )}
                      {errors.quizItems?.[index]?.correctAnswers && (
                        <p className="mt-1 text-sm text-red-500">{errors.quizItems[index].correctAnswers}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        Check the boxes next to the correct answers. Multiple correct answers are allowed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Explanation
                      </label>
                      <textarea
                        value={quizItem.explanation}
                        onChange={(e) => handleQuizItemChange(index, 'explanation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                        rows={2}
                        placeholder="Explain why these answers are correct"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuizItem}
                className="text-[#1a1b2e] hover:text-opacity-80 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Question</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editData ? 'Update Step' : 'Save Step')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}