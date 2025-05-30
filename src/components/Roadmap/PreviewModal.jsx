import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../config/supabase';

export default function PreviewModal({ isOpen, onClose, task }) {
  const modalRef = useRef(null);
  const [quizItems, setQuizItems] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && task?.id) {
      fetchItems();
    }
  }, [isOpen, task?.id]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quiz items
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_to_roadmap')
        .select('*')
        .eq('roadmap_id', task.id)
        .order('order_index');

      if (quizError) throw quizError;

      // Fetch checklist items
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklist_to_roadmap')
        .select('*')
        .eq('roadmap_id', task.id)
        .order('order_index');

      if (checklistError) throw checklistError;

      setQuizItems(quizData || []);
      setChecklistItems(checklistData || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVideoEmbedUrl = (url) => {
    try {
      const videoUrl = new URL(url);
      
      // YouTube
      if (videoUrl.hostname.includes('youtube.com') || videoUrl.hostname.includes('youtu.be')) {
        let videoId = '';
        if (videoUrl.hostname.includes('youtu.be')) {
          videoId = videoUrl.pathname.slice(1);
        } else {
          videoId = videoUrl.searchParams.get('v');
        }
        return `https://www.youtube.com/embed/${videoId}`;
      }
      
      // Vimeo
      if (videoUrl.hostname.includes('vimeo.com')) {
        const videoId = videoUrl.pathname.slice(1);
        return `https://player.vimeo.com/video/${videoId}`;
      }
      
      // Return null if the URL is not supported
      return null;
    } catch (err) {
      console.error('Invalid video URL:', err);
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: task.description }} />

        {/* Videos */}
        {task.video_links?.length > 0 && (
          <div className="mt-8 space-y-6">
            {task.video_links.map((video, index) => {
              const embedUrl = getVideoEmbedUrl(video.url);
              if (embedUrl) {
                return (
                  <div key={index} className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={embedUrl}
                      title={`Video ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-[400px] rounded-lg"
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Quiz Section */}
        {quizItems.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Knowledge Check</h3>
            <div className="space-y-6">
              {quizItems.map((quiz, index) => (
                <div key={quiz.id} className="bg-gray-50 p-6 rounded-lg">
                  <p className="font-medium mb-4">{quiz.question}</p>
                  <div className="space-y-2">
                    {quiz.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`
                          p-3 rounded-lg bg-white border border-gray-200
                          ${quiz.correct_answers.includes(optIndex) ? 'border-green-500' : ''}
                        `}
                      >
                        {option}
                        {quiz.correct_answers.includes(optIndex) && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {quiz.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg">
                      <p className="font-medium mb-1">Explanation:</p>
                      {quiz.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Section */}
        {checklistItems.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Requirements Checklist</h3>
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-sm" />
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B46FE]"></div>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-lg">
            Failed to load quiz and checklist items: {error}
          </div>
        )}
      </div>
    </div>
  );
}