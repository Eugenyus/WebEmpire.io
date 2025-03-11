import React, { useState, useEffect, useRef } from 'react';
import ChecklistModule from './ChecklistModule';
import AddToCalendarModal from './AddToCalendarModal';
import { supabase } from '../../config/supabase';

export default function RoadmapStep({ 
  id,
  title, 
  description, 
  status = 'not_started', 
  onStatusChange, 
  isExpanded, 
  onToggle, 
  isFirst, 
  isLast,
  video_links = [],
  onNext,
  dashboardId,
  profileId,
  stepNumber
}) {
  const [quizItems, setQuizItems] = useState([]);
  const [quizProgress, setQuizProgress] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const quizErrorRef = useRef(null);

  React.useEffect(() => {
    if (isExpanded) {
      fetchQuizItems();
    }
  }, [isExpanded]);

  React.useEffect(() => {
    if (quizResults && !quizResults.allCorrect && quizErrorRef.current) {
      quizErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [quizResults]);

  React.useEffect(() => {
    if (quizResults?.allCorrect && status !== 'completed') {
      onStatusChange('completed');
    }
  }, [quizResults, status, onStatusChange]);

  const fetchQuizItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: items, error: itemsError } = await supabase
        .from('quiz_to_roadmap')
        .select('*')
        .eq('roadmap_id', id)
        .order('order_index');

      if (itemsError) throw itemsError;

      const { data: progress, error: progressError } = await supabase
        .from('quiz_progress')
        .select('*')
        .eq('profile_id', profileId)
        .eq('dashboard_id', dashboardId)
        .in('quiz_id', items?.map(item => item.id) || []);

      if (progressError) throw progressError;

      setQuizItems(items || []);
      
      const progressMap = (progress || []).reduce((acc, curr) => {
        acc[curr.quiz_id] = curr;
        return acc;
      }, {});
      setQuizProgress(progressMap);

      if (progress?.length > 0) {
        const results = items.map(quiz => {
          const quizProgress = progressMap[quiz.id];
          return {
            quizId: quiz.id,
            isCorrect: quizProgress?.is_correct || false,
            question: quiz.question,
            selectedAnswers: quizProgress?.selected_answers || [],
            correctAnswers: quiz.correct_answers || []
          };
        });

        const allCorrect = results.every(r => r.isCorrect);
        setQuizResults({ results, allCorrect });

        if (!allCorrect) {
          setSelectedAnswers({});
          setQuizProgress({});
        }
      }
    } catch (err) {
      console.error('Error fetching quiz items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (quizId, answerIndex) => {
    setSelectedAnswers(prev => {
      const currentAnswers = prev[quizId] || [];
      const newAnswers = currentAnswers.includes(answerIndex)
        ? currentAnswers.filter(a => a !== answerIndex)
        : [...currentAnswers, answerIndex];
      return {
        ...prev,
        [quizId]: newAnswers
      };
    });
  };

  const validateAnswers = () => {
    return quizItems.every(quiz => {
      const answers = selectedAnswers[quiz.id] || [];
      return answers.length > 0;
    });
  };

  const checkAnswers = () => {
    const results = quizItems.map(quiz => {
      const selectedAns = selectedAnswers[quiz.id] || [];
      const correctAns = quiz.correct_answers || [];
      
      const isCorrect = selectedAns.length === correctAns.length && 
        selectedAns.every(ans => correctAns.includes(ans)) &&
        correctAns.every(ans => selectedAns.includes(ans));

      return {
        quizId: quiz.id,
        isCorrect,
        question: quiz.question,
        selectedAnswers: selectedAns,
        correctAnswers: correctAns
      };
    });

    const allCorrect = results.every(r => r.isCorrect);
    return { results, allCorrect };
  };

  const handleSendToReview = async () => {
    if (!validateAnswers()) {
      setShowWarningModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { results, allCorrect } = checkAnswers();
      setQuizResults({ results, allCorrect });

      const quizIds = quizItems.map(quiz => quiz.id);
      
      await Promise.all(
        quizIds.map(async (quizId) => {
          const result = results.find(r => r.quizId === quizId);
          const { error } = await supabase
            .from('quiz_progress')
            .upsert({
              quiz_id: quizId,
              profile_id: profileId,
              dashboard_id: dashboardId,
              selected_answers: result.selectedAnswers,
              is_correct: result.isCorrect
            }, {
              onConflict: 'quiz_id,profile_id,dashboard_id'
            });

          if (error) throw error;
        })
      );

      if (!allCorrect) {
        setSelectedAnswers({});
        setQuizProgress({});
      } else {
        const newProgress = quizIds.reduce((acc, quizId) => {
          const result = results.find(r => r.quizId === quizId);
          acc[quizId] = {
            quiz_id: quizId,
            selected_answers: result.selectedAnswers,
            is_correct: result.isCorrect
          };
          return acc;
        }, {});

        setQuizProgress(prev => ({
          ...prev,
          ...newProgress
        }));
      }
    } catch (err) {
      console.error('Error sending quiz for review:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'skipped':
        return 'bg-[#e1f5fd] text-[#5bc0de]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'skipped':
        return 'Skipped';
      default:
        return 'Not Started';
    }
  };

  const statusOptions = [
    { value: 'not_started', label: 'Not Started', color: 'text-gray-800 bg-gray-100' },
    { value: 'in_progress', label: 'In Progress', color: 'text-yellow-800 bg-yellow-100' },
    { value: 'completed', label: 'Completed', color: 'text-green-800 bg-green-100' },
    { value: 'skipped', label: 'Skipped', color: 'text-[#5bc0de] bg-[#e1f5fd]' }
  ];

  const handleChecklistComplete = () => {
    if (status !== 'completed') {
      onStatusChange('completed');
    }
  };

  const handleActionButton = () => {
    if (status === 'not_started') {
      onStatusChange('in_progress');
    } else if (status === 'in_progress') {
      onStatusChange('completed');
    }
  };

  const getActionButtonLabel = () => {
    if (status === 'not_started') {
      return 'Put in Progress';
    } else if (status === 'in_progress') {
      return 'Complete this step';
    }
    return '';
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

  return (
    <>
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Warning</h3>
            <p className="text-gray-600 mb-6">
              Please select at least one answer for each question before sending for review.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-[#6B46FE] text-white rounded-lg hover:bg-opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <AddToCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        stepTitle={title}
        dashboardId={dashboardId}
        profileId={profileId}
      />

      <div className="relative pl-8">
        <div 
          className={`absolute left-[11px] w-[2px] bg-[#e0e2e7] ${
            isFirst && isLast ? 'top-2 bottom-2' : 
            isFirst ? 'top-2 bottom-0' : 
            isLast ? 'top-0 bottom-2' : 
            'top-0 bottom-0'
          }`} 
        />
        
        <div className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          status === 'completed' ? 'border-green-500 bg-green-500' : 'border-[#6B46FE] bg-white'
        } z-10`}>
          {status === 'completed' && (
            <svg 
              className="w-4 h-4 text-white" 
              viewBox="0 0 20 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                fill="currentColor"
              />
            </svg>
          )}
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 mb-1">
          <div className={`flex items-center justify-between ${isExpanded ? 'p-6' : 'p-3'}`}>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <>
                    <select
                      value={status}
                      onChange={(e) => onStatusChange(e.target.value)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium border-0
                        ${getStatusStyles(status)}
                        focus:outline-none focus:ring-2 focus:ring-[#6B46FE] focus:ring-opacity-50
                      `}
                    >
                      {statusOptions.map(option => (
                        <option 
                          key={option.value} 
                          value={option.value}
                          className={`${option.color} !important`}
                          style={{ backgroundColor: option.value === 'not_started' ? '#f3f4f6' : 
                                  option.value === 'in_progress' ? '#fef3c7' :
                                  option.value === 'completed' ? '#d1fae5' :
                                  '#e1f5fd',
                                  color: option.value === 'not_started' ? '#1f2937' :
                                        option.value === 'in_progress' ? '#92400e' :
                                        option.value === 'completed' ? '#065f46' :
                                        '#5bc0de' }}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCalendarModal(true)}
                      className="text-[#6B46FE] hover:text-opacity-80 text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Add to Calendar</span>
                    </button>
                  </>
                ) : (
                  <div 
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${getStatusStyles(status)}
                    `}
                  >
                    {getStatusLabel(status)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isExpanded && (
                <div className="flex items-center gap-2 text-gray-400">
                  {video_links?.length > 0 && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {quizItems?.length > 0 && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
              )}
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2 flex-shrink-0"
                onClick={onToggle}
              >
                <svg 
                  className={`w-6 h-6 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-0' : 'rotate-180'}`} 
                  viewBox="0 0 24 24" 
                  fill="none"
                >
                  <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="px-6 pb-6">
              <div 
                className="prose max-w-none text-gray-600 mb-4 whitespace-pre-wrap" 
                dangerouslySetInnerHTML={{ __html: description }} 
              />
              
              <div className="space-y-6">
                {video_links?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Video Resources</h4>
                    <div className="space-y-4">
                      {video_links.map((video, index) => {
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
                        } else {
                          return (
                            <a
                              key={index}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:text-blue-800"
                            >
                              Video {index + 1} (External Link)
                            </a>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B46FE]"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                    <p className="font-medium">Error loading quiz</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                      onClick={fetchQuizItems}
                      className="mt-2 text-sm bg-red-100 px-3 py-1 rounded-md hover:bg-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                ) : quizItems.length > 0 && (
                  <div>
                    {quizResults && (
                      <>
                        {quizResults.allCorrect ? (
                          <div className="h-24 mb-6 flex items-center justify-center">
                            <div className="bg-green-100 text-green-800 p-4 rounded-lg shadow-lg text-center flex items-center gap-3">
                              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <h3 className="font-bold">Quiz Passed Successfully!</h3>
                                <p className="text-sm">All questions answered correctly</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div ref={quizErrorRef} className="bg-red-50 p-4 rounded-lg mb-6">
                            <h3 className="text-red-800 font-semibold mb-2">Quiz Not Passed</h3>
                            <p className="text-red-600 mb-4">Please review the following questions:</p>
                            <ul className="list-disc list-inside space-y-2">
                              {quizResults.results.filter(r => !r.isCorrect).map((result, index) => (
                                <li key={index} className="text-red-700">
                                  {result.question}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    <div className={quizResults?.allCorrect ? 'hidden' : ''}>
                      <h4 className="font-medium text-gray-900 mb-4">Knowledge Check</h4>
                      <div className="space-y-6">
                        {quizItems.map((quiz) => {
                          const progress = quizProgress[quiz.id];
                          const isAnswered = !!progress;
                          const selectedAnswersList = selectedAnswers[quiz.id] || [];
                          
                          return (
                            <div 
                              key={quiz.id} 
                              className="bg-[#e2e6f7] p-4 rounded-[10px] border border-[#99a4c7] shadow-[0px_0px_9px_#ccc]"
                            >
                              <p className="font-medium mb-4">{quiz.question}</p>
                              <div className="space-y-2">
                                {quiz.options.map((option, index) => (
                                  <label
                                    key={index}
                                    className={`
                                      flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-white border border-[#99a4c7]
                                      ${isAnswered ? 'cursor-not-allowed' : 'hover:bg-gray-50'}
                                      ${isAnswered && progress.selected_answers?.includes(index)
                                        ? progress.is_correct
                                          ? 'bg-green-100 border-green-300'
                                          : 'bg-red-100 border-red-300'
                                        : ''}
                                      ${!isAnswered && selectedAnswersList.includes(index) ? 'ring-2 ring-[#6B46FE]' : ''}
                                    `}
                                  >
                                    <input
                                      type="checkbox"
                                      value={index}
                                      checked={selectedAnswersList.includes(index)}
                                      onChange={() => handleAnswerSelect(quiz.id, index)}
                                      disabled={isAnswered}
                                      className="w-4 h-4 text-[#6B46FE] focus:ring-[#6B46FE] rounded"
                                    />
                                    <span className="flex-1">{option}</span>
                                    {isAnswered && progress.selected_answers?.includes(index) && (
                                      <span className={progress.is_correct ? 'text-green-600' : 'text-red-600'}>
                                        {progress.is_correct ? '✓' : '✗'}
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                              {isAnswered && quiz.explanation && (
                                <div className={`mt-4 p-4 rounded-lg ${
                                  progress.is_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                  {quiz.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {quizItems.length > 0 && !quizResults?.allCorrect && (
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={handleSendToReview}
                            className="px-4 py-2 bg-[#6B46FE] text-white rounded-lg hover:bg-opacity-90"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Sending...' : 'Send to Review'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <ChecklistModule 
                  roadmapId={id}
                  dashboardId={dashboardId}
                  profileId={profileId}
                  onAllCompleted={handleChecklistComplete}
                />

                {/* Action Buttons */}
                {(status === 'not_started' || status === 'in_progress') && (
                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      onClick={() => onStatusChange('skipped')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Skip this step
                    </button>
                    <button
                      onClick={handleActionButton}
                      className="px-4 py-2 bg-[#6B46FE] text-white rounded-lg hover:bg-opacity-90"
                    >
                      {getActionButtonLabel()}
                    </button>
                  </div>
                )}

                {status === 'completed' && onNext && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={onNext}
                      className="bg-[#6B46FE] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 flex items-center gap-2"
                    >
                      <span>Next Step</span>
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                        <path d="M10 15l5-5-5-5M4 10h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}