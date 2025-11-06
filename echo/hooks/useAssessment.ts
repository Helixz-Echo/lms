/**
 * Assessment management custom hook
 */

"use client";

import { useState, useCallback } from 'react';
import type { AssessmentSession, AssessmentData, AssessmentQuestion } from '@/types';
import { postAPI } from '@/lib/utils';
import { API_ROUTES } from '@/config';

const initialAssessmentState: AssessmentSession = {
  isActive: false,
  totalQuestions: 0,
  currentQuestionIndex: 0,
  questions: [],
  answeredQuestions: [],
};

export function useAssessment(sessionId: string) {
  const [assessment, setAssessment] = useState<AssessmentSession>(initialAssessmentState);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({ questions: [] });
  const [finalFeedback, setFinalFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const startAssessment = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await postAPI(API_ROUTES.ASSESSMENT, {
        action: 'start',
        session_id: sessionId,
      });

      const questions: AssessmentQuestion[] = data.questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        context: q.context || [],
      }));

      setAssessment({
        isActive: true,
        totalQuestions: questions.length,
        currentQuestionIndex: 0,
        questions,
        answeredQuestions: [],
      });

      return questions[0];
    } catch (error) {
      console.error('Failed to start assessment:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const submitAnswer = useCallback(async (answer: string, conversationHistory: any[]) => {
    const currentQuestion = assessment.questions[assessment.currentQuestionIndex];

    const newAnsweredQuestions = [
      ...assessment.answeredQuestions,
      {
        question: currentQuestion.question_text,
        answer,
        questionId: currentQuestion.id,
      },
    ];

    const newAssessmentData = {
      questions: [
        ...assessmentData.questions,
        {
          question: currentQuestion.question_text,
          answer,
          context: currentQuestion.context || [],
        },
      ],
    };
    setAssessmentData(newAssessmentData);

    // Check if we've reached the total questions limit
    if (newAnsweredQuestions.length >= assessment.totalQuestions) {
      // Generate final feedback
      setIsLoading(true);
      try {
        const feedbackData = await postAPI(API_ROUTES.ASSESSMENT, {
          action: 'finish',
          session_id: sessionId,
          history: conversationHistory,
        });

        setFinalFeedback(feedbackData.feedback);
        setAssessment({
          ...assessment,
          isActive: false,
          answeredQuestions: newAnsweredQuestions,
        });

        return { completed: true, feedback: feedbackData.feedback };
      } catch (error) {
        console.error('Failed to generate feedback:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      // Get next question
      const nextQuestionIndex = assessment.currentQuestionIndex + 1;
      const nextQuestion = assessment.questions[nextQuestionIndex];

      setAssessment({
        ...assessment,
        currentQuestionIndex: nextQuestionIndex,
        answeredQuestions: newAnsweredQuestions,
      });

      return { completed: false, nextQuestion };
    }
  }, [assessment, assessmentData, sessionId]);

  const resetAssessment = useCallback(() => {
    setAssessment(initialAssessmentState);
    setAssessmentData({ questions: [] });
    setFinalFeedback('');
  }, []);

  return {
    // State
    assessment,
    assessmentData,
    finalFeedback,
    isLoading,

    // Methods
    startAssessment,
    submitAnswer,
    resetAssessment,
  };
}
